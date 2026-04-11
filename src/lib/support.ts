import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";

export type SupportReplyView = {
  id: string;
  body: string;
  authorType: string;
  source: string;
  attachmentUrls: string[];
  seenByUserAt: string | null;
  seenByStaffAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorUser: {
    email: string | null;
    name: string | null;
  } | null;
};

export type SupportRequestView = {
  id: string;
  subject: string;
  message: string;
  status: string;
  workspaceId: string | null;
  attachmentUrls: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string | null;
    name: string | null;
  };
  workspace?: {
    name: string;
  } | null;
  replies: SupportReplyView[];
};

type JsonObject = Record<string, unknown>;

export function parseObjectJson<T extends JsonObject>(value: Prisma.JsonValue | null): T | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as T;
}

export function parseAttachmentUrls(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.startsWith("https://"));
}

export function assertSupportAttachmentUrls(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new ApiError(400, "Attachment URLs must be an array.");
  }

  const allowedPrefixes = [
    env.CLOUDINARY_CLOUD_NAME ? `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/` : null,
  ].filter(Boolean) as string[];

  return value.map((item) => {
    if (typeof item !== "string" || !item.startsWith("https://")) {
      throw new ApiError(400, "Invalid attachment URL.");
    }
    if (!allowedPrefixes.some((prefix) => item.startsWith(prefix))) {
      throw new ApiError(400, "Attachment URL is not allowed.");
    }
    return item;
  });
}

export function ticketSubjectTag(requestId: string) {
  return `[Ticket:${requestId}]`;
}

export function extractTicketIdFromSubject(subject: string) {
  const match = subject.match(/\[Ticket:([a-z0-9]+)\]/i);
  return match?.[1] ?? null;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildAttachmentHtml(attachmentUrls: string[]) {
  if (!attachmentUrls.length) return "";
  const items = attachmentUrls
    .map((url) => {
      const safeUrl = escapeHtml(url);
      const isImage = /\.(png|jpe?g|gif|webp|avif)$/i.test(url);
      return isImage
        ? `<div style="margin:16px 0"><a href="${safeUrl}"><img src="${safeUrl}" alt="Attachment" style="max-width:100%;border-radius:12px;border:1px solid #e5e7eb" /></a></div>`
        : `<p><a href="${safeUrl}">${safeUrl}</a></p>`;
    })
    .join("");
  return `<div style="margin-top:16px"><strong>Attachments</strong>${items}</div>`;
}

export function cleanMailboxReplyBody(input: string) {
  const withoutTags = input
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "");

  const lines = withoutTags.split("\n");
  const cleaned: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (cleaned[cleaned.length - 1] !== "") cleaned.push("");
      continue;
    }
    if (
      /^from:/i.test(line) ||
      /^sent:/i.test(line) ||
      /^to:/i.test(line) ||
      /^subject:/i.test(line) ||
      /^workspace:/i.test(line) ||
      /^request id:/i.test(line) ||
      /^attachments:/i.test(line)
    ) {
      break;
    }
    if (/^>/.test(line) || /^On .+ wrote:$/i.test(line)) {
      break;
    }
    cleaned.push(line);
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function serializeSupportRequest(
  request: {
    id: string;
    subject: string;
    message: string;
    status: string;
    workspaceId: string | null;
    attachmentUrls: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    replies: Array<{
      id: string;
      body: string;
      authorType: string;
      source: string;
      attachmentUrls: Prisma.JsonValue | null;
      seenByUserAt: Date | null;
      seenByStaffAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      authorUser: {
        email: string | null;
        userProfile: Prisma.JsonValue | null;
      } | null;
    }>;
    user?: {
      email: string | null;
      userProfile: Prisma.JsonValue | null;
    };
    workspace?: {
      name: string;
    } | null;
  }
): SupportRequestView {
  return {
    id: request.id,
    subject: request.subject,
    message: request.message,
    status: request.status,
    workspaceId: request.workspaceId,
    attachmentUrls: parseAttachmentUrls(request.attachmentUrls),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    user: request.user
      ? {
          email: request.user.email,
          name: parseObjectJson<{ fullName?: string }>(request.user.userProfile)?.fullName ?? null,
        }
      : undefined,
    workspace: request.workspace ?? null,
    replies: request.replies.map((reply) => ({
      id: reply.id,
      body: reply.body,
      authorType: reply.authorType,
      source: reply.source,
      attachmentUrls: parseAttachmentUrls(reply.attachmentUrls),
      seenByUserAt: reply.seenByUserAt?.toISOString() ?? null,
      seenByStaffAt: reply.seenByStaffAt?.toISOString() ?? null,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      authorUser: reply.authorUser
        ? {
            email: reply.authorUser.email,
            name: parseObjectJson<{ fullName?: string }>(reply.authorUser.userProfile)?.fullName ?? null,
          }
        : null,
    })),
  };
}
