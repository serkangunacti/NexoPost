import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Prisma.InputJsonValue;
  userId?: string | null;
  workspaceId?: string | null;
};

export async function logAuditEvent(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        payload: input.payload,
        userId: input.userId ?? null,
        workspaceId: input.workspaceId ?? null,
      },
    });
  } catch (error) {
    console.error("[audit-log]", error);
  }
}
