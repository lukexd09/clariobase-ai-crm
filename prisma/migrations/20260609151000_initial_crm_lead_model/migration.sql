-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'TO_AUDIT', 'AUDITED', 'CONTACTED', 'REPLIED', 'DISCOVERY_SCHEDULED', 'OFFER_SENT', 'WON', 'LOST', 'NURTURE', 'BAD_FIT', 'DO_NOT_CONTACT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PackageFit" AS ENUM ('UNKNOWN', 'BASE', 'CLARITY', 'MOMENTUM', 'NOT_FIT');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "category" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "source" TEXT,
    "source_record_id" TEXT,
    "google_place_id" TEXT,
    "website_url" TEXT,
    "instagram_url" TEXT,
    "facebook_url" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "lead_status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "package_fit" "PackageFit" NOT NULL DEFAULT 'UNKNOWN',
    "score_total" INTEGER NOT NULL DEFAULT 0,
    "score_label" TEXT,
    "next_action_at" TIMESTAMP(3),
    "last_reviewed_at" TIMESTAMP(3),
    "last_imported_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_customer_id_key" ON "leads"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_google_place_id_key" ON "leads"("google_place_id");

-- CreateIndex
CREATE INDEX "leads_business_name_idx" ON "leads"("business_name");

-- CreateIndex
CREATE INDEX "leads_city_country_idx" ON "leads"("city", "country");

-- CreateIndex
CREATE INDEX "leads_lead_status_priority_idx" ON "leads"("lead_status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "leads_source_source_record_id_key" ON "leads"("source", "source_record_id");
