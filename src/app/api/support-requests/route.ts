import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, toErrorResponse } from "@/lib/http";
import { requireSessionUser, requireWorkspaceAccess } from "@/lib/authz";
import { logAuditEvent } from "@/lib/audit";
import { requireStaffUser } from "@/lib/staff";
import {
  assertSupportAttachmentUrls,
  buildAttachmentHtml,
  escapeHtml,
  serializeSupportRequest,
  ticketSubjectTag,
} from "@/lib/support";
import { sendSupportMail } from "@/lib/mail/graph";
import { SUPPORT_SKIP_SYNC_MARKER, syncSupportMailboxReplies } from "@/lib/supportMailboxSync";

export async function GET() {
  try {
    const userId = await requireSessionUser();
    await syncSupportMailboxReplies();

    const requests = await prisma.supportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        workspaceId: true,
        attachmentUrls: true,
        createdAt: true,
        updatedAt: true,
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            authorType: true,
            source: true,
            attachmentUrls: true,
            seenByUserAt: true,
            seenByStaffAt: true,
            createdAt: true,
            updatedAt: true,
            authorUser: {
              select: {
                email: true,
                userProfile: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        requests: requests.map(serializeSupportRequest),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireStaffUser();
    const body = (await request.json()) as {
      requestId?: string;
      status?: string;
    };

    const requestId = body.requestId?.trim() ?? "";
    const status = body.status?.trim().toUpperCase() ?? "";

    if (!requestId) {
      throw new ApiError(400, "Request ID is required.");
    }

    if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
      throw new ApiError(400, "Invalid support status.");
    }

    const supportRequest = await prisma.supportRequest.update({
      where: { id: requestId },
      data: {
        status,
        lastStaffReadAt: new Date(),
      },
      select: {
        id: true,
        workspaceId: true,
        status: true,
      },
    });

    await logAuditEvent({
      action: "support.request.status_updated",
      entityType: "support_request",
      entityId: supportRequest.id,
      userId,
      workspaceId: supportRequest.workspaceId,
      payload: { status },
    });

    return NextResponse.json({ ok: true, status: supportRequest.status });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUser();
    const body = (await request.json()) as {
      workspaceId?: string | null;
      subject?: string;
      message?: string;
      attachmentUrls?: unknown;
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

    const attachmentUrls = assertSupportAttachmentUrls(body.attachmentUrls);

    const supportRequest = await prisma.supportRequest.create({
      data: {
        userId,
        workspaceId,
        subject,
        message,
        attachmentUrls,
        lastUserReadAt: new Date(),
      },
    });

    const ticketTag = ticketSubjectTag(supportRequest.id);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
    const attachmentHtml = buildAttachmentHtml(attachmentUrls);
    const supportEmail = process.env.SUPPORT_NOTIFICATION_EMAIL ?? process.env.MICROSOFT_MAIL_SENDER;

    if (supportEmail) {
      await sendSupportMail({
        to: supportEmail,
        subject: `${ticketTag} New support request: ${subject}`,
        html: `
          <!-- ${SUPPORT_SKIP_SYNC_MARKER} -->
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2>New support request</h2>
            <p><strong>Request ID:</strong> ${supportRequest.id}</p>
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <p><strong>Message:</strong><br />${safeMessage}</p>
            ${attachmentHtml}
          </div>
        `,
      }).catch((error) => console.error("[support-mail:new-request]", error));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      await sendSupportMail({
        to: user.email,
        subject: `We received your support request (${supportRequest.id})`,
        html: `
          <!-- ${SUPPORT_SKIP_SYNC_MARKER} -->
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2>We received your support request</h2>
            <p>Your ticket has been created and our team will follow up from the portal or by email.</p>
            <p><strong>Ticket:</strong> ${supportRequest.id}</p>
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <p><a href="${escapeHtml(`${process.env.APP_BASE_URL ?? "https://www.nexopost.com"}/support`)}">Open Support Center</a></p>
          </div>
        `,
      }).catch((error) => console.error("[support-mail:ack]", error));
    }

    await logAuditEvent({
      action: "support.request.created",
      entityType: "support_request",
      entityId: supportRequest.id,
      userId,
      workspaceId,
      payload: {
        subject,
        attachments: attachmentUrls.length,
      },
    });

    return NextResponse.json({ id: supportRequest.id, ok: true }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
