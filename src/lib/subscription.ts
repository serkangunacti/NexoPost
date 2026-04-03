import {
  BillingCycle,
  type PlanId,
  formatPriceCents,
  getPlanConfig,
  getPlanLabel,
} from "@/lib/plans";

export type { BillingCycle, PlanId };

export interface PendingPlanChange {
  billingCycle: BillingCycle;
  effectiveAt: string;
  plan: PlanId;
}

export interface SubscriptionRecord {
  billingCycle: BillingCycle;
  currentPeriodEnd?: string | null;
  currentPeriodStart?: string | null;
  expiresAt?: string | null;
  hasUsedTrial: boolean;
  phase: "free" | "trial" | "paid";
  plan: PlanId;
  startedAt: string;
}

export interface SubscriptionSnapshot {
  canPublish: boolean;
  currentPeriodLabel: string;
  expiresAtLabel: string;
  isExpired: boolean;
  isFree: boolean;
  isTrial: boolean;
  pendingChangeLabel: string | null;
  phaseLabel: string;
  planLabel: string;
  priceLabel: string;
  renewLabel: string;
  statusLabel: string;
  timeLeftLabel: string;
}

const billingLabels: Record<BillingCycle, string> = {
  annual: "Annual",
  monthly: "Monthly",
};

export function getSubscriptionSnapshot(subscription: SubscriptionRecord | null): SubscriptionSnapshot {
  if (!subscription) {
    return {
      canPublish: false,
      currentPeriodLabel: "No active period",
      expiresAtLabel: "No active expiration date",
      isExpired: true,
      isFree: false,
      isTrial: false,
      pendingChangeLabel: null,
      phaseLabel: "No plan",
      planLabel: "No plan",
      priceLabel: "$0",
      renewLabel: "Choose a plan to unlock publishing",
      statusLabel: "Inactive",
      timeLeftLabel: "No active access",
    };
  }

  const now = new Date();
  const isFree = subscription.phase === "free" || subscription.plan === "free";
  const isTrial = subscription.phase === "trial";
  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
  const isExpired = isFree ? false : expiresAt ? expiresAt.getTime() <= now.getTime() : false;
  const plan = getPlanConfig(subscription.plan);
  const expiresAtLabel = isFree ? "No expiration" : subscription.expiresAt ? formatDate(subscription.expiresAt) : "No expiration";

  let timeLeftLabel = "No active access";
  if (isFree) {
    timeLeftLabel = "Lifetime access";
  } else if (expiresAt) {
    const msRemaining = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    timeLeftLabel = isExpired
      ? `Expired on ${expiresAtLabel}`
      : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;
  }

  return {
    canPublish: isFree || !isExpired,
    currentPeriodLabel: formatCurrentPeriod(subscription),
    expiresAtLabel,
    isExpired,
    isFree,
    isTrial,
    pendingChangeLabel: null,
    phaseLabel: isFree ? "Free Plan" : isTrial ? "Trial" : `${billingLabels[subscription.billingCycle]} Plan`,
    planLabel: getPlanLabel(subscription.plan),
    priceLabel: isFree ? "$0" : `$${formatPriceCents(subscription.billingCycle === "annual" ? plan.annualPriceCents : plan.monthlyPriceCents)}`,
    renewLabel: isExpired
      ? "Renew your package to publish new posts again."
      : isFree
        ? "Facebook and Instagram are available with daily caps."
        : isTrial
          ? "You are on a free trial. You can upgrade to a paid package at any time."
          : `${billingLabels[subscription.billingCycle]} access is active.`,
    statusLabel: isExpired ? "Expired" : isFree ? "Free" : isTrial ? "Trialing" : "Active",
    timeLeftLabel,
  };
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function formatDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function formatCurrentPeriod(subscription: SubscriptionRecord) {
  if (subscription.phase === "free" || subscription.plan === "free") {
    return "Lifetime access";
  }

  if (subscription.currentPeriodStart && subscription.currentPeriodEnd) {
    return `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`;
  }

  if (subscription.startedAt && subscription.expiresAt) {
    return `${formatDate(subscription.startedAt)} - ${formatDate(subscription.expiresAt)}`;
  }

  return "Current billing period";
}

export function getNextMonthStart(fromDate = new Date()): Date {
  return new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function addPaidDuration(startDate: Date, billingCycle: BillingCycle): Date {
  const nextDate = new Date(startDate);
  if (billingCycle === "annual") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
  }

  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

export function buildSubscriptionRecord(input: {
  billingCycle: BillingCycle;
  hasUsedTrial?: boolean;
  phase: SubscriptionRecord["phase"];
  plan: PlanId;
  startedAt?: Date;
}) {
  const startedAt = input.startedAt ?? new Date();
  const currentPeriodEnd =
    input.phase === "free" ? null : addPaidDuration(startedAt, input.billingCycle).toISOString();

  return {
    billingCycle: input.billingCycle,
    currentPeriodEnd,
    currentPeriodStart: input.phase === "free" ? null : startedAt.toISOString(),
    expiresAt: currentPeriodEnd,
    hasUsedTrial: input.hasUsedTrial ?? input.phase !== "free",
    phase: input.phase,
    plan: input.plan,
    startedAt: startedAt.toISOString(),
  } satisfies SubscriptionRecord;
}
