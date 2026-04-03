import { NextRequest, NextResponse } from "next/server";
import { type PostPlatformConfig } from "@/lib/postPlatformConfig";
import { prisma } from "@/lib/prisma";
import { savePostGraph } from "@/lib/publishing";
import { requireSessionUser } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";
import { ensureWorkspaceMembership, resolveActiveWorkspaceId } from "@/lib/workspaces";
import { logAuditEvent } from "@/lib/audit";

function coerceStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  return [];
}

async function getAuthorizedPost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.workspaceId) {
    await ensureWorkspaceMembership(userId, post.workspaceId);
    return post;
  }

  if (post.userId !== userId) {
    throw new ApiError(403, "Forbidden");
  }

  return post;
}

// GET /api/posts/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireSessionUser();
    const { id } = await params;
    const post = await getAuthorizedPost(id, userId);

    return NextResponse.json(post);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/posts/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireSessionUser();
    const { id } = await params;
    const existing = await getAuthorizedPost(id, userId);
    const body = await request.json() as {
      content?: string;
      platforms?: string[];
      status?: "Draft" | "Published" | "Scheduled";
      date?: string;
      time?: string;
      autoOptimize?: boolean;
      mediaUrls?: string[];
      platformConfig?: PostPlatformConfig;
      scheduledAt?: string | null;
    };

    const rateLimit = checkRateLimit({
      key: `posts:update:${userId}`,
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      throw new ApiError(429, "Too many post mutations. Please slow down.");
    }

    const workspaceId = existing.workspaceId ?? await resolveActiveWorkspaceId(userId);

    const updated = await savePostGraph({
      postId: existing.id,
      userId,
      workspaceId,
      payload: {
        content: body.content?.trim() ?? existing.content,
        platforms: body.platforms ? coerceStringArray(body.platforms) : coerceStringArray(existing.platforms),
        status:
          body.status && ["Draft", "Published", "Scheduled"].includes(body.status)
            ? body.status
            : ((existing.status === "Draft" || existing.status === "Published" || existing.status === "Scheduled")
              ? existing.status
              : "Draft"),
        date: body.date ?? existing.date,
        time: body.time ?? existing.time,
        autoOptimize: body.autoOptimize ?? existing.autoOptimize,
        mediaUrls: body.mediaUrls ? coerceStringArray(body.mediaUrls) : coerceStringArray(existing.mediaUrls),
        platformConfig: body.platformConfig ?? (existing.platformConfig as PostPlatformConfig | undefined) ?? {},
        scheduledAt: body.scheduledAt !== undefined ? body.scheduledAt : existing.scheduledAt?.toISOString() ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// DELETE /api/posts/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireSessionUser();
    const { id } = await params;
    const post = await getAuthorizedPost(id, userId);

    await prisma.post.delete({ where: { id } });

    await logAuditEvent({
      action: "post.deleted",
      entityType: "post",
      entityId: post.id,
      userId,
      workspaceId: post.workspaceId,
      payload: {
        status: post.status,
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
