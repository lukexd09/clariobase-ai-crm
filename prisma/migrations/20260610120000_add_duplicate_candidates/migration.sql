-- CreateEnum
CREATE TYPE "DuplicateCandidateStatus" AS ENUM ('OPEN', 'NEEDS_REVIEW', 'DISMISSED', 'RESOLVED');

-- CreateTable
CREATE TABLE "duplicate_candidates" (
    "id" TEXT NOT NULL,
    "lead_id_a" TEXT NOT NULL,
    "lead_id_b" TEXT NOT NULL,
    "status" "DuplicateCandidateStatus" NOT NULL DEFAULT 'OPEN',
    "score" INTEGER NOT NULL DEFAULT 0,
    "reasons" JSONB NOT NULL,
    "reviewed_at" TIMESTAMP(3),
    "decision_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duplicate_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "duplicate_candidates_lead_id_a_lead_id_b_key" ON "duplicate_candidates"("lead_id_a", "lead_id_b");

-- CreateIndex
CREATE INDEX "duplicate_candidates_status_score_idx" ON "duplicate_candidates"("status", "score");

-- CreateIndex
CREATE INDEX "duplicate_candidates_lead_id_a_idx" ON "duplicate_candidates"("lead_id_a");

-- CreateIndex
CREATE INDEX "duplicate_candidates_lead_id_b_idx" ON "duplicate_candidates"("lead_id_b");

-- AddForeignKey
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_lead_id_a_fkey" FOREIGN KEY ("lead_id_a") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_lead_id_b_fkey" FOREIGN KEY ("lead_id_b") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
