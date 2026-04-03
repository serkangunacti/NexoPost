import type { WorkspaceRole } from "@prisma/client";
import { auth } from "@/auth";
import { ApiError } from "@/lib/http";
import { ensureWorkspaceMembership, resolveActiveWorkspaceId } from "@/lib/workspaces";

export async function requireSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError(401, "Authentication required");
  }

  return session.user.id;
}

export async function requireSelf(paramUserId: string) {
  const userId = await requireSessionUser();

  if (userId !== paramUserId) {
    throw new ApiError(403, "Forbidden");
  }

  return userId;
}

export async function requireWorkspaceAccess(
  workspaceId?: string | null,
  allowedRoles?: WorkspaceRole[]
) {
  const userId = await requireSessionUser();
  const resolvedWorkspaceId = await resolveActiveWorkspaceId(userId, workspaceId ?? undefined);

  await ensureWorkspaceMembership(userId, resolvedWorkspaceId, allowedRoles);

  return {
    userId,
    workspaceId: resolvedWorkspaceId,
  };
}
