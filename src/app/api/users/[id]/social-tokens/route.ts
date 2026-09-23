import { NextRequest, NextResponse } from "next/server";
import type { Prisma, SocialAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSelf, requireWorkspaceAccess } from "@/lib/authz";
import { ApiError, toErrorResponse } from "@/lib/http";
import {
  parseLinkedInTargets,
  parseMetadata,
  removeSocialAccount,
  selectLinkedInTarget,
  selectMetaPage,
  type LinkedInTargetOption,
} from "@/lib/socialAccounts";
import { logAuditEvent } from "@/lib/audit";

// Token-free view of a connection for the Connections page.
type SafeTokenData = {
  accountId: string;
  accountName: string;
  accountAvatar?: string;
  connectedAt: string;
  pageId?: string;
  pageName?: string;
  scope?: string;
  pageOptions?: Array<{ id: string; name: string }>;
  publishTarget?: "page" | "profile" | "organization" | "account";
  personalProfileSupported?: boolean;
  linkedInTargets?: LinkedInTargetOption[];
  selectedTargetId?: string;
  linkedInOrganizationAccessPending?: boolean;
  authMethod?: string;
};

function readString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

function readBoolean(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "boolean" ? value : undefined;
}

function readPublishTarget(metadata: Record<string, unknown>): SafeTokenData["publishTarget"] {
  const value = metadata.publishTarget;
  return value === "page" || value === "profile" || value === "organization" || value === "account" ? value : "page";
}

function readPageOptions(metadata: Record<string, unknown>) {
  const pages = metadata.availablePages;
  if (!Array.isArray(pages)) return [];

  return pages
    .filter((page): page is Record<string, unknown> => !!page && typeof page === "object" && !Array.isArray(page))
    .map((page) => ({
      id: typeof page.id === "string" ? page.id : "",
      name: typeof page.name === "string" ? page.name : "",
    }))
    .filter((page) => page.id && page.name);
}

function toSafeTokenData(account: SocialAccount): SafeTokenData {
  const metadata = parseMetadata(account.metadata as Prisma.JsonValue | null);
  return {
    accountId: account.externalAccountId,
    accountName: account.displayName,
    accountAvatar: account.avatarUrl ?? undefined,
    connectedAt: account.connectedAt.toISOString(),
    pageId: account.pageId ?? undefined,
    pageName: account.pageName ?? undefined,
    scope: Array.isArray(account.scopes) ? account.scopes.join(",") : undefined,
    pageOptions: readPageOptions(metadata),
    publishTarget: readPublishTarget(metadata),
    personalProfileSupported: readBoolean(metadata, "personalProfilePublishingSupported") ?? false,
    linkedInTargets: parseLinkedInTargets(account.metadata as Prisma.JsonValue | null),
    selectedTargetId: readString(metadata, "selectedPublishTarget"),
    linkedInOrganizationAccessPending: readBoolean(metadata, "organizationAccessPending") ?? false,
    authMethod: readString(metadata, "authMethod"),
  };
}

// GET /api/users/[id]/social-tokens
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireSelf(id);

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: {
        workspaceId: true,
        workspace: { select: { socialAccounts: true } },
      },
    });

    const safe: Record<string, Record<string, SafeTokenData>> = {};
    for (const membership of memberships) {
      safe[membership.workspaceId] = Object.fromEntries(
        membership.workspace.socialAccounts.map((account) => [account.platform, toSafeTokenData(account)])
      );
    }

    return NextResponse.json(safe, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/users/[id]/social-tokens — choose the Meta page or LinkedIn target to publish to.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSelf(id);
    const body = await request.json() as {
      clientId?: string;
      platform?: string;
      pageId?: string;
      targetId?: string;
    };

    const platform = body.platform?.trim() ?? "";
    const pageId = body.pageId?.trim() ?? "";
    const targetId = body.targetId?.trim() ?? "";

    if (!body.clientId?.trim() || !platform) {
      throw new ApiError(400, "clientId and platform are required");
    }

    const { userId, workspaceId } = await requireWorkspaceAccess(body.clientId.trim());

    if (platform === "linkedin") {
      if (!targetId) {
        throw new ApiError(400, "targetId is required for LinkedIn target selection");
      }

      const result = await selectLinkedInTarget(workspaceId, targetId);

      await logAuditEvent({
        action: "social.target_selected",
        entityType: "social_account",
        entityId: `${workspaceId}:${platform}`,
        userId,
        workspaceId,
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

    if (platform !== "facebook" && platform !== "instagram") {
      throw new ApiError(400, "Selection updates are only available for Meta family connections or LinkedIn");
    }

    if (!pageId) {
      throw new ApiError(400, "pageId is required for Meta page selection");
    }

    const result = await selectMetaPage(workspaceId, platform, pageId);

    await logAuditEvent({
      action: "social.page_selected",
      entityType: "social_account",
      entityId: `${workspaceId}:${platform}`,
      userId,
      workspaceId,
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
    await requireSelf(id);
    const clientId = request.nextUrl.searchParams.get("clientId");
    const platform = request.nextUrl.searchParams.get("platform");

    if (!clientId || !platform) {
      throw new ApiError(400, "clientId and platform required");
    }

    const { userId, workspaceId } = await requireWorkspaceAccess(clientId);
    await removeSocialAccount(workspaceId, platform);

    await logAuditEvent({
      action: "social.disconnected",
      entityType: "social_account",
      entityId: `${workspaceId}:${platform}`,
      userId,
      workspaceId,
      payload: { platform },
    });

    return NextResponse.json({ ok: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
