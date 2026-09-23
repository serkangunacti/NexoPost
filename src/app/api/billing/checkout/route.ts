import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";
import { startPlan, type ActivationMode } from "@/lib/billing";
import { isPlanId } from "@/lib/plans";

const ACTIVATION_MODES: ActivationMode[] = ["auto", "trial", "paid"];

// POST /api/billing/checkout
export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUser();
    const rateLimit = checkRateLimit({
      key: `billing:checkout:${userId}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      throw new ApiError(429, "Too many checkout attempts. Please try again shortly.");
    }

    const body = await request.json() as {
      activationMode?: unknown;
      billingCycle?: unknown;
      discountCode?: unknown;
      plan?: unknown;
    };

    if (typeof body.plan !== "string" || !isPlanId(body.plan)) {
      throw new ApiError(400, "Valid plan is required.");
    }

    if (body.billingCycle !== "monthly" && body.billingCycle !== "annual") {
      throw new ApiError(400, "Valid billing cycle is required.");
    }

    const activationMode = ACTIVATION_MODES.find((mode) => mode === body.activationMode) ?? "auto";
    const discountCode = typeof body.discountCode === "string" && body.discountCode.trim() ? body.discountCode : null;

    const result = await startPlan({
      userId,
      plan: body.plan,
      billingCycle: body.billingCycle,
      activationMode,
      discountCode,
    });

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
