import { randomUUID } from "node:crypto";
import type { Prisma, Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http";
import { logAuditEvent } from "@/lib/audit";
import { validateDiscountCode, type DiscountValidation } from "@/lib/discountCodes";
import { getPlanPriceCents, type BillingCycle, type PlanId } from "@/lib/plans";
import { PAYMENT_PROVIDER } from "@/lib/paymentMode";
import { addPaidDuration, getNextMonthStart } from "@/lib/subscription";

const TRIAL_DAYS = 15;

export type ActivationMode = "auto" | "trial" | "paid";

export type StartPlanResult = {
  effectiveAt: string;
  phase: "free" | "trial" | "paid";
  scheduled: boolean;
};

type ChargeInput = {
  amountCents: number;
  currency: string;
  description: string;
  userId: string;
};

type ChargeResult = { ok: true; reference: string } | { ok: false; error: string };

interface PaymentProvider {
  id: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
}

const testPaymentProvider: PaymentProvider = {
  id: "test",
  async charge() {
    return { ok: true, reference: `test_${randomUUID()}` };
  },
};

const paymentProviders: Record<string, PaymentProvider> = {
  test: testPaymentProvider,
};

function getPaymentProvider(): PaymentProvider {
  const provider = paymentProviders[PAYMENT_PROVIDER];
  if (!provider) {
    throw new ApiError(503, `Payment provider "${PAYMENT_PROVIDER}" is not available.`);
  }
  return provider;
}

export async function getSubscription(userId: string, tx: Prisma.TransactionClient = prisma): Promise<Subscription> {
  const subscription = await tx.subscription.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  if (!subscription.pendingPlan || !subscription.pendingBillingCycle || !subscription.pendingEffectiveAt) {
    return subscription;
  }

  if (subscription.pendingEffectiveAt.getTime() > Date.now()) {
    return subscription;
  }

  const periodStart = subscription.pendingEffectiveAt;
  return tx.subscription.update({
    where: { userId },
    data: {
      plan: subscription.pendingPlan,
      billingCycle: subscription.pendingBillingCycle,
      phase: "paid",
      currentPeriodStart: periodStart,
      currentPeriodEnd: addPaidDuration(periodStart, subscription.pendingBillingCycle),
      pendingPlan: null,
      pendingBillingCycle: null,
      pendingEffectiveAt: null,
    },
  });
}

function isActivePaid(subscription: Subscription, now: Date) {
  return (
    subscription.phase === "paid" &&
    !!subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd.getTime() > now.getTime()
  );
}

function resolvePhase(plan: PlanId, mode: ActivationMode, hasUsedTrial: boolean): StartPlanResult["phase"] {
  if (plan === "free") return "free";
  if (hasUsedTrial) return "paid";
  return mode === "paid" ? "paid" : "trial";
}

export async function startPlan(input: {
  userId: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  activationMode?: ActivationMode;
  discountCode?: string | null;
}): Promise<StartPlanResult> {
  const now = new Date();
  const subscription = await getSubscription(input.userId);

  // Changing an active paid package takes effect at the start of next month.
  if (
    isActivePaid(subscription, now) &&
    (subscription.plan !== input.plan || subscription.billingCycle !== input.billingCycle)
  ) {
    const effectiveAt = getNextMonthStart(now);
    await prisma.subscription.update({
      where: { userId: input.userId },
      data: {
        pendingPlan: input.plan,
        pendingBillingCycle: input.billingCycle,
        pendingEffectiveAt: effectiveAt,
      },
    });
    await logAuditEvent({
      action: "subscription.change_scheduled",
      entityType: "subscription",
      entityId: subscription.id,
      userId: input.userId,
      payload: { plan: input.plan, billingCycle: input.billingCycle, effectiveAt: effectiveAt.toISOString() },
    });
    return { effectiveAt: effectiveAt.toISOString(), phase: "paid", scheduled: true };
  }

  const phase = resolvePhase(input.plan, input.activationMode ?? "auto", subscription.hasUsedTrial);

  if (phase === "paid") {
    await chargeAndActivate({ ...input, discountCode: input.discountCode ?? null, now });
  } else {
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    await prisma.subscription.update({
      where: { userId: input.userId },
      data: {
        plan: input.plan,
        billingCycle: input.billingCycle,
        phase,
        hasUsedTrial: subscription.hasUsedTrial || phase === "trial",
        startedAt: now,
        currentPeriodStart: phase === "trial" ? now : null,
        currentPeriodEnd: phase === "trial" ? trialEnd : null,
        pendingPlan: null,
        pendingBillingCycle: null,
        pendingEffectiveAt: null,
      },
    });
    await logAuditEvent({
      action: phase === "trial" ? "subscription.trial_started" : "subscription.downgraded_to_free",
      entityType: "subscription",
      entityId: subscription.id,
      userId: input.userId,
      payload: { plan: input.plan, billingCycle: input.billingCycle },
    });
  }

  return { effectiveAt: now.toISOString(), phase, scheduled: false };
}

async function chargeAndActivate(input: {
  userId: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  discountCode: string | null;
  now: Date;
}) {
  const discount: DiscountValidation | null = input.discountCode
    ? await validateDiscountCode({
        billingCycle: input.billingCycle,
        code: input.discountCode,
        plan: input.plan,
        userId: input.userId,
      })
    : null;

  const basePriceCents = getPlanPriceCents(input.plan, input.billingCycle);
  const amountCents = discount
    ? Math.max(0, Math.round(basePriceCents * ((100 - discount.percentOff) / 100)))
    : basePriceCents;

  const provider = getPaymentProvider();
  const charge = await provider.charge({
    amountCents,
    currency: "USD",
    description: `NexoPost ${input.plan} (${input.billingCycle})`,
    userId: input.userId,
  });

  if (!charge.ok) {
    await prisma.payment.create({
      data: {
        userId: input.userId,
        provider: provider.id,
        plan: input.plan,
        billingCycle: input.billingCycle,
        amountCents,
        discountCodeId: discount?.codeId ?? null,
        discountPercent: discount?.percentOff ?? null,
        status: "FAILED",
        failureReason: charge.error,
      },
    });
    throw new ApiError(402, charge.error);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        userId: input.userId,
        provider: provider.id,
        providerRef: charge.reference,
        plan: input.plan,
        billingCycle: input.billingCycle,
        amountCents,
        discountCodeId: discount?.codeId ?? null,
        discountPercent: discount?.percentOff ?? null,
        status: "SUCCEEDED",
      },
    });

    await tx.subscription.update({
      where: { userId: input.userId },
      data: {
        plan: input.plan,
        billingCycle: input.billingCycle,
        phase: "paid",
        hasUsedTrial: true,
        startedAt: input.now,
        currentPeriodStart: input.now,
        currentPeriodEnd: addPaidDuration(input.now, input.billingCycle),
        pendingPlan: null,
        pendingBillingCycle: null,
        pendingEffectiveAt: null,
      },
    });

    if (discount) {
      await tx.discountCode.update({
        where: { id: discount.codeId },
        data: { redeemedCount: { increment: 1 } },
      });
      await tx.discountRedemption.create({
        data: {
          discountCodeId: discount.codeId,
          userId: input.userId,
          plan: input.plan,
          billingCycle: input.billingCycle,
          percentOff: discount.percentOff,
          orderContext: { amountCents, basePriceCents, provider: provider.id, reference: charge.reference },
        },
      });
    }
  });

  await logAuditEvent({
    action: "subscription.paid",
    entityType: "subscription",
    userId: input.userId,
    payload: { plan: input.plan, billingCycle: input.billingCycle, amountCents, provider: provider.id },
  });
}

// Superadmin override: activates a plan for one billing cycle without charging.
export async function assignPlan(userId: string, plan: PlanId) {
  const now = new Date();
  const subscription = await getSubscription(userId);
  const isFree = plan === "free";

  return prisma.subscription.update({
    where: { userId },
    data: {
      plan,
      phase: isFree ? "free" : "paid",
      hasUsedTrial: subscription.hasUsedTrial || !isFree,
      startedAt: now,
      currentPeriodStart: isFree ? null : now,
      currentPeriodEnd: isFree ? null : addPaidDuration(now, subscription.billingCycle),
      pendingPlan: null,
      pendingBillingCycle: null,
      pendingEffectiveAt: null,
    },
  });
}
