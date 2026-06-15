import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import {
  EXPECTED_REPOSITORY,
  assertTrustedRequestedRef,
  normalizeRequestedRef
} from "../scripts/resolve-preview-ref";
import { createSystemTmpDir } from "./test-helpers";

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

test("deploy preview dry-run validates the source checkout SHA independently from the control checkout", () => {
  const tmpRoot = createSystemTmpDir("clariobase-deploy-preview-");
  const sourceCheckout = path.join(tmpRoot, "source-checkout");
  const previewEnvDir = createSystemTmpDir("clariobase-deploy-preview-env-");
  const previewEnvFile = path.join(previewEnvDir, ".env.compose.preview.local");
  const currentHead = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });
  const parentHead = spawnSync("git", ["rev-parse", "HEAD~1"], { cwd: repoRoot, encoding: "utf8" });

  assert.equal(currentHead.status, 0);
  assert.equal(parentHead.status, 0);

  try {
    fs.rmSync(sourceCheckout, { recursive: true, force: true });
    const cloneResult = spawnSync("git", ["clone", "--no-checkout", repoRoot, sourceCheckout], {
      cwd: tmpRoot,
      encoding: "utf8"
    });

    assert.equal(cloneResult.status, 0, cloneResult.stderr);

    const checkoutResult = spawnSync("git", ["checkout", "--detach", parentHead.stdout.trim()], {
      cwd: sourceCheckout,
      encoding: "utf8"
    });

    assert.equal(checkoutResult.status, 0, checkoutResult.stderr);

    fs.writeFileSync(
      previewEnvFile,
      [
        "CRM_BIND_ADDRESS=0.0.0.0",
        "CRM_HOST_PORT=3001",
        "AI_EXCHANGE_HOST_PATH=./data/ai-exchange-preview",
        "CRM_POSTGRES_DB=clariobase_crm_preview",
        "CRM_POSTGRES_USER=clariobase_crm_preview_user",
        "CRM_POSTGRES_PASSWORD=preview-password",
        "CRM_DATABASE_URL=postgresql://clariobase_crm_preview_user:preview-password@crm-postgres:5432/clariobase_crm_preview?schema=public"
      ].join("\n")
    );

    const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
    const result = spawnSync(process.execPath, [
      tsxCli,
      "scripts/deploy-preview.ts",
      "--dry-run",
      "--requested-ref",
      "feature/preview",
      "--control-checkout-path",
      repoRoot,
      "--source-checkout-path",
      sourceCheckout,
      "--resolved-sha",
      parentHead.stdout.trim(),
      "--preview-env-file",
      previewEnvFile
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CRM_BUILD_CONTEXT: sourceCheckout
      }
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`"controlHeadSha":\\s*"${currentHead.stdout.trim()}"`));
    assert.match(result.stdout, new RegExp(`"sourceHeadSha":\\s*"${parentHead.stdout.trim()}"`));
    assert.match(result.stdout, /"requestedRef":\s*"feature\/preview"/);
  } finally {
    fs.rmSync(previewEnvDir, { recursive: true, force: true });
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("stop preview dry-run uses a secret-free env file and a trusted control checkout", () => {
  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const result = spawnSync(process.execPath, [
    tsxCli,
    "scripts/stop-preview.ts",
    "--dry-run",
    "--requested-ref",
    "stop-preview",
    "--control-checkout-path",
    repoRoot
  ], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"controlCheckoutPath":\s*"/);
  assert.match(result.stdout, /"stopPlan":\s*\{/);
  assert.doesNotMatch(result.stdout, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.doesNotMatch(result.stdout, /\.env\.compose\.preview\.local/);
});
