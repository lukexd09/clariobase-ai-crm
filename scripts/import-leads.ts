import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  LeadPriority,
  LeadStatus,
  PackageFit,
  PrismaClient
} from "../src/generated/prisma/client";
import { z } from "zod";

const importRowSchema = z.object({
  customerId: z.string().trim().min(1).optional(),
  businessName: z.string().trim().min(1),
  category: z.string().trim().min(1).optional().nullable(),
  city: z.string().trim().min(1).optional().nullable(),
  region: z.string().trim().min(1).optional().nullable(),
  country: z.string().trim().min(1).optional().nullable(),
  source: z.string().trim().min(1).optional().nullable(),
  sourceRecordId: z.string().trim().min(1).optional().nullable(),
  googlePlaceId: z.string().trim().min(1).optional().nullable(),
  websiteUrl: z.string().trim().min(1).url().optional().nullable(),
  instagramUrl: z.string().trim().min(1).url().optional().nullable(),
  facebookUrl: z.string().trim().min(1).url().optional().nullable(),
  phone: z.string().trim().min(1).optional().nullable(),
  email: z.string().trim().min(1).email().optional().nullable(),
  address: z.string().trim().min(1).optional().nullable(),
  leadStatus: z.nativeEnum(LeadStatus).optional().nullable(),
  priority: z.nativeEnum(LeadPriority).optional().nullable(),
  packageFit: z.nativeEnum(PackageFit).optional().nullable(),
  scoreTotal: z.number().int().optional().nullable(),
  scoreLabel: z.string().trim().min(1).optional().nullable(),
  nextActionAt: z.string().datetime().optional().nullable(),
  lastReviewedAt: z.string().datetime().optional().nullable(),
  lastImportedAt: z.string().datetime().optional().nullable()
});

type ImportRow = z.infer<typeof importRowSchema>;

type ImportSummary = {
  totalRows: number;
  created: number;
  updated: number;
  rejected: number;
  skipped: number;
  rejections: Array<{ row: number; reason: string }>;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the import script");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: pnpm leads:import ./data/import/sample-leads.json");
  }

  const raw = await fs.readFile(path.resolve(inputPath), "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Import file must contain a JSON array");
  }

  const summary: ImportSummary = {
    totalRows: parsed.length,
    created: 0,
    updated: 0,
    rejected: 0,
    skipped: 0,
    rejections: []
  };

  for (let index = 0; index < parsed.length; index += 1) {
    const rowNumber = index + 1;
    const rowResult = importRowSchema.safeParse(parsed[index]);

    if (!rowResult.success) {
      summary.rejected += 1;
      summary.rejections.push({
        row: rowNumber,
        reason: rowResult.error.issues.map((issue) => issue.message).join("; ")
      });
      continue;
    }

    const row = rowResult.data;
    const normalized = normalizeRow(row);
    const target = buildTarget(normalized);

    if (!target) {
      summary.rejected += 1;
      summary.rejections.push({
        row: rowNumber,
        reason: "Missing customerId and source/sourceRecordId; cannot determine idempotent key"
      });
      continue;
    }

    const existing = await findExistingLead(target);

    if (!existing) {
      await prisma.lead.upsert({
        where: target.where,
        create: buildCreateData(normalized),
        update: buildUpdateData(normalized)
      });
      summary.created += 1;
      continue;
    }

    await prisma.lead.upsert({
      where: target.where,
      create: buildCreateData(normalized),
      update: buildUpdateData(normalized)
    });
    summary.updated += 1;
  }

  printSummary(summary);
}

