import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http";
import { isPlanId, type BillingCycle, type PlanId } from "@/lib/plans";

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  return [];
}

export type DiscountValidation = {
  codeId: string;
  code: string;
  percentOff: number;
};

export async function validateDiscountCode(input: {
  billingCycle: BillingCycle;
  code: string;
  plan: PlanId;
  userId?: string | null;
}) {
  const normalized = input.code.trim().toUpperCase();
  if (!normalized) {
    throw new ApiError(400, "Discount code is required.");
  }

  const code = await prisma.discountCode.findUnique({
    where: { code: normalized },
  });

  if (!code || !code.isActive) {
    throw new ApiError(404, "Discount code not found.");
  }

  const now = new Date();
  if (code.startsAt && code.startsAt > now) {
    throw new ApiError(400, "Discount code is not active yet.");
  }

  if (code.expiresAt && code.expiresAt < now) {
    throw new ApiError(400, "Discount code has expired.");
  }

  if (code.maxRedemptions !== null && code.redeemedCount >= code.maxRedemptions) {
    throw new ApiError(400, "Discount code usage limit has been reached.");
  }

  const allowedPlans = parseStringArray(code.allowedPlans).filter(isPlanId);
  if (allowedPlans.length > 0 && !allowedPlans.includes(input.plan)) {
    throw new ApiError(400, "Discount code is not valid for this plan.");
  }

  const allowedBillingCycles = parseStringArray(code.allowedBillingCycles).filter(
    (cycle): cycle is BillingCycle => cycle === "monthly" || cycle === "annual"
  );
  if (allowedBillingCycles.length > 0 && !allowedBillingCycles.includes(input.billingCycle)) {
    throw new ApiError(400, "Discount code is not valid for this billing cycle.");
  }

  if (input.userId) {
    const paidBefore = await prisma.payment.count({
      where: { userId: input.userId, status: "SUCCEEDED" },
    });
    if (paidBefore > 0) {
      throw new ApiError(400, "Discount codes apply only to the first paid purchase.");
    }
  }

  return {
    code: code.code,
    codeId: code.id,
    percentOff: code.percentOff,
  } satisfies DiscountValidation;
}
