import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type JsonNullable = Prisma.InputJsonValue | typeof Prisma.JsonNull;

function toJsonField(val: unknown): JsonNullable {
  return val === null ? Prisma.JsonNull : (val as Prisma.InputJsonValue);
}

// GET /api/users/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT /api/users/[id]  — upsert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as {
    userType?: string;
    activeClientId?: string | null;
    clients?: Prisma.InputJsonValue;
    connectedAccounts?: Prisma.InputJsonValue;
    subscription?: unknown;
    pendingChange?: unknown;
    userProfile?: unknown;
  };

  const data = {
    ...(body.userType !== undefined && { userType: body.userType }),
    ...(body.activeClientId !== undefined && { activeClientId: body.activeClientId }),
    ...(body.clients !== undefined && { clients: body.clients }),
    ...(body.connectedAccounts !== undefined && { connectedAccounts: body.connectedAccounts }),
    ...(body.subscription !== undefined && { subscription: toJsonField(body.subscription) }),
    ...(body.pendingChange !== undefined && { pendingChange: toJsonField(body.pendingChange) }),
    ...(body.userProfile !== undefined && { userProfile: toJsonField(body.userProfile) }),
  };

  const user = await prisma.user.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });

  return NextResponse.json(user);
}
