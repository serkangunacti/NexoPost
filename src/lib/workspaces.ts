import type { Prisma, SocialAccount, WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http";
import type { SocialTokens, SocialTokenData } from "@/lib/socialAuth";
import { deleteBlueskyOAuthSession } from "@/lib/blueskyOAuth";
import { isStaffEmail, isSuperadminEmail } from "@/lib/staff";

type LegacyClient = {
  id: string;
  name: string;
};

type LegacyConnectedAccounts = Record<string, string[]>;

type AppSessionPayload = {
  activeClientId: string;
  clients: LegacyClient[];
  connectedAccounts: LegacyConnectedAccounts;
  isStaff: boolean;
  isSuperadmin: boolean;
  isLoggedIn: boolean;
  pendingChange: Prisma.JsonValue | null;
  subscription: Prisma.JsonValue | null;
  userProfile: Prisma.JsonValue | null;
  userType: string;
};

function parseArrayJson<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function parseObjectJson<T extends Record<string, unknown>>(value: unknown): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      return {} as T;
    }
  }

  return {} as T;
}

export function parseLegacyClients(value: unknown): LegacyClient[] {
  return parseArrayJson<LegacyClient>(value)
    .filter((client) => client && typeof client.id === "string" && typeof client.name === "string")
    .map((client) => ({ id: client.id, name: client.name.trim() || "Workspace" }));
}

export function parseLegacyConnectedAccounts(value: unknown): LegacyConnectedAccounts {
  const raw = parseObjectJson<Record<string, unknown>>(value);
  const result: LegacyConnectedAccounts = {};

  for (const [workspaceId, platforms] of Object.entries(raw)) {
    if (!Array.isArray(platforms)) continue;
    result[workspaceId] = platforms.filter((platform): platform is string => typeof platform === "string");
  }

  return result;
}

export function parseLegacySocialTokens(value: unknown): SocialTokens {
  return parseObjectJson<SocialTokens>(value);
}

async function bootstrapMissingWorkspaces(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      activeClientId: true,
      clients: true,
      connectedAccounts: true,
      socialTokens: true,
      userProfile: true,
      workspaceMemberships: {
        select: { workspaceId: true },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const workspaceIds = new Set(user.workspaceMemberships.map((membership) => membership.workspaceId));
  const legacyClients = parseLegacyClients(user.clients);
  const tokens = parseLegacySocialTokens(user.socialTokens);
  const connectedAccounts = parseLegacyConnectedAccounts(user.connectedAccounts);
  const profile = parseObjectJson<{ companyName?: string }>(user.userProfile);

  const seedClients =
    legacyClients.length > 0
      ? legacyClients
      : [
          {
            id: user.activeClientId || `workspace_${user.id}`,
            name: profile.companyName?.trim() || "Main Workspace",
          },
        ];

  for (const client of seedClients) {
    if (workspaceIds.has(client.id)) continue;

    await prisma.workspace.upsert({
      where: { id: client.id },
      create: {
        id: client.id,
        name: client.name,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
        brandProfile: {
          create: {
            emailSender: profile.companyName?.trim() || client.name,
          },
        },
      },
      update: {
        name: client.name,
        ownerId: user.id,
        members: {
          upsert: {
            where: {
              workspaceId_userId: {
                workspaceId: client.id,
                userId: user.id,
              },
            },
            create: {
              userId: user.id,
              role: "OWNER",
            },
            update: {
              role: "OWNER",
            },
          },
        },
      },
    });
  }

  for (const [workspaceId, platformTokens] of Object.entries(tokens)) {
    if (!seedClients.some((client) => client.id === workspaceId)) continue;

    for (const [platform, token] of Object.entries(platformTokens)) {
      await upsertSocialAccountFromToken(workspaceId, platform, token);
    }
  }

  for (const [workspaceId, platforms] of Object.entries(connectedAccounts)) {
    if (!seedClients.some((client) => client.id === workspaceId)) continue;

    for (const platform of platforms) {
      await prisma.socialAccount.upsert({
        where: {
          workspaceId_platform: {
            workspaceId,
            platform,
          },
        },
        create: {
          workspaceId,
          platform,
          externalAccountId: `${workspaceId}:${platform}`,
          displayName: platform,
          status: "DISCONNECTED",
        },
        update: {},
      });
    }
  }

  const nextActiveClientId =
    seedClients.find((client) => client.id === user.activeClientId)?.id ?? seedClients[0]?.id ?? "";

  if (nextActiveClientId && nextActiveClientId !== user.activeClientId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeClientId: nextActiveClientId },
    });
  }
}

export async function ensureWorkspaceMembership(
  userId: string,
  workspaceId: string,
  allowedRoles?: WorkspaceRole[]
) {
  await bootstrapMissingWorkspaces(userId);

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new ApiError(403, "Workspace access denied");
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new ApiError(403, "Workspace role is not sufficient for this action");
  }

  return membership;
}

