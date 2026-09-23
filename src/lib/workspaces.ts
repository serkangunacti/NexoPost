import type { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http";
import { getSubscription } from "@/lib/billing";
import { removeSocialAccount } from "@/lib/socialAccounts";
import { isStaffEmail, isSuperadminEmail } from "@/lib/staff";
import { toPendingPlanChange, toSubscriptionRecord, type PendingPlanChange, type SubscriptionRecord } from "@/lib/subscription";
import { getUserPlan } from "@/lib/usage";
import type { PlanId } from "@/lib/plans";

export type AppSessionPayload = {
  activeClientId: string;
  clients: Array<{ id: string; name: string }>;
  connectedAccounts: Record<string, string[]>;
  isStaff: boolean;
  isSuperadmin: boolean;
  isLoggedIn: true;
  pendingChange: PendingPlanChange | null;
  subscription: SubscriptionRecord;
  userProfile: {
    companyName: string;
    email: string;
    fullName: string;
    phone: string;
  };
  userType: PlanId;
};

const MAX_WORKSPACE_NAME_LENGTH = 80;

function normalizeWorkspaceName(name: string) {
  const trimmed = name.trim().slice(0, MAX_WORKSPACE_NAME_LENGTH);
  if (!trimmed) {
    throw new ApiError(400, "Workspace name is required");
  }
  return trimmed;
}

async function createOwnedWorkspace(userId: string, name: string) {
  const workspace = await prisma.workspace.create({
    data: {
      name,
      ownerId: userId,
      members: { create: { userId, role: "OWNER" } },
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { activeWorkspaceId: workspace.id },
  });

  return workspace;
}

// Every account needs at least one workspace to connect accounts and publish.
async function ensureDefaultWorkspace(userId: string) {
  const membershipCount = await prisma.workspaceMember.count({ where: { userId } });
  if (membershipCount > 0) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyName: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await createOwnedWorkspace(userId, user.companyName.trim() || "Main Workspace");
}

export async function ensureWorkspaceMembership(
  userId: string,
  workspaceId: string,
  allowedRoles?: WorkspaceRole[]
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
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
  if (preferredWorkspaceId) {
    return preferredWorkspaceId;
  }

  await ensureDefaultWorkspace(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeWorkspaceId: true,
      workspaceMemberships: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { workspaceId: true },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user.activeWorkspaceId ?? user.workspaceMemberships[0]?.workspaceId ?? "";
}

export async function setActiveWorkspace(userId: string, workspaceId: string) {
  await ensureWorkspaceMembership(userId, workspaceId);
  await prisma.user.update({
    where: { id: userId },
    data: { activeWorkspaceId: workspaceId },
  });
}

export async function buildAppSession(userId: string): Promise<AppSessionPayload> {
  await ensureDefaultWorkspace(userId);
  const subscription = await getSubscription(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      fullName: true,
      companyName: true,
      phone: true,
      activeWorkspaceId: true,
      workspaceMemberships: {
        orderBy: { createdAt: "asc" },
        select: {
          workspace: {
            select: {
              id: true,
              name: true,
              socialAccounts: {
                where: { status: "CONNECTED" },
                select: { platform: true },
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

  const workspaces = user.workspaceMemberships.map((membership) => membership.workspace);
  const activeClientId =
    workspaces.find((workspace) => workspace.id === user.activeWorkspaceId)?.id ?? workspaces[0]?.id ?? "";

  return {
    activeClientId,
    clients: workspaces.map((workspace) => ({ id: workspace.id, name: workspace.name })),
    connectedAccounts: Object.fromEntries(
      workspaces.map((workspace) => [workspace.id, workspace.socialAccounts.map((account) => account.platform)])
    ),
    isStaff: isStaffEmail(user.email),
    isSuperadmin: isSuperadminEmail(user.email),
    isLoggedIn: true,
    pendingChange: toPendingPlanChange(subscription),
    subscription: toSubscriptionRecord(subscription),
    userProfile: {
      companyName: user.companyName,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
    },
    userType: subscription.plan,
  };
}

export async function createWorkspace(userId: string, name: string) {
  const plan = await getUserPlan(userId);
  if (plan.maxWorkspaces !== null) {
    const ownedCount = await prisma.workspace.count({ where: { ownerId: userId } });
    if (ownedCount >= plan.maxWorkspaces) {
      throw new ApiError(403, `${plan.label} plan allows up to ${plan.maxWorkspaces} workspace(s).`);
    }
  }

  return createOwnedWorkspace(userId, normalizeWorkspaceName(name));
}

export async function renameWorkspace(userId: string, workspaceId: string, name: string) {
  await ensureWorkspaceMembership(userId, workspaceId, ["OWNER", "ADMIN"]);
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: normalizeWorkspaceName(name) },
  });
}

export async function deleteWorkspace(userId: string, workspaceId: string) {
  await ensureWorkspaceMembership(userId, workspaceId, ["OWNER"]);

  const membershipCount = await prisma.workspaceMember.count({ where: { userId } });
  if (membershipCount <= 1) {
    throw new ApiError(400, "You cannot delete your only workspace.");
  }

  // Bluesky sessions live outside the workspace cascade.
  const blueskyAccount = await prisma.socialAccount.findUnique({
    where: { workspaceId_platform: { workspaceId, platform: "bluesky" } },
    select: { id: true },
  });
  if (blueskyAccount) {
    await removeSocialAccount(workspaceId, "bluesky");
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
}
