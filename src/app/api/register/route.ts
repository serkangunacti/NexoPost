import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSeedForEmail } from "@/lib/purchasedAccounts";
import { buildSubscriptionRecord } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    email: string;
    password: string;
    fullName?: string;
    companyName?: string;
    phone?: string;
    userType?: string;
    subscription?: unknown;
    pendingChange?: unknown;
  };

  const { email, password, fullName = "", companyName = "", phone = "", userType = "free", subscription = null, pendingChange = null } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const seed = getSeedForEmail(email);
  const userProfile = {
    companyName: companyName || seed?.fullName || "",
    email,
    fullName: fullName || seed?.fullName || "",
    phone,
    sessionId: crypto.randomUUID(),
    signedInAt: new Date().toISOString(),
  };

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      userType: (seed?.userType ?? userType) as string,
      activeClientId: seed?.workspaces?.[0]?.id ?? "",
      clients: (seed?.workspaces ?? []) as object[],
      connectedAccounts: (seed?.connectedAccounts ?? {}) as object,
      subscription: ((seed?.subscription ?? subscription) ?? buildSubscriptionRecord({
        billingCycle: "monthly",
        phase: "free",
        plan: "free",
      })) as Prisma.InputJsonValue,
      pendingChange: ((seed?.pendingChange ?? pendingChange) ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      userProfile: userProfile as object,
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
