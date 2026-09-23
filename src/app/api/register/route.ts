import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { startPlan, type ActivationMode } from "@/lib/billing";
import { isPlanId } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    email?: string;
    password?: string;
    fullName?: string;
    companyName?: string;
    phone?: string;
    plan?: string;
    activationMode?: ActivationMode;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword: await bcrypt.hash(password, 12),
      fullName: body.fullName?.trim() ?? "",
      companyName: body.companyName?.trim() ?? "",
      phone: body.phone?.trim() ?? "",
      subscription: { create: {} },
    },
  });

  const plan = body.plan && isPlanId(body.plan) ? body.plan : "free";
  const result =
    plan === "free"
      ? null
      : await startPlan({
          userId: user.id,
          plan,
          billingCycle: "monthly",
          activationMode: body.activationMode === "paid" ? "paid" : "trial",
        });

  return NextResponse.json({ id: user.id, phase: result?.phase ?? "free" }, { status: 201 });
}
