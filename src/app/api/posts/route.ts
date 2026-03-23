import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/posts?userId=xxx
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const posts = await prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    userId: string;
    content: string;
    platforms: string[];
    status: string;
    date: string;
    time: string;
    autoOptimize?: boolean;
    mediaUrls?: string[];
    scheduledAt?: string;
  };

  const { userId, content, platforms, status, date, time, autoOptimize = false, mediaUrls = [], scheduledAt } = body;

  if (!userId || (!content && (!mediaUrls || mediaUrls.length === 0)) || !platforms || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      userId,
      content,
      platforms,
      status,
      date,
      time,
      autoOptimize,
      mediaUrls,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
