import { NextRequest, NextResponse } from "next/server";
import { type PostPlatformConfig } from "@/lib/postPlatformConfig";
import { prisma } from "@/lib/prisma";
import { savePostGraph } from "@/lib/publishing";
import { requireWorkspaceAccess } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";

function coerceStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

// GET /api/posts?workspaceId=xxx
export async function GET(request: NextRequest) {
  try {
    const workspaceIdParam = request.nextUrl.searchParams.get("workspaceId");
    const { userId, workspaceId } = await requireWorkspaceAccess(workspaceIdParam);

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { workspaceId },
          { workspaceId: null, userId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
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
      workspaceId?: string;
    };

    const { userId, workspaceId } = await requireWorkspaceAccess(body.workspaceId);
    const rateLimit = checkRateLimit({
      key: `posts:create:${userId}`,
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      throw new ApiError(429, "Too many post mutations. Please slow down.");
    }

    const content = body.content?.trim() ?? "";
    const platforms = coerceStringArray(body.platforms);
    const status = body.status ?? "Draft";
    const mediaUrls = coerceStringArray(body.mediaUrls);

    if ((!content && mediaUrls.length === 0) || platforms.length === 0) {
      throw new ApiError(400, "Missing required post fields");
    }

    const post = await savePostGraph({
      userId,
      workspaceId,
      payload: {
        content,
        platforms,
        status,
        date: body.date ?? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: body.time ?? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        autoOptimize: body.autoOptimize ?? false,
        mediaUrls,
        platformConfig: body.platformConfig ?? {},
        scheduledAt: body.scheduledAt ?? null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
