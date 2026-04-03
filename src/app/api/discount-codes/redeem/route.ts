import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { redeemDiscountCode } from "@/lib/discountCodes";
import { ApiError, toErrorResponse } from "@/lib/http";
import { isPlanId, type BillingCycle } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json() as {
      billingCycle?: BillingCycle;
      codeId?: string;
      email?: string | null;
      orderContext?: Record<string, unknown>;
      percentOff?: number;
      plan?: string;
    };

    if (!body.codeId) {
      throw new ApiError(400, "codeId is required.");
    }

    if (!body.plan || !isPlanId(body.plan)) {
      throw new ApiError(400, "Valid plan is required.");
    }

    if (body.billingCycle !== "monthly" && body.billingCycle !== "annual") {
      throw new ApiError(400, "Valid billing cycle is required.");
    }

    await redeemDiscountCode({
      billingCycle: body.billingCycle,
      codeId: body.codeId,
      email: body.email ?? session?.user?.email ?? null,
      orderContext: body.orderContext,
      percentOff: body.percentOff ?? 0,
      plan: body.plan,
      userId: session?.user?.id ?? null,
    });

    return NextResponse.json({ redeemed: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
