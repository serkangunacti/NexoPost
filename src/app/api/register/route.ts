import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildSubscriptionRecord } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    email: string;
    password: string;
    fullName?: string;
    companyName?: string;
    phone?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const fullName = body.fullName?.trim() ?? "";
  const companyName = body.companyName?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const userProfile = {
    companyName,
    email,
    fullName,
    phone,
    sessionId: crypto.randomUUID(),
    signedInAt: new Date().toISOString(),
  };

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      userType: "free",
      activeClientId: "",
      clients: [] as object[],
      connectedAccounts: {} as object,
      subscription: buildSubscriptionRecord({
        billingCycle: "monthly",
        phase: "free",
        plan: "free",
      }) as unknown as Prisma.InputJsonValue,
      pendingChange: Prisma.JsonNull as unknown as Prisma.InputJsonValue,
      userProfile: userProfile as object,
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