export async function resolveActiveWorkspaceId(userId: string, preferredWorkspaceId?: string) {
  await bootstrapMissingWorkspaces(userId);

  if (preferredWorkspaceId) {
    return preferredWorkspaceId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeClientId: true,
      workspaceMemberships: {
        orderBy: { createdAt: "asc" },
        select: { workspaceId: true },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user.activeClientId || user.workspaceMemberships[0]?.workspaceId || "";
}

export async function buildAppSession(userId: string): Promise<AppSessionPayload> {
  await bootstrapMissingWorkspaces(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      userType: true,
      activeClientId: true,
      email: true,
      pendingChange: true,
      subscription: true,
      userProfile: true,
      connectedAccounts: true,
      workspaceMemberships: {
        orderBy: { createdAt: "asc" },
        select: {
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              name: true,
              socialAccounts: {
                select: { platform: true, status: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const clients = user.workspaceMemberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
  }));

  const legacyConnectedAccounts = parseLegacyConnectedAccounts(user.connectedAccounts);
  const connectedAccounts = clients.reduce<LegacyConnectedAccounts>((acc, client) => {
    const workspace = user.workspaceMemberships.find((membership) => membership.workspaceId === client.id)?.workspace;
    const connectedFromRecords =
      workspace?.socialAccounts
        .filter((account) => account.status === "CONNECTED" || account.status === "DISCONNECTED")
        .map((account) => account.platform) ?? [];

    acc[client.id] = Array.from(new Set([...(legacyConnectedAccounts[client.id] ?? []), ...connectedFromRecords]));
    return acc;
  }, {});

  const activeClientId =
    clients.find((client) => client.id === user.activeClientId)?.id ?? clients[0]?.id ?? "";

  if (activeClientId && activeClientId !== user.activeClientId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeClientId },
    });
  }

  return {
    activeClientId,
    clients,
    connectedAccounts,
    isStaff: !!user.email && isStaffEmail(user.email),
    isSuperadmin: !!user.email && isSuperadminEmail(user.email),
    isLoggedIn: true,
    pendingChange: (user.pendingChange as Prisma.JsonValue | null) ?? null,
    subscription: (user.subscription as Prisma.JsonValue | null) ?? null,
    userProfile: (user.userProfile as Prisma.JsonValue | null) ?? null,
    userType: user.userType,
  };
}

export async function syncWorkspacesForUser(userId: string, clients: LegacyClient[]) {
  await bootstrapMissingWorkspaces(userId);

  const current = await prisma.workspace.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });

  const nextIds = new Set(clients.map((client) => client.id));
  const currentIds = new Set(current.map((workspace) => workspace.id));

  for (const client of clients) {
    await prisma.workspace.upsert({
      where: { id: client.id },
      create: {
        id: client.id,
        name: client.name,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      update: {
        name: client.name,
      },
    });
  }

  const staleWorkspaceIds = Array.from(currentIds).filter((workspaceId) => !nextIds.has(workspaceId));

  if (staleWorkspaceIds.length > 0) {
    await prisma.workspace.deleteMany({
      where: {
        ownerId: userId,
        id: { in: staleWorkspaceIds },
      },
    });
  }
}

export async function upsertSocialAccountFromToken(
  workspaceId: string,
  platform: string,
  token: Partial<SocialTokenData> & { accessToken: string }
) {
  const nextStatus = token.accessToken ? "CONNECTED" : "DISCONNECTED";
  const metadata = {
    scope: token.scope ?? null,
    ...(token.metadata ?? {}),
  };

  return prisma.socialAccount.upsert({
    where: {
      workspaceId_platform: {
        workspaceId,
        platform,
      },
    },
    create: {
      workspaceId,
      platform,
      externalAccountId: token.accountId ?? `${workspaceId}:${platform}`,
      displayName: token.accountName ?? platform,
      avatarUrl: token.accountAvatar,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      tokenExpiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
      scopes: token.scope ? [token.scope] : undefined,
      pageId: token.pageId,
      pageName: token.pageName,
      pageAccessToken: token.pageAccessToken,
      status: nextStatus,
      connectedAt: token.connectedAt ? new Date(token.connectedAt) : new Date(),
      metadata,
    },
    update: {
      externalAccountId: token.accountId ?? `${workspaceId}:${platform}`,
      displayName: token.accountName ?? platform,
      avatarUrl: token.accountAvatar,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      tokenExpiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
      scopes: token.scope ? [token.scope] : undefined,
      pageId: token.pageId,
      pageName: token.pageName,
      pageAccessToken: token.pageAccessToken,
      status: nextStatus,
      connectedAt: token.connectedAt ? new Date(token.connectedAt) : new Date(),
      metadata,
    },
  });
}

export async function removeSocialAccount(workspaceId: string, platform: string) {
  if (platform === "bluesky") {
    const existing = await prisma.socialAccount.findFirst({
      where: {
        workspaceId,
        platform,
      },
      select: {
        externalAccountId: true,
        metadata: true,
      },
    });

    const metadata = existing?.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? existing.metadata as Record<string, unknown>
      : {};
    const did = typeof metadata.did === "string" ? metadata.did : existing?.externalAccountId;
    if (did) {
      await deleteBlueskyOAuthSession(did);
    }
  }

  await prisma.socialAccount.deleteMany({
    where: {
      workspaceId,
      platform,
    },
  });
}

export async function getWorkspaceSocialAccounts(workspaceId: string) {
  return prisma.socialAccount.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
}

export function findConnectedAccount(
  socialAccounts: SocialAccount[],
  platform: string
) {
  return socialAccounts.find((account) => account.platform === platform && account.status === "CONNECTED");
}
