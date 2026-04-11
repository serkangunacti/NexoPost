import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/http";
import { requireStaffUser } from "@/lib/staff";
import { serializeSupportRequest } from "@/lib/support";
import { syncSupportMailboxReplies } from "@/lib/supportMailboxSync";

export async function GET() {
  try {
    await requireStaffUser();
    await syncSupportMailboxReplies();

    const requests = await prisma.supportRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        workspaceId: true,
        attachmentUrls: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            userProfile: true,
          },
        },
        workspace: {
          select: {
            name: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            authorType: true,
            source: true,
            attachmentUrls: true,
            seenByUserAt: true,
            seenByStaffAt: true,
            createdAt: true,
            updatedAt: true,
            authorUser: {
              select: {
                email: true,
                userProfile: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        requests: requests.map(serializeSupportRequest),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
