import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron calls this endpoint on schedule (see vercel.json).
// It finds all Scheduled posts whose scheduledAt time has passed and marks them as Published.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  const posts = await prisma.post.findMany({
    where: { status: "Scheduled", scheduledAt: { lte: now } },
    select: { id: true },
  });

  if (posts.length > 0) {
    await prisma.post.updateMany({
      where: { id: { in: posts.map((p) => p.id) } },
      data: { status: "Published" },
    });
  }

  return NextResponse.json({ published: posts.length, checkedAt: now.toISOString() });
}
