import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const runtimeRoot = path.join(path.resolve(__dirname, ".."), ".codex-tmp", "e2e-fixture");
const statePath = path.join(runtimeRoot, "fixture-state.json");

type FixtureState = {
  runId: string;
  leadId: string;
  customerId: string;
  source: string;
  sourceRecordId: string;
  businessName: string;
};

export function createFixtureState(runId: string): FixtureState {
  assert.ok(runId, "E2E_RUN_ID must be provided by the managed E2E runtime");

  return {
    runId,
    leadId: `lead_${runId}`,
    customerId: `e2e-${runId}`,
    source: "E2E_PLAYWRIGHT",
    sourceRecordId: runId,
    businessName: `E2E Synthetic ${runId}`
  };
}

export function isOwnedFixtureRow(
  row: Pick<FixtureState, "customerId" | "source" | "sourceRecordId" | "businessName">,
  state: FixtureState
) {
  return (
    row.customerId === state.customerId
    && row.source === state.source
    && row.sourceRecordId === state.sourceRecordId
    && row.businessName === state.businessName
  );
}

export function fixtureCleanupFilter(runId: string) {
  return {
    customerId: `e2e-${runId}`
  };
}

function getPrisma() {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be provided by the managed E2E runtime");
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: ["error"]
  });
}

function getState(): FixtureState {
  const runId = process.env.E2E_RUN_ID;
  return createFixtureState(runId ?? "");
}

async function setup() {
  fs.mkdirSync(runtimeRoot, { recursive: true });
  const state = getState();
  const prisma = getPrisma();

  try {
    const existing = await prisma.lead.findMany({
      where: {
        customerId: state.customerId
      },
      select: { id: true, customerId: true, source: true, sourceRecordId: true, businessName: true }
    });

    if (existing.length === 1) {
      const record = existing[0];
      if (!isOwnedFixtureRow(record, state)) {
        throw new Error("Stale fixture owned by another run was detected.");
      }
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
      return;
    }

    if (existing.length > 1) {
      throw new Error("Unexpected duplicate fixture ownership state.");
    }

    const lead = await prisma.lead.create({
      data: {
        id: state.leadId,
        customerId: state.customerId,
        businessName: state.businessName,
        source: state.source,
        sourceRecordId: state.sourceRecordId,
        leadStatus: "NEW",
        priority: "LOW",
        packageFit: "UNKNOWN"
      }
    });

    assert.equal(lead.customerId, state.customerId);
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

async function verify() {
  const prisma = getPrisma();
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8")) as FixtureState;
    const lead = await prisma.lead.findFirst({
      where: {
        customerId: state.customerId
      }
    });

    assert.ok(lead, "Expected the current-run synthetic lead to exist.");
    assert.equal(lead?.businessName, state.businessName);
    assert.equal(lead?.customerId, state.customerId);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanup() {
  if (!fs.existsSync(statePath)) {
    return;
  }

  const state = JSON.parse(fs.readFileSync(statePath, "utf8")) as FixtureState;
  const prisma = getPrisma();

  try {
    await prisma.lead.deleteMany({ where: fixtureCleanupFilter(state.runId) });
    const remaining = await prisma.lead.findFirst({
      where: {
        customerId: state.customerId
      }
    });
    assert.equal(remaining, null);
    fs.rmSync(statePath, { force: true });
  } finally {
    await prisma.$disconnect();
  }
}

export async function main() {
  const mode = process.argv[2];
  if (mode === "setup") return setup();
  if (mode === "verify") return verify();
  if (mode === "cleanup") return cleanup();
  throw new Error("Usage: pnpm e2e:fixture <setup|verify|cleanup>");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