function normalizeRow(row: ImportRow) {
  const customerId =
    row.customerId ?? deterministicCustomerId(row.source ?? null, row.sourceRecordId ?? null, row.businessName);

  return {
    ...row,
    customerId,
    category: row.category ?? null,
    city: row.city ?? null,
    region: row.region ?? null,
    country: row.country ?? null,
    source: row.source ?? null,
    sourceRecordId: row.sourceRecordId ?? null,
    googlePlaceId: row.googlePlaceId ?? null,
    websiteUrl: row.websiteUrl ?? null,
    instagramUrl: row.instagramUrl ?? null,
    facebookUrl: row.facebookUrl ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    leadStatus: row.leadStatus ?? LeadStatus.NEW,
    priority: row.priority ?? LeadPriority.MEDIUM,
    packageFit: row.packageFit ?? PackageFit.UNKNOWN,
    scoreTotal: row.scoreTotal ?? 0,
    scoreLabel: row.scoreLabel ?? null,
    nextActionAt: row.nextActionAt ? new Date(row.nextActionAt) : null,
    lastReviewedAt: row.lastReviewedAt ? new Date(row.lastReviewedAt) : null,
    lastImportedAt: row.lastImportedAt ? new Date(row.lastImportedAt) : new Date()
  };
}

function buildTarget(row: ReturnType<typeof normalizeRow>) {
  if (row.source && row.sourceRecordId) {
    return {
      where: {
        source_sourceRecordId: {
          source: row.source,
          sourceRecordId: row.sourceRecordId
        }
      }
    };
  }

  if (row.customerId) {
    return {
      where: {
        customerId: row.customerId
      }
    };
  }

  return null;
}

async function findExistingLead(target: NonNullable<ReturnType<typeof buildTarget>>) {
  if ("source_sourceRecordId" in target.where) {
    return prisma.lead.findUnique({
      where: target.where
    });
  }

  return prisma.lead.findUnique({
    where: target.where
  });
}

function buildCreateData(row: ReturnType<typeof normalizeRow>) {
  return {
    customerId: row.customerId,
    businessName: row.businessName,
    category: row.category,
    city: row.city,
    region: row.region,
    country: row.country,
    source: row.source,
    sourceRecordId: row.sourceRecordId,
    googlePlaceId: row.googlePlaceId,
    websiteUrl: row.websiteUrl,
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    phone: row.phone,
    email: row.email,
    address: row.address,
    leadStatus: row.leadStatus,
    priority: row.priority,
    packageFit: row.packageFit,
    scoreTotal: row.scoreTotal,
    scoreLabel: row.scoreLabel,
    nextActionAt: row.nextActionAt,
    lastReviewedAt: row.lastReviewedAt,
    lastImportedAt: row.lastImportedAt
  };
}

function buildUpdateData(row: ReturnType<typeof normalizeRow>) {
  return {
    businessName: row.businessName,
    category: row.category,
    city: row.city,
    region: row.region,
    country: row.country,
    websiteUrl: row.websiteUrl,
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    phone: row.phone,
    email: row.email,
    address: row.address,
    leadStatus: row.leadStatus,
    priority: row.priority,
    packageFit: row.packageFit,
    scoreTotal: row.scoreTotal,
    scoreLabel: row.scoreLabel,
    nextActionAt: row.nextActionAt,
    lastReviewedAt: row.lastReviewedAt,
    lastImportedAt: row.lastImportedAt
  };
}

function deterministicCustomerId(
  source: string | null,
  sourceRecordId: string | null,
  businessName: string
) {
  const input = [source ?? "", sourceRecordId ?? "", businessName].join("|");
  return `crm-${crypto.createHash("sha1").update(input).digest("hex").slice(0, 16)}`;
}

function printSummary(summary: ImportSummary) {
  console.log(`total rows: ${summary.totalRows}`);
  console.log(`created: ${summary.created}`);
  console.log(`updated: ${summary.updated}`);
  console.log(`rejected: ${summary.rejected}`);
  console.log(`skipped: ${summary.skipped}`);

  if (summary.rejections.length > 0) {
    console.log("rejection reasons:");
    for (const rejection of summary.rejections) {
      console.log(`  row ${rejection.row}: ${rejection.reason}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
