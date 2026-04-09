import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSelf } from "@/lib/authz";
import { ApiError, toErrorResponse } from "@/lib/http";
import {
  removeSocialAccount,
  parseLegacySocialTokens,
  updateLinkedInPublishTarget,
  updateSocialAccountPageSelection,
} from "@/lib/workspaces";
import { logAuditEvent } from "@/lib/audit";

type SafePageOption = {
  id: string;
  name: string;
};

type SafeLinkedInTarget = {
  id: string;
  name: string;
  type: "profile" | "organization";
};

type SafeTokenData = {
  accountId: string;
  accountName: string;
  accountAvatar?: string;
  connectedAt: string;
  pageId?: string;
  pageName?: string;
  scope?: string;
  pageOptions?: SafePageOption[];
  publishTarget?: "page" | "profile" | "organization" | "account";
  personalProfileSupported?: boolean;
  linkedInTargets?: SafeLinkedInTarget[];
  selectedTargetId?: string;
  linkedInOrganizationAccessPending?: boolean;
  authMethod?: string;
};

type SafeTokens = Record<string, Record<string, SafeTokenData>>;

function parseSafePageOptions(metadata: Prisma.JsonValue | null): SafePageOption[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const availablePages = (metadata as Record<string, unknown>).availablePages;
  if (!Array.isArray(availablePages)) {
    return [];
  }

  return availablePages
    .filter((page): page is Record<string, unknown> => !!page && typeof page === "object" && !Array.isArray(page))
    .map((page) => ({
      id: typeof page.id === "string" ? page.id : "",
      name: typeof page.name === "string" ? page.name : "",
    }))
    .filter((page) => page.id && page.name);
}

function parseLinkedInTargets(metadata: Prisma.JsonValue | null): SafeLinkedInTarget[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const linkedInTargets = (metadata as Record<string, unknown>).linkedInTargets;
  if (!Array.isArray(linkedInTargets)) {
    return [];
  }

  return linkedInTargets
    .filter((target): target is Record<string, unknown> => !!target && typeof target === "object" && !Array.isArray(target))
    .map((target) => ({
      id: typeof target.id === "string" ? target.id : "",
      name: typeof target.name === "string" ? target.name : "",
      type: (target.type === "organization" ? "organization" : "profile") as "profile" | "organization",
    }))
    .filter((target) => target.id && target.name);
}

function parseMetadataRecord(metadata: Prisma.JsonValue | null): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, unknown>;
}

function parsePublishTarget(metadata: Prisma.JsonValue | null): SafeTokenData["publishTarget"] {
  const value = parseMetadataRecord(metadata).publishTarget;
  if (value === "page" || value === "profile" || value === "organization" || value === "account") {
    return value;
  }

  return "page";
}

function parseBooleanFlag(metadata: Prisma.JsonValue | null, key: string): boolean | undefined {
  const value = parseMetadataRecord(metadata)[key];
  return typeof value === "boolean" ? value : undefined;
}

function parseStringFlag(metadata: Prisma.JsonValue | null, key: string): string | undefined {
  const value = parseMetadataRecord(metadata)[key];
  return typeof value === "string" ? value : undefined;
}

function toSafeTokens(raw: Prisma.JsonValue | null): SafeTokens {
  const legacy = parseLegacySocialTokens(raw);
  const safe: SafeTokens = {};

  for (const [workspaceId, platforms] of Object.entries(legacy)) {
    safe[workspaceId] = {};
    for (const [platform, token] of Object.entries(platforms)) {
      const metadata = (token.metadata ?? null) as Prisma.JsonValue | null;
      safe[workspaceId][platform] = {
        accountId: token.accountId,
        accountName: token.accountName,
        accountAvatar: token.accountAvatar,
        connectedAt: token.connectedAt,
        pageId: token.pageId,
        pageName: token.pageName,
        scope: token.scope,
        pageOptions: parseSafePageOptions(metadata),
        publishTarget: parsePublishTarget(metadata),
        personalProfileSupported: parseBooleanFlag(metadata, "personalProfilePublishingSupported") ?? false,
        linkedInTargets: parseLinkedInTargets(metadata),
        selectedTargetId: parseStringFlag(metadata, "selectedPublishTarget"),
        linkedInOrganizationAccessPending: parseBooleanFlag(metadata, "organizationAccessPending") ?? false,
        authMethod: parseStringFlag(metadata, "authMethod"),
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
        const metadata = account.metadata as Prisma.JsonValue | null;
        safe[membership.workspaceId][account.platform] = {
          accountId: account.externalAccountId,
          accountName: account.displayName,
          accountAvatar: account.avatarUrl ?? undefined,
          connectedAt: account.connectedAt.toISOString(),
          pageId: account.pageId ?? undefined,
          pageName: account.pageName ?? undefined,
          scope: Array.isArray(account.scopes) ? account.scopes.join(",") : undefined,
          pageOptions: parseSafePageOptions(metadata),
          publishTarget: parsePublishTarget(metadata),
          personalProfileSupported: parseBooleanFlag(metadata, "personalProfilePublishingSupported") ?? false,
          linkedInTargets: parseLinkedInTargets(metadata),
          selectedTargetId: parseStringFlag(metadata, "selectedPublishTarget"),
          linkedInOrganizationAccessPending: parseBooleanFlag(metadata, "organizationAccessPending") ?? false,
          authMethod: parseStringFlag(metadata, "authMethod"),
        };
      }
    }

    return NextResponse.json(safe, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireSelf(id);
    const body = await request.json() as {
      clientId?: string;
      platform?: string;
      pageId?: string;
      targetId?: string;
    };

    const clientId = body.clientId?.trim() ?? "";
    const platform = body.platform?.trim() ?? "";
    const pageId = body.pageId?.trim() ?? "";
    const targetId = body.targetId?.trim() ?? "";

    if (!clientId || !platform) {
      throw new ApiError(400, "clientId and platform are required");
    }

    if (platform === "linkedin") {
      if (!targetId) {
        throw new ApiError(400, "targetId is required for LinkedIn target selection");
      }

      const result = await updateLinkedInPublishTarget(userId, clientId, targetId);

      await logAuditEvent({
        action: "social.target_selected",
        entityType: "social_account",
        entityId: `${clientId}:${platform}`,
        userId,
        workspaceId: clientId,
        payload: {
          platform,
          targetId: result.id,
          targetName: result.name,
          targetType: result.type,
        },
      });

      return NextResponse.json({ ok: true, ...result }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (!["facebook", "instagram", "threads"].includes(platform)) {
      throw new ApiError(400, "Selection updates are only available for Meta family connections or LinkedIn");
    }

    if (!pageId) {
      throw new ApiError(400, "pageId is required for Meta page selection");
    }

    const result = await updateSocialAccountPageSelection(userId, clientId, platform, pageId);

    await logAuditEvent({
      action: "social.page_selected",
      entityType: "social_account",
      entityId: `${clientId}:${platform}`,
      userId,
      workspaceId: clientId,
      payload: {
        platform,
        pageId: result.pageId,
        pageName: result.pageName,
      },
    });

    return NextResponse.json({ ok: true, ...result }, {
      headers: { "Cache-Control": "no-store" },
    });
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

    return NextResponse.json({ ok: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
