import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSelf } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";
import { logAuditEvent } from "@/lib/audit";

const MIN_PASSWORD_LENGTH = 8;

// POST /api/users/[id]/password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireSelf(id);
    const rateLimit = checkRateLimit({
      key: `users:password:${userId}`,
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      throw new ApiError(429, "Too many attempts. Please try again shortly.");
    }

    const body = await request.json() as { currentPassword?: unknown; newPassword?: unknown };
    if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") {
      throw new ApiError(400, "Current and new password are required.");
    }

    if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ApiError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true },
    });

    if (!user || !(await bcrypt.compare(body.currentPassword, user.hashedPassword))) {
      throw new ApiError(400, "Current password is incorrect.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword: await bcrypt.hash(body.newPassword, 12) },
    });

    await logAuditEvent({
      action: "user.password_changed",
      entityType: "user",
      entityId: userId,
      userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
