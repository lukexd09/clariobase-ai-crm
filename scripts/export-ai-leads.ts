import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to export AI exchange files");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  const rows = await prisma.lead.findMany({
    orderBy: [{ updatedAt: "desc" }, { businessName: "asc" }],
    select: {
      customerId: true,
      businessName: true,
      category: true,
      city: true,
      region: true,
      country: true,
      source: true,
      sourceRecordId: true,
      googlePlaceId: true,
      websiteUrl: true,
      instagramUrl: true,
      facebookUrl: true,
      phone: true,
      email: true,
      address: true,
      leadStatus: true,
      priority: true,
      packageFit: true,
      scoreTotal: true,
      scoreLabel: true,
      nextActionAt: true,
      lastReviewedAt: true,
      lastImportedAt: true
    }
  });

  const outboxDir = path.resolve("data/ai-exchange/outbox");
  await fs.mkdir(outboxDir, { recursive: true });

  const filePath = path.join(
    outboxDir,
    `clariobase_leads_export_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );

  const payload = {
    batchId: `export-${crypto.randomUUID()}`,
    exportedAt: new Date().toISOString(),
    rowCount: rows.length,
    rows
  };

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");

  console.log(`export file: ${filePath}`);
  console.log(`row count: ${rows.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
