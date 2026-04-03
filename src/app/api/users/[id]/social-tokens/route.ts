import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSelf } from "@/lib/authz";
import { ApiError, toErrorResponse } from "@/lib/http";
import { removeSocialAccount, parseLegacySocialTokens } from "@/lib/workspaces";
import { logAuditEvent } from "@/lib/audit";

type SafeTokenData = {
  accountId: string;
  accountName: string;
  accountAvatar?: string;
  connectedAt: string;
  pageId?: string;
  pageName?: string;
  scope?: string;
};

type SafeTokens = Record<string, Record<string, SafeTokenData>>;

function toSafeTokens(raw: Prisma.JsonValue | null): SafeTokens {
  const legacy = parseLegacySocialTokens(raw);
  const safe: SafeTokens = {};

  for (const [workspaceId, platforms] of Object.entries(legacy)) {
    safe[workspaceId] = {};
    for (const [platform, token] of Object.entries(platforms)) {
      safe[workspaceId][platform] = {
        accountId: token.accountId,
        accountName: token.accountName,
        accountAvatar: token.accountAvatar,
        connectedAt: token.connectedAt,
        pageId: token.pageId,
        pageName: token.pageName,
        scope: token.scope,
      };
    }
  }

  return safe;
}

// GET /api/users/[id]/social-tokens
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireSelf(id);

    const [user, memberships] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { socialTokens: true },
      }),
      prisma.workspaceMember.findMany({
        where: { userId },
        select: {
          workspaceId: true,
          workspace: {
            select: {
              socialAccounts: true,
            },
          },
        },
      }),
    ]);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const safe = toSafeTokens(user.socialTokens as Prisma.JsonValue | null);

    for (const membership of memberships) {
      safe[membership.workspaceId] ??= {};

      for (const account of membership.workspace.socialAccounts) {
        safe[membership.workspaceId][account.platform] = {
          accountId: account.externalAccountId,
          accountName: account.displayName,
          accountAvatar: account.avatarUrl ?? undefined,
          connectedAt: account.connectedAt.toISOString(),
          pageId: account.pageId ?? undefined,
          pageName: account.pageName ?? undefined,
          scope: Array.isArray(account.scopes) ? account.scopes.join(",") : undefined,
        };
      }
    }

    return NextResponse.json(safe);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// DELETE /api/users/[id]/social-tokens?clientId=xxx&platform=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireSelf(id);
    const clientId = request.nextUrl.searchParams.get("clientId");
    const platform = request.nextUrl.searchParams.get("platform");

    if (!clientId || !platform) {
      throw new ApiError(400, "clientId and platform required");
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { socialTokens: true, connectedAccounts: true } });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const tokens = parseLegacySocialTokens(user.socialTokens);
    const connectedAccounts = ((user.connectedAccounts ?? {}) as Record<string, string[]>) ?? {};

    if (tokens[clientId]) {
      delete tokens[clientId][platform];
      if (Object.keys(tokens[clientId]).length === 0) {
        delete tokens[clientId];
      }
    }

    if (connectedAccounts[clientId]) {
      connectedAccounts[clientId] = connectedAccounts[clientId].filter((entry) => entry !== platform);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        socialTokens: tokens as unknown as Prisma.InputJsonValue,
        connectedAccounts: connectedAccounts as unknown as Prisma.InputJsonValue,
      },
    });

    await removeSocialAccount(clientId, platform);

    await logAuditEvent({
      action: "social.disconnected",
      entityType: "social_account",
      entityId: `${clientId}:${platform}`,
      userId,
      workspaceId: clientId,
      payload: { platform },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
