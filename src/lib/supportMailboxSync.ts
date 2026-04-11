import { prisma } from "@/lib/prisma";
import { cleanMailboxReplyBody, extractTicketIdFromSubject } from "@/lib/support";
import { listRecentSupportSentMessages } from "@/lib/mail/graph";

const SKIP_SYNC_MARKER = "NEXOPOST-SKIP-SYNC";

export async function syncSupportMailboxReplies() {
  const messages = await listRecentSupportSentMessages(40).catch((error) => {
    console.error("[support-mailbox-sync]", error);
    return [];
  });

  for (const message of messages) {
    const subject = message.subject ?? "";
    const ticketId = extractTicketIdFromSubject(subject);
    if (!ticketId) continue;

    const body = message.body?.content ?? "";
    if (!body || body.includes(SKIP_SYNC_MARKER)) continue;

    const cleaned = cleanMailboxReplyBody(body);
    if (!cleaned) continue;

    try {
      await prisma.supportReply.upsert({
        where: {
          externalMessageId: message.internetMessageId ?? `${ticketId}:${message.id}`,
        },
        create: {
          supportRequestId: ticketId,
          authorType: "STAFF",
          source: "MAILBOX",
          body: cleaned,
          externalMessageId: message.internetMessageId ?? `${ticketId}:${message.id}`,
        },
        update: {},
      });
    } catch (error) {
      console.error("[support-mailbox-sync:upsert]", error);
    }
  }
}

export const SUPPORT_SKIP_SYNC_MARKER = SKIP_SYNC_MARKER;
