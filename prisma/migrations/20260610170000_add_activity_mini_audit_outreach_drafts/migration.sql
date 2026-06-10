-- CreateEnum
CREATE TYPE "MiniAuditStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OutreachDraftStatus" AS ENUM ('DRAFT', 'READY', 'SENT_MANUALLY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('EMAIL', 'INSTAGRAM_DM', 'FACEBOOK_DM', 'PHONE_CALL', 'OTHER');

-- CreateTable
CREATE TABLE "mini_audit_drafts" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "status" "MiniAuditStatus" NOT NULL DEFAULT 'DRAFT',
    "problem_1" TEXT,
    "problem_2" TEXT,
    "problem_3" TEXT,
    "recommendation" TEXT,
    "suggested_package" "PackageFit" NOT NULL DEFAULT 'UNKNOWN',
    "outreach_angle" TEXT,
    "draft_message" TEXT,
    "risk_notes" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mini_audit_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_drafts" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "mini_audit_draft_id" TEXT,
    "status" "OutreachDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "channel" "OutreachChannel" NOT NULL DEFAULT 'EMAIL',
    "subject" TEXT,
    "opening_hook" TEXT,
    "message" TEXT,
    "call_to_action" TEXT,
    "notes" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mini_audit_drafts_lead_id_updated_at_idx" ON "mini_audit_drafts"("lead_id", "updated_at");

-- CreateIndex
CREATE INDEX "mini_audit_drafts_status_updated_at_idx" ON "mini_audit_drafts"("status", "updated_at");

-- CreateIndex
CREATE INDEX "outreach_drafts_lead_id_updated_at_idx" ON "outreach_drafts"("lead_id", "updated_at");

-- CreateIndex
CREATE INDEX "outreach_drafts_mini_audit_draft_id_idx" ON "outreach_drafts"("mini_audit_draft_id");

-- CreateIndex
CREATE INDEX "outreach_drafts_status_channel_idx" ON "outreach_drafts"("status", "channel");

-- AddForeignKey
ALTER TABLE "mini_audit_drafts" ADD CONSTRAINT "mini_audit_drafts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_mini_audit_draft_id_fkey" FOREIGN KEY ("mini_audit_draft_id") REFERENCES "mini_audit_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
