import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, toErrorResponse } from "@/lib/http";
import { requireSessionUser, requireWorkspaceAccess } from "@/lib/authz";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUser();
    const body = await request.json() as {
      workspaceId?: string | null;
      subject?: string;
      message?: string;
    };

    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (subject.length < 4 || message.length < 10) {
      throw new ApiError(400, "Subject and message are required.");
    }

    let workspaceId: string | null = null;
    if (body.workspaceId) {
      const access = await requireWorkspaceAccess(body.workspaceId);
      workspaceId = access.workspaceId;
    }

    const supportRequest = await prisma.supportRequest.create({
      data: {
        userId,
        workspaceId,
        subject,
        message,
      },
    });

    await logAuditEvent({
      action: "support.request.created",
      entityType: "support_request",
      entityId: supportRequest.id,
      userId,
      workspaceId,
      payload: {
        subject,
      },
    });

    return NextResponse.json({ id: supportRequest.id, ok: true }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
