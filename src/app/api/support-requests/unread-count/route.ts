import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/http";
import { requireSessionUser } from "@/lib/authz";
import { syncSupportMailboxReplies } from "@/lib/supportMailboxSync";
import { requireStaffUser } from "@/lib/staff";

export async function GET() {
  try {
    const userId = await requireSessionUser();
    await syncSupportMailboxReplies();

    let isStaff = false;
    try {
      const staff = await requireStaffUser();
      isStaff = staff.userId === userId;
    } catch {}

    if (isStaff) {
      return NextResponse.json({ unread: 0 }, { headers: { "Cache-Control": "no-store" } });
    }

    const unread = await prisma.supportReply.count({
      where: {
        supportRequest: {
          userId,
        },
        authorType: "STAFF",
        seenByUserAt: null,
      },
    });

    return NextResponse.json({ unread }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
