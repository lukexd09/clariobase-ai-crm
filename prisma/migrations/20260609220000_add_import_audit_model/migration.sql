-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('CREATED', 'UPDATED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('LOCAL_JSON', 'HARVESTER_EXPORT', 'MANUAL_AI_PREPARED_FILE');

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "source_type" "ImportSourceType" NOT NULL,
    "source_name" TEXT,
    "file_name" TEXT,
    "status" "ImportBatchStatus" NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "created_rows" INTEGER NOT NULL DEFAULT 0,
    "updated_rows" INTEGER NOT NULL DEFAULT 0,
    "rejected_rows" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "notes" TEXT,
    "error_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_row_results" (
    "id" TEXT NOT NULL,
    "import_batch_id" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "status" "ImportRowStatus" NOT NULL,
    "lead_id" TEXT,
    "customer_id" TEXT,
    "source" TEXT,
    "source_record_id" TEXT,
    "business_name" TEXT,
    "rejection_reason" TEXT,
    "raw_row_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_row_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_batches_source_type_started_at_idx" ON "import_batches"("source_type", "started_at");

-- CreateIndex
CREATE INDEX "import_batches_status_started_at_idx" ON "import_batches"("status", "started_at");

-- CreateIndex
CREATE INDEX "import_row_results_import_batch_id_row_number_idx" ON "import_row_results"("import_batch_id", "row_number");

-- CreateIndex
CREATE INDEX "import_row_results_lead_id_idx" ON "import_row_results"("lead_id");

-- CreateIndex
CREATE INDEX "import_row_results_customer_id_idx" ON "import_row_results"("customer_id");

-- AddForeignKey
ALTER TABLE "import_row_results" ADD CONSTRAINT "import_row_results_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_row_results" ADD CONSTRAINT "import_row_results_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
