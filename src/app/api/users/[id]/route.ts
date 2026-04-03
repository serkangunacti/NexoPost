import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSelf } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";
import { buildAppSession, parseLegacyClients, syncWorkspacesForUser } from "@/lib/workspaces";
import { logAuditEvent } from "@/lib/audit";

type JsonNullable = Prisma.InputJsonValue | typeof Prisma.JsonNull;

function toJsonField(val: unknown): JsonNullable {
  return val === null ? Prisma.JsonNull : (val as Prisma.InputJsonValue);
}

// GET /api/users/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSelf(id);

    const appSession = await buildAppSession(id);
    return NextResponse.json(appSession);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PUT /api/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireSelf(id);
    const rateLimit = checkRateLimit({
      key: `users:update:${userId}`,
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      throw new ApiError(429, "Too many profile updates. Please slow down.");
    }

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

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, ...data },
      update: data,
    });

    if (body.clients !== undefined) {
      await syncWorkspacesForUser(userId, parseLegacyClients(body.clients));
    }

    await logAuditEvent({
      action: "user.session.updated",
      entityType: "user",
      entityId: userId,
      userId,
      payload: {
        hasClientsPayload: body.clients !== undefined,
        hasConnectedAccountsPayload: body.connectedAccounts !== undefined,
        hasSubscriptionPayload: body.subscription !== undefined,
      },
    });

    const nextSession = await buildAppSession(userId);
    return NextResponse.json(nextSession);
  } catch (error) {
    return toErrorResponse(error);
  }
}
