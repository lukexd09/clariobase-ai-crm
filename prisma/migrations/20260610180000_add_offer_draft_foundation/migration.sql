-- CreateEnum
CREATE TYPE "OfferDraftStatus" AS ENUM ('DRAFT', 'READY', 'SENT_MANUALLY', 'ACCEPTED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "offer_drafts" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "status" "OfferDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "package_fit" "PackageFit" NOT NULL,
    "price_net" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "scope_summary" TEXT,
    "assumptions" TEXT,
    "next_step" TEXT,
    "valid_until" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offer_drafts_lead_id_updated_at_idx" ON "offer_drafts"("lead_id", "updated_at");

-- CreateIndex
CREATE INDEX "offer_drafts_status_updated_at_idx" ON "offer_drafts"("status", "updated_at");

-- AddForeignKey
ALTER TABLE "offer_drafts" ADD CONSTRAINT "offer_drafts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
