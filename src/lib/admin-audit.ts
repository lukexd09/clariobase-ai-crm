import { Prisma } from "@/generated/prisma/client";

export const ADMIN_AUDIT_OPERATIONS = [
  "BOOTSTRAP_FIRST_ADMIN",
  "CREATE_CONTROLLED_USER",
  "UPDATE_BASIC_IDENTITY",
  "DISABLE_USER",
  "REACTIVATE_USER",
  "RESET_USER_PASSWORD",
  "REVOKE_USER_SESSION",
  "REVOKE_USER_SESSIONS"
] as const;

export type AdminAuditOperation = (typeof ADMIN_AUDIT_OPERATIONS)[number];

export const ADMIN_AUDIT_OUTCOMES = ["SUCCESS"] as const;

export type AdminAuditOutcome = (typeof ADMIN_AUDIT_OUTCOMES)[number];

export function recordAdminAuditEvent(
  transaction: Prisma.TransactionClient,
  input: {
    actorUserId: string | null;
    targetUserId: string;
    operation: AdminAuditOperation;
    outcome?: AdminAuditOutcome;
  }
) {
  return transaction.adminAuditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      operation: input.operation,
      outcome: input.outcome ?? "SUCCESS"
    }
  });
}
