import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateDiscountCode } from "@/lib/discountCodes";
import { ApiError, toErrorResponse } from "@/lib/http";
import { isPlanId, type BillingCycle } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json() as {
      billingCycle?: BillingCycle;
      code?: string;
      plan?: string;
    };

    if (!body.plan || !isPlanId(body.plan)) {
      throw new ApiError(400, "Valid plan is required.");
    }

    if (body.billingCycle !== "monthly" && body.billingCycle !== "annual") {
      throw new ApiError(400, "Valid billing cycle is required.");
    }

    const valid = await validateDiscountCode({
      billingCycle: body.billingCycle,
      code: body.code ?? "",
      plan: body.plan,
      userId: session?.user?.id ?? null,
    });

    return NextResponse.json(valid);
  } catch (error) {
    return toErrorResponse(error);
  }
}
