import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/http";
import { requireStaffUser } from "@/lib/staff";

export async function GET() {
  try {
    await requireStaffUser();

    const requests = await prisma.supportRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        workspace: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        requests: requests.map((request) => ({
          ...request,
          createdAt: request.createdAt.toISOString(),
          updatedAt: request.updatedAt.toISOString(),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
