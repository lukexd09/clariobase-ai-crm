-- CreateEnum
CREATE TYPE "AdminAuditOperation" AS ENUM ('BOOTSTRAP_FIRST_ADMIN', 'CREATE_CONTROLLED_USER', 'UPDATE_BASIC_IDENTITY', 'DISABLE_USER', 'REACTIVATE_USER', 'RESET_USER_PASSWORD', 'REVOKE_USER_SESSION', 'REVOKE_USER_SESSIONS');

-- CreateEnum
CREATE TYPE "AdminAuditOutcome" AS ENUM ('SUCCESS');

-- CreateTable
CREATE TABLE "admin_audit_events" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "target_user_id" TEXT NOT NULL,
    "operation" "AdminAuditOperation" NOT NULL,
    "outcome" "AdminAuditOutcome" NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_events_actor_user_id_created_at_idx" ON "admin_audit_events"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_events_target_user_id_created_at_idx" ON "admin_audit_events"("target_user_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_events_operation_created_at_idx" ON "admin_audit_events"("operation", "created_at");
