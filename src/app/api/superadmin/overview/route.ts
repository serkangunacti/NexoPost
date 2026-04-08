import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperadminUser } from "@/lib/staff";
import { ApiError, toErrorResponse } from "@/lib/http";
import { logAuditEvent } from "@/lib/audit";
import type { SubscriptionRecord } from "@/lib/subscription";

function parseSubscription(value: Prisma.JsonValue | null): SubscriptionRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.plan !== "string" || typeof candidate.startedAt !== "string" || typeof candidate.billingCycle !== "string") {
    return null;
  }

  return {
    billingCycle: candidate.billingCycle as SubscriptionRecord["billingCycle"],
    currentPeriodEnd: typeof candidate.currentPeriodEnd === "string" ? candidate.currentPeriodEnd : null,
    currentPeriodStart: typeof candidate.currentPeriodStart === "string" ? candidate.currentPeriodStart : null,
    expiresAt: typeof candidate.expiresAt === "string" ? candidate.expiresAt : null,
    hasUsedTrial: Boolean(candidate.hasUsedTrial),
    phase: (candidate.phase as SubscriptionRecord["phase"]) ?? "free",
    plan: candidate.plan as SubscriptionRecord["plan"],
    startedAt: candidate.startedAt,
  };
}

export async function GET() {
  try {
    await requireSuperadminUser();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        userType: true,
        subscription: true,
        superadminNote: true,
        userProfile: true,
        workspaceMemberships: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
                members: { select: { id: true } },
                socialAccounts: {
                  select: {
                    id: true,
                    platform: true,
                    status: true,
                    displayName: true,
                    accessToken: true,
                    refreshToken: true,
                    tokenExpiresAt: true,
                    connectedAt: true,
                  },
                },
                publicationResults: {
                  select: {
                    status: true,
                  },
                  take: 50,
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
        supportRequests: {
          select: { id: true, status: true, subject: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    const payload = users.map((user) => {
      const subscription = parseSubscription(user.subscription as Prisma.JsonValue | null);
      const workspaces = user.workspaceMemberships.map((membership) => {
        const publishFailures = membership.workspace.publicationResults.filter((result) =>
          ["FAILED", "BLOCKED_QUOTA", "BLOCKED_X_BUDGET", "BLOCKED_PLAN_ACCESS", "BLOCKED_DAILY_CAP"].includes(result.status)
        ).length;

        return {
          id: membership.workspace.id,
          name: membership.workspace.name,
          status: membership.workspace.status,
          role: membership.role,
          memberCount: membership.workspace.members.length,
          createdAt: membership.workspace.createdAt.toISOString(),
          publishFailures,
          socialAccounts: membership.workspace.socialAccounts.map((account) => ({
            id: account.id,
            platform: account.platform,
            status: account.status,
            displayName: account.displayName,
            connectedAt: account.connectedAt.toISOString(),
            tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null,
            hasAccessToken: !!account.accessToken,
            hasRefreshToken: !!account.refreshToken,
          })),
        };
      });

      return {
        id: user.id,
        email: user.email,
        plan: user.userType,
        subscription,
        superadminNote: user.superadminNote,
        userProfile: user.userProfile,
        workspaceCount: workspaces.length,
        workspaces,
        supportRequests: user.supportRequests.map((request) => ({
          ...request,
          createdAt: request.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ users: payload }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireSuperadminUser();
    const body = await request.json() as
      | { type: "user"; userId: string; userType?: string; superadminNote?: string | null }
      | { type: "workspace"; workspaceId: string; status?: "ACTIVE" | "PAUSED" | "ARCHIVED" }
      | { type: "socialAccount"; socialAccountId: string; status?: "CONNECTED" | "DISCONNECTED" | "EXPIRED" | "ERROR" };

    if (body.type === "user") {
      if (!body.userId) throw new ApiError(400, "userId is required");
      await prisma.user.update({
        where: { id: body.userId },
        data: {
          ...(body.userType ? { userType: body.userType } : {}),
          ...(body.superadminNote !== undefined ? { superadminNote: body.superadminNote } : {}),
        },
      });
      await logAuditEvent({
        action: "superadmin.user.updated",
        entityType: "user",
        entityId: body.userId,
        userId: actor.userId,
        payload: {
          userType: body.userType ?? null,
          hasNote: body.superadminNote !== undefined,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.type === "workspace") {
      if (!body.workspaceId || !body.status) throw new ApiError(400, "workspaceId and status are required");
      await prisma.workspace.update({
        where: { id: body.workspaceId },
        data: { status: body.status },
      });
      await logAuditEvent({
        action: "superadmin.workspace.updated",
        entityType: "workspace",
        entityId: body.workspaceId,
        userId: actor.userId,
        workspaceId: body.workspaceId,
        payload: { status: body.status },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.type === "socialAccount") {
      if (!body.socialAccountId || !body.status) throw new ApiError(400, "socialAccountId and status are required");
      await prisma.socialAccount.update({
        where: { id: body.socialAccountId },
        data: { status: body.status },
      });
      await logAuditEvent({
        action: "superadmin.social_account.updated",
        entityType: "social_account",
        entityId: body.socialAccountId,
        userId: actor.userId,
        payload: { status: body.status },
      });
      return NextResponse.json({ ok: true });
    }

    throw new ApiError(400, "Unsupported patch operation");
  } catch (error) {
    return toErrorResponse(error);
  }
}
