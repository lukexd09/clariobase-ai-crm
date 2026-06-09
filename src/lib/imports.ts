import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const importBatchListSelect = {
  id: true,
  sourceType: true,
  sourceName: true,
  fileName: true,
  status: true,
  totalRows: true,
  createdRows: true,
  updatedRows: true,
  rejectedRows: true,
  skippedRows: true,
  startedAt: true,
  finishedAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ImportBatchSelect;

const importRowSelect = {
  id: true,
  rowNumber: true,
  status: true,
  leadId: true,
  customerId: true,
  source: true,
  sourceRecordId: true,
  businessName: true,
  rejectionReason: true,
  createdAt: true,
  lead: {
    select: {
      id: true,
      businessName: true
    }
  }
} satisfies Prisma.ImportRowResultSelect;

export async function getImportBatches() {
  return prisma.importBatch.findMany({
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
    select: importBatchListSelect
  });
}

export async function getImportBatchById(id: string) {
  return prisma.importBatch.findUnique({
    where: { id },
    include: {
      rows: {
        orderBy: { rowNumber: "asc" },
        select: importRowSelect
      }
    }
  });
}
