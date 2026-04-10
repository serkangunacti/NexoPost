import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/http";
import { requireStaffUser } from "@/lib/staff";

function parseUserProfile(value: Prisma.JsonValue | null): { fullName?: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as { fullName?: string };
}

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
            email: true,
            userProfile: true,
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
          user: {
            email: request.user.email,
            name: parseUserProfile(request.user.userProfile)?.fullName ?? null,
          },
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
