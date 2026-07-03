import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { PrismaClient } from "@/generated/prisma/client";

import { createDockerRunId, createRuntimeArtifactName } from "./docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(repoRoot, ".codex-tmp", createRuntimeArtifactName("e2e-fixture"));
const statePath = path.join(runtimeRoot, "fixture-state.json");

type FixtureState = {
  runId: string;
  leadId: string;
  customerId: string;
  source: string;
  sourceRecordId: string;
};

function makeState(runId = createDockerRunId("e2e")): FixtureState {
  return {
    runId,
    leadId: `lead_${runId}`,
    customerId: `e2e-${runId}`,
    source: "E2E_PLAYWRIGHT",
    sourceRecordId: `source-${runId}`
  };
}

function getPrisma() {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be provided by the managed E2E runtime");
  return new PrismaClient();
}

async function setup() {
  fs.mkdirSync(runtimeRoot, { recursive: true });
  const state = makeState(process.env.E2E_RUN_ID ?? undefined);
  const prisma = getPrisma();
  try {
    const existing = await prisma.lead.findMany({
      where: {
        OR: [
          { customerId: state.customerId },
          { source: state.source, sourceRecordId: state.sourceRecordId }
        ]
      },
      select: { id: true, customerId: true, source: true, sourceRecordId: true }
    });

    if (existing.length > 1) {
      throw new Error("Unexpected duplicate fixture ownership state.");
    }

    if (existing.length === 1) {
      const record = existing[0];
      if (record.customerId !== state.customerId || record.source !== state.source || record.sourceRecordId !== state.sourceRecordId) {
        throw new Error("Stale fixture owned by another run was detected.");
      }
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
      return;
    }

    const lead = await prisma.lead.create({
      data: {
        id: state.leadId,
        customerId: state.customerId,
        businessName: `E2E Synthetic ${state.runId}`,
        source: state.source,
        sourceRecordId: state.sourceRecordId,
        leadStatus: "NEW",
        priority: "LOW",
        packageFit: "UNKNOWN",
        city: "Test City",
        country: "PL"
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
        customerId: state.customerId,
        source: state.source,
        sourceRecordId: state.sourceRecordId
      }
    });

    assert.ok(lead, "Expected the current-run synthetic lead to exist.");
    assert.match(lead.businessName, /E2E Synthetic/);
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
    await prisma.lead.deleteMany({
      where: {
        customerId: state.customerId,
        source: state.source,
        sourceRecordId: state.sourceRecordId
      }
    });
    const remaining = await prisma.lead.findFirst({
      where: {
        customerId: state.customerId,
        source: state.source,
        sourceRecordId: state.sourceRecordId
      }
    });
    assert.equal(remaining, null);
    fs.rmSync(statePath, { force: true });
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const mode = process.argv[2];
  if (mode === "setup") return setup();
  if (mode === "verify") return verify();
  if (mode === "cleanup") return cleanup();
  throw new Error("Usage: pnpm e2e:fixture <setup|verify|cleanup>");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
