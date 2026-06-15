import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  EXPECTED_REPOSITORY,
  assertTrustedRequestedRef,
  normalizeRequestedRef
} from "../scripts/resolve-preview-ref";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("preview workflows use trusted triggers, least privilege, and the approved scripts", () => {
  const ciWorkflow = read(".github/workflows/ci.yml");
  const deployWorkflow = read(".github/workflows/deploy-preview.yml");
  const stopWorkflow = read(".github/workflows/stop-preview.yml");
  const runnerDoc = read("docs/operations/windows-self-hosted-runner.md");
  const preflightScript = read("scripts/runner-preflight.ps1");

  assert.match(ciWorkflow, /pull_request:/);
  assert.match(ciWorkflow, /contents: read/);
  assert.match(ciWorkflow, /corepack pnpm install --frozen-lockfile/);
  assert.match(ciWorkflow, /corepack pnpm prisma:validate/);
  assert.match(ciWorkflow, /corepack pnpm prisma:generate/);
  assert.match(ciWorkflow, /corepack pnpm lint/);
  assert.match(ciWorkflow, /corepack pnpm test/);
  assert.match(ciWorkflow, /corepack pnpm build/);
  assert.doesNotMatch(ciWorkflow, /pull_request_target/);

  assert.match(deployWorkflow, /workflow_dispatch:/);
  assert.match(deployWorkflow, /requested_ref:/);
  assert.match(deployWorkflow, /contents: read/);
  assert.match(deployWorkflow, /group: clariobase-manual-preview-slot/);
  assert.match(deployWorkflow, /ref: main/);
  assert.match(deployWorkflow, /path: control/);
  assert.match(deployWorkflow, /path: source/);
  assert.match(deployWorkflow, /persist-credentials: false/);
  assert.match(deployWorkflow, /scripts\/resolve-preview-ref\.ts/);
  assert.match(deployWorkflow, /scripts\\deploy-preview\.ps1|scripts\/deploy-preview\.ps1/);
  assert.match(deployWorkflow, /clariobase-preview/);
  assert.match(deployWorkflow, /http:\/\/Serwer:3001/);
  assert.match(deployWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(deployWorkflow, /if: always\(\)/);
  assert.doesNotMatch(deployWorkflow, /pull_request_target/);

  assert.match(stopWorkflow, /workflow_dispatch:/);
  assert.match(stopWorkflow, /group: clariobase-manual-preview-slot/);
  assert.match(stopWorkflow, /ref: main/);
  assert.match(stopWorkflow, /path: control/);
  assert.match(stopWorkflow, /persist-credentials: false/);
  assert.match(stopWorkflow, /scripts\\stop-preview\.ps1|scripts\/stop-preview\.ps1/);
  assert.doesNotMatch(stopWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(stopWorkflow, /if: always\(\)/);
  assert.doesNotMatch(stopWorkflow, /pull_request_target/);

  assert.match(runnerDoc, /document_id: DOC-E016-WINDOWS-RUNNER/);
  assert.match(runnerDoc, /C:\\actions-runners\\clariobase-preview/);
  assert.match(runnerDoc, /C:\\actions-work\\clariobase-preview/);
  assert.match(runnerDoc, /clariobase-preview/);
  assert.match(runnerDoc, /short-lived repository-scoped registration token/i);
  assert.match(runnerDoc, /start automatically after host restart/i);
  assert.match(runnerDoc, /explicit post-merge manual gate/i);
  assert.match(preflightScript, /must stay outside the protected production checkout path/);
  assert.match(preflightScript, /docker version/);
});

test("trusted preview ref validation rejects fork-style and pull-request refs", () => {
  assert.equal(normalizeRequestedRef("refs/heads/main"), "main");
  assert.equal(normalizeRequestedRef("refs/tags/v1.2.3"), "v1.2.3");
  assert.equal(assertTrustedRequestedRef("epic/e016-manual-preview", EXPECTED_REPOSITORY), "epic/e016-manual-preview");

  assert.throws(() => normalizeRequestedRef("refs/pull/1/head"), /not trusted preview deployment targets/i);
  assert.throws(() => normalizeRequestedRef("owner:branch"), /disallowed characters/i);
  assert.throws(() => assertTrustedRequestedRef("main", "someone-else/repo"), /may only run inside/i);
});

test("preview workflows keep the requested SHA as source input while control scripts come from the trusted checkout", () => {
  const deployWorkflow = read(".github/workflows/deploy-preview.yml");
  const stopWorkflow = read(".github/workflows/stop-preview.yml");

  assert.match(deployWorkflow, /Check out trusted workflow revision/);
  assert.match(deployWorkflow, /Check out requested source SHA/);
  assert.match(deployWorkflow, /-ControlCheckoutPath \$PWD/);
  assert.match(deployWorkflow, /-SourceCheckoutPath \(Join-Path \$PWD "\.\.\\source"\)/);
  assert.match(deployWorkflow, /Requested ref:/);
  assert.match(deployWorkflow, /Resolved SHA:/);
  assert.match(stopWorkflow, /Stop preview/);
  assert.doesNotMatch(stopWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
});
