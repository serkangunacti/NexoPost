import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/http";
import { requireSessionUser } from "@/lib/authz";

export async function POST() {
  try {
    const userId = await requireSessionUser();
    const now = new Date();

    await prisma.supportReply.updateMany({
      where: {
        supportRequest: { userId },
        authorType: "STAFF",
        seenByUserAt: null,
      },
      data: { seenByUserAt: now },
    });

    await prisma.supportRequest.updateMany({
      where: { userId },
      data: { lastUserReadAt: now },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
