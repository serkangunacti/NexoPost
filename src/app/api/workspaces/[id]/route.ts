import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/authz";
import { ApiError, toErrorResponse } from "@/lib/http";
import { logAuditEvent } from "@/lib/audit";
import { deleteWorkspace, renameWorkspace } from "@/lib/workspaces";

// PATCH /api/workspaces/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireSessionUser();
    const body = await request.json() as { name?: unknown };

    if (typeof body.name !== "string") {
      throw new ApiError(400, "Workspace name is required");
    }

    const workspace = await renameWorkspace(userId, id, body.name);

    await logAuditEvent({
      action: "workspace.renamed",
      entityType: "workspace",
      entityId: id,
      userId,
      workspaceId: id,
    });

    return NextResponse.json({ id: workspace.id, name: workspace.name });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// DELETE /api/workspaces/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireSessionUser();

    await deleteWorkspace(userId, id);

    await logAuditEvent({
      action: "workspace.deleted",
      entityType: "workspace",
      entityId: id,
      userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
