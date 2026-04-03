import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, toErrorResponse } from "@/lib/http";
import { requireStaffUser } from "@/lib/staff";
import { isPlanId, type BillingCycle } from "@/lib/plans";

function coerceStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function GET() {
  try {
    await requireStaffUser();
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(codes);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaffUser();
    const body = await request.json() as {
      allowedBillingCycles?: string[];
      allowedPlans?: string[];
      code?: string;
      expiresAt?: string | null;
      isActive?: boolean;
      maxRedemptions?: number | null;
      percentOff?: number;
      startsAt?: string | null;
    };

    const code = body.code?.trim().toUpperCase() ?? "";
    if (!code) {
      throw new ApiError(400, "Code is required.");
    }

    if (!Number.isInteger(body.percentOff) || (body.percentOff ?? 0) <= 0 || (body.percentOff ?? 0) > 100) {
      throw new ApiError(400, "Percent off must be between 1 and 100.");
    }

    const allowedPlans = coerceStringArray(body.allowedPlans).filter(isPlanId);
    const allowedBillingCycles = coerceStringArray(body.allowedBillingCycles).filter(
      (cycle): cycle is BillingCycle => cycle === "monthly" || cycle === "annual"
    );

    const created = await prisma.discountCode.create({
      data: {
        allowedBillingCycles: allowedBillingCycles as unknown as Prisma.InputJsonValue,
        allowedPlans: allowedPlans as unknown as Prisma.InputJsonValue,
        code,
        createdById: staff.userId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive ?? true,
        maxRedemptions: body.maxRedemptions ?? null,
        percentOff: body.percentOff ?? 0,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
