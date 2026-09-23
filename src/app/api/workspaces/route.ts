import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/authz";
import { ApiError, toErrorResponse } from "@/lib/http";
import { logAuditEvent } from "@/lib/audit";
import { createWorkspace } from "@/lib/workspaces";

// POST /api/workspaces
export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUser();
    const body = await request.json() as { name?: unknown };

    if (typeof body.name !== "string") {
      throw new ApiError(400, "Workspace name is required");
    }

    const workspace = await createWorkspace(userId, body.name);

    await logAuditEvent({
      action: "workspace.created",
      entityType: "workspace",
      entityId: workspace.id,
      userId,
      workspaceId: workspace.id,
    });

    return NextResponse.json({ id: workspace.id, name: workspace.name }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
