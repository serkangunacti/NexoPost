import type { Prisma, SocialAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http";
import { deleteBlueskyOAuthSession } from "@/lib/blueskyOAuth";
import { decryptOptional, encryptOptional } from "@/lib/secrets";
import type { SocialTokenData } from "@/lib/socialAuth";

type MetadataRecord = Record<string, unknown>;

export type LinkedInTargetOption = {
  id: string;
  name: string;
  type: "profile" | "organization";
};

type StoredPageOption = {
  id: string;
  name: string;
  accessToken?: string;
};

export function parseMetadata(metadata: Prisma.JsonValue | null | undefined): MetadataRecord {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? (metadata as MetadataRecord) : {};
}

function parsePageOptions(metadata: Prisma.JsonValue | null | undefined): StoredPageOption[] {
  const rawPages = parseMetadata(metadata).availablePages;
  if (!Array.isArray(rawPages)) return [];

  return rawPages
    .filter((page): page is MetadataRecord => !!page && typeof page === "object" && !Array.isArray(page))
    .map((page) => ({
      id: typeof page.id === "string" ? page.id : "",
      name: typeof page.name === "string" ? page.name : "",
      accessToken: typeof page.accessToken === "string" ? page.accessToken : undefined,
    }))
    .filter((page) => page.id && page.name);
}

export function parseLinkedInTargets(metadata: Prisma.JsonValue | null | undefined): LinkedInTargetOption[] {
  const rawTargets = parseMetadata(metadata).linkedInTargets;
  if (!Array.isArray(rawTargets)) return [];

  return rawTargets
    .filter((target): target is MetadataRecord => !!target && typeof target === "object" && !Array.isArray(target))
    .map((target) => ({
      id: typeof target.id === "string" ? target.id : "",
      name: typeof target.name === "string" ? target.name : "",
      type: (target.type === "organization" ? "organization" : "profile") as LinkedInTargetOption["type"],
    }))
    .filter((target) => target.id && target.name);
}

// Page tokens returned by Meta live inside metadata; encrypt them like the column tokens.
function encryptMetadataSecrets(metadata: MetadataRecord): MetadataRecord {
  if (!Array.isArray(metadata.availablePages)) return metadata;

  return {
    ...metadata,
    availablePages: parsePageOptions(metadata as Prisma.JsonValue).map((page) => ({
      id: page.id,
      name: page.name,
      accessToken: encryptOptional(page.accessToken) ?? undefined,
    })),
  };
}

export function decryptSocialAccount(account: SocialAccount): SocialAccount {
  return {
    ...account,
    accessToken: decryptOptional(account.accessToken),
    refreshToken: decryptOptional(account.refreshToken),
    pageAccessToken: decryptOptional(account.pageAccessToken),
  };
}

export async function getConnectedSocialAccount(workspaceId: string, platform: string) {
  const account = await prisma.socialAccount.findUnique({
    where: { workspaceId_platform: { workspaceId, platform } },
  });

  return account && account.status === "CONNECTED" ? decryptSocialAccount(account) : null;
}

export async function saveSocialAccountTokens(
  accountId: string,
  tokens: { accessToken: string; refreshToken?: string | null; tokenExpiresAt: Date | null }
) {
  const updated = await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: encryptOptional(tokens.accessToken),
      ...(tokens.refreshToken ? { refreshToken: encryptOptional(tokens.refreshToken) } : {}),
      tokenExpiresAt: tokens.tokenExpiresAt,
    },
  });

  return decryptSocialAccount(updated);
}

export async function upsertSocialAccountFromToken(
  workspaceId: string,
  platform: string,
  token: Partial<SocialTokenData> & { accessToken: string }
) {
  const data = {
    externalAccountId: token.accountId ?? `${workspaceId}:${platform}`,
    displayName: token.accountName ?? platform,
    avatarUrl: token.accountAvatar,
    accessToken: encryptOptional(token.accessToken),
    refreshToken: encryptOptional(token.refreshToken),
    tokenExpiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
    scopes: token.scope ? [token.scope] : undefined,
    pageId: token.pageId,
    pageName: token.pageName,
    pageAccessToken: encryptOptional(token.pageAccessToken),
    status: "CONNECTED" as const,
    connectedAt: new Date(),
    metadata: encryptMetadataSecrets({ scope: token.scope ?? null, ...(token.metadata ?? {}) }) as Prisma.InputJsonValue,
  };

  return prisma.socialAccount.upsert({
    where: { workspaceId_platform: { workspaceId, platform } },
    create: { workspaceId, platform, ...data },
    update: data,
  });
}

export async function removeSocialAccount(workspaceId: string, platform: string) {
  const existing = await prisma.socialAccount.findUnique({
    where: { workspaceId_platform: { workspaceId, platform } },
    select: { externalAccountId: true, metadata: true },
  });

  if (!existing) return;

  if (platform === "bluesky") {
    const did = parseMetadata(existing.metadata).did;
    await deleteBlueskyOAuthSession(typeof did === "string" ? did : existing.externalAccountId);
  }

  await prisma.socialAccount.delete({
    where: { workspaceId_platform: { workspaceId, platform } },
  });
}

async function requireSocialAccount(workspaceId: string, platform: string) {
  const account = await prisma.socialAccount.findUnique({
    where: { workspaceId_platform: { workspaceId, platform } },
  });

  if (!account) {
    throw new ApiError(404, "Connected social account not found");
  }

  return account;
}

export async function selectMetaPage(workspaceId: string, platform: string, pageId: string) {
  const account = await requireSocialAccount(workspaceId, platform);
  const selectedPage = parsePageOptions(account.metadata).find((page) => page.id === pageId);
  if (!selectedPage) {
    throw new ApiError(400, "Selected page is not available for this connection");
  }

  await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      // Both values are already ciphertext.
      pageAccessToken: selectedPage.accessToken ?? account.pageAccessToken,
      metadata: {
        ...parseMetadata(account.metadata),
        selectedPublishTarget: selectedPage.id,
        publishTarget: "page",
        personalProfilePublishingSupported: false,
      },
    },
  });

  return { pageId: selectedPage.id, pageName: selectedPage.name };
}

export async function selectLinkedInTarget(workspaceId: string, targetId: string) {
  const account = await requireSocialAccount(workspaceId, "linkedin");
  const selectedTarget = parseLinkedInTargets(account.metadata).find((target) => target.id === targetId);
  if (!selectedTarget) {
    throw new ApiError(400, "Selected LinkedIn target is not available for this connection");
  }

  await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      metadata: {
        ...parseMetadata(account.metadata),
        selectedPublishTarget: selectedTarget.id,
        publishTarget: selectedTarget.type,
      },
    },
  });

  return selectedTarget;
}
