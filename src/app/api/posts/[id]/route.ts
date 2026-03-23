import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/posts/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

// PATCH /api/posts/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as {
    content?: string;
    platforms?: string[];
    status?: string;
    date?: string;
    time?: string;
    autoOptimize?: boolean;
    mediaUrls?: string[];
    scheduledAt?: string | null;
  };

  const { scheduledAt, ...rest } = body;

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...rest,
      ...(scheduledAt !== undefined
        ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
        : {}),
    },
  });

  return NextResponse.json(post);
}

// DELETE /api/posts/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
