import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSelf } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";
import { buildAppSession, setActiveWorkspace } from "@/lib/workspaces";
import { logAuditEvent } from "@/lib/audit";

const PROFILE_FIELDS = ["fullName", "companyName", "phone"] as const;
const MAX_PROFILE_FIELD_LENGTH = 120;

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
      activeClientId?: unknown;
      fullName?: unknown;
      companyName?: unknown;
      phone?: unknown;
    };

    const profile: Partial<Record<(typeof PROFILE_FIELDS)[number], string>> = {};
    for (const field of PROFILE_FIELDS) {
      const value = body[field];
      if (value === undefined) continue;
      if (typeof value !== "string") {
        throw new ApiError(400, `${field} must be a string`);
      }
      profile[field] = value.trim().slice(0, MAX_PROFILE_FIELD_LENGTH);
    }

    const updatesActiveWorkspace = typeof body.activeClientId === "string" && body.activeClientId !== "";
    if (!updatesActiveWorkspace && Object.keys(profile).length === 0) {
      throw new ApiError(400, "No editable fields provided");
    }

    if (updatesActiveWorkspace) {
      await setActiveWorkspace(userId, body.activeClientId as string);
    }

    if (Object.keys(profile).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: profile,
      });
    }

    await logAuditEvent({
      action: "user.session.updated",
      entityType: "user",
      entityId: userId,
      userId,
      payload: {
        updatedActiveWorkspace: updatesActiveWorkspace,
        updatedProfileFields: Object.keys(profile),
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
