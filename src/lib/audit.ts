import { ActorKind } from "@prisma/client";
import { prisma } from "./prisma";
import { getClientIp } from "./rate-limit";

export type AuditInput = {
  actorKind?: ActorKind;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

/**
 * Append a row to the audit log. Every sensitive admin action must go
 * through this so there is an immutable trail (payments, nominees,
 * settings, events, members ...).
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    let ip = input.ip;
    if (!ip) ip = await getClientIp();
    await prisma.auditLog.create({
      data: {
        actorKind: input.actorKind ?? "SYSTEM",
        actorId: input.actorId ?? undefined,
        actorName: input.actorName ?? undefined,
        action: input.action,
        entityType: input.entityType ?? undefined,
        entityId: input.entityId ?? undefined,
        description: input.description ?? undefined,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        ip,
      },
    });
  } catch (err) {
    // Audit logging must never break the primary operation.
    console.error("[audit] failed to write log", err);
  }
}
