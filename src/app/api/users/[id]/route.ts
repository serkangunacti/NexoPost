import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSelf } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";
import { buildAppSession, ensureWorkspaceMembership, resolveActiveWorkspaceId } from "@/lib/workspaces";
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
    return NextResponse.json(appSession, {
      headers: { "Cache-Control": "no-store" },
    });
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
      activeClientId?: string | null;
      userProfile?: unknown;
    };

    const data: {
      activeClientId?: string;
      userProfile?: JsonNullable;
    } = {};

    if (body.activeClientId !== undefined) {
      if (body.activeClientId) {
        await ensureWorkspaceMembership(userId, body.activeClientId);
        data.activeClientId = body.activeClientId;
      } else {
        data.activeClientId = await resolveActiveWorkspaceId(userId);
      }
    }

    if (body.userProfile !== undefined) {
      const isObject =
        body.userProfile === null ||
        (typeof body.userProfile === "object" && !Array.isArray(body.userProfile));

      if (!isObject) {
        throw new ApiError(400, "Invalid profile payload");
      }

      data.userProfile = toJsonField(body.userProfile);
    }

    if (Object.keys(data).length === 0) {
      throw new ApiError(400, "No editable fields provided");
    }

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, ...data },
      update: data,
    });

    await logAuditEvent({
      action: "user.session.updated",
      entityType: "user",
      entityId: userId,
      userId,
      payload: {
        updatedActiveClientId: body.activeClientId !== undefined,
        updatedUserProfile: body.userProfile !== undefined,
      },
    });

    const nextSession = await buildAppSession(userId);
    return NextResponse.json(nextSession, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
