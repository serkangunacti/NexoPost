import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, toErrorResponse } from "@/lib/http";
import { requireSessionUser } from "@/lib/authz";
import { logAuditEvent } from "@/lib/audit";
import { requireStaffUser } from "@/lib/staff";
import { assertSupportAttachmentUrls, buildAttachmentHtml, escapeHtml, ticketSubjectTag } from "@/lib/support";
import { sendSupportMail } from "@/lib/mail/graph";
import { SUPPORT_SKIP_SYNC_MARKER } from "@/lib/supportMailboxSync";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUserId = await requireSessionUser();
    const body = (await request.json()) as {
      message?: string;
      attachmentUrls?: unknown;
    };

    const message = body.message?.trim() ?? "";
    if (message.length < 2) {
      throw new ApiError(400, "Reply message is required.");
    }

    const attachmentUrls = assertSupportAttachmentUrls(body.attachmentUrls);
    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        userId: true,
        workspaceId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!supportRequest) {
      throw new ApiError(404, "Support request not found.");
    }

    let authorType = "USER";
    try {
      const staff = await requireStaffUser();
      if (staff.userId === sessionUserId) {
        authorType = "STAFF";
      }
    } catch {}

    if (authorType === "USER" && supportRequest.userId !== sessionUserId) {
      throw new ApiError(403, "Forbidden");
    }

    const reply = await prisma.supportReply.create({
      data: {
        supportRequestId: id,
        authorUserId: sessionUserId,
        authorType,
        source: "PORTAL",
        body: message,
        attachmentUrls,
        seenByUserAt: authorType === "USER" ? new Date() : null,
        seenByStaffAt: authorType === "STAFF" ? new Date() : null,
      },
      select: {
        id: true,
      },
    });

    await prisma.supportRequest.update({
      where: { id },
      data: authorType === "STAFF" ? { lastStaffReadAt: new Date() } : { lastUserReadAt: new Date() },
    });

    if (authorType === "STAFF" && supportRequest.user.email) {
      await sendSupportMail({
        to: supportRequest.user.email,
        subject: `${ticketSubjectTag(id)} ${supportRequest.subject}`,
        html: `
          <!-- ${SUPPORT_SKIP_SYNC_MARKER} -->
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
            ${buildAttachmentHtml(attachmentUrls)}
            <p style="margin-top:16px"><a href="${escapeHtml(`${process.env.APP_BASE_URL ?? "https://www.nexopost.com"}/support`)}">Open Support Center</a></p>
            <div style="display:none">PORTAL-REPLY:${reply.id}</div>
          </div>
        `,
      }).catch((error) => console.error("[support-mail:staff-reply]", error));
    }

    const supportEmail = process.env.SUPPORT_NOTIFICATION_EMAIL ?? process.env.MICROSOFT_MAIL_SENDER;
    if (authorType === "USER" && supportEmail) {
      await sendSupportMail({
        to: supportEmail,
        subject: `${ticketSubjectTag(id)} ${supportRequest.subject}`,
        html: `
          <!-- ${SUPPORT_SKIP_SYNC_MARKER} -->
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
            ${buildAttachmentHtml(attachmentUrls)}
          </div>
        `,
      }).catch((error) => console.error("[support-mail:user-reply]", error));
    }

    await logAuditEvent({
      action: "support.reply.created",
      entityType: "support_reply",
      entityId: reply.id,
      userId: sessionUserId,
      workspaceId: supportRequest.workspaceId,
      payload: { supportRequestId: id, authorType, attachments: attachmentUrls.length },
    });

    return NextResponse.json({ ok: true, id: reply.id }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
