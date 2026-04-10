import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { redeemDiscountCode, validateDiscountCode } from "@/lib/discountCodes";
import { ApiError, toErrorResponse } from "@/lib/http";
import { isPlanId, type BillingCycle } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json() as {
      billingCycle?: BillingCycle;
      code?: string;
      email?: string | null;
      orderContext?: Record<string, unknown>;
      plan?: string;
    };

    if (!body.code?.trim()) {
      throw new ApiError(400, "code is required.");
    }

    if (!body.plan || !isPlanId(body.plan)) {
      throw new ApiError(400, "Valid plan is required.");
    }

    if (body.billingCycle !== "monthly" && body.billingCycle !== "annual") {
      throw new ApiError(400, "Valid billing cycle is required.");
    }

    const discount = await validateDiscountCode({
      billingCycle: body.billingCycle,
      code: body.code,
      plan: body.plan,
      userId: session?.user?.id ?? null,
    });

    await redeemDiscountCode({
      billingCycle: body.billingCycle,
      discount,
      email: body.email ?? session?.user?.email ?? null,
      orderContext: body.orderContext,
      plan: body.plan,
      userId: session?.user?.id ?? null,
    });

    return NextResponse.json({ redeemed: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
