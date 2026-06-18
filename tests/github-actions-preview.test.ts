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
  assert.match(ciWorkflow, /actions\/checkout@v5/);
  assert.match(ciWorkflow, /actions\/setup-node@v5/);
  assert.match(ciWorkflow, /node-version: 22/);
  assert.match(ciWorkflow, /package-manager-cache: false/);
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
  assert.match(deployWorkflow, /actions\/checkout@v5/);
  assert.match(deployWorkflow, /actions\/setup-node@v5/);
  assert.match(deployWorkflow, /node-version: 22/);
  assert.match(deployWorkflow, /package-manager-cache: false/);
  assert.match(deployWorkflow, /group: clariobase-manual-preview-slot/);
  assert.match(deployWorkflow, /ref: main/);
  assert.match(deployWorkflow, /path: control/);
  assert.match(deployWorkflow, /path: source/);
  assert.match(deployWorkflow, /persist-credentials: false/);
  assert.match(deployWorkflow, /scripts\/resolve-preview-ref\.ts/);
  assert.match(deployWorkflow, /scripts\\deploy-preview\.ps1|scripts\/deploy-preview\.ps1/);
  assert.match(deployWorkflow, /\$deployExitCode = \$LASTEXITCODE/);
  assert.match(deployWorkflow, /if \(\$deployExitCode -ne 0\)/);
  assert.doesNotMatch(deployWorkflow, /\$deployOutput\s*=/);
  assert.doesNotMatch(deployWorkflow, /ConvertFrom-Json/);
  assert.match(deployWorkflow, /preview_url=http:\/\/Serwer:3001/);
  assert.match(
    deployWorkflow,
    /resolved_sha=\$\{\{ needs\.resolve-preview-ref\.outputs\.resolved_sha \}\}/
  );
  assert.match(deployWorkflow, /clariobase-preview/);
  assert.match(deployWorkflow, /http:\/\/Serwer:3001/);
  assert.match(deployWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(deployWorkflow, /if: always\(\)/);
  assert.doesNotMatch(deployWorkflow, /pull_request_target/);

  assert.match(stopWorkflow, /workflow_dispatch:/);
  assert.match(stopWorkflow, /group: clariobase-manual-preview-slot/);
  assert.match(stopWorkflow, /actions\/checkout@v5/);
  assert.match(stopWorkflow, /actions\/setup-node@v5/);
  assert.match(stopWorkflow, /node-version: 22/);
  assert.match(stopWorkflow, /package-manager-cache: false/);
  assert.match(stopWorkflow, /ref: main/);
  assert.match(stopWorkflow, /path: control/);
  assert.match(stopWorkflow, /persist-credentials: false/);
  assert.match(stopWorkflow, /scripts\\stop-preview\.ps1|scripts\/stop-preview\.ps1/);
  assert.match(stopWorkflow, /\$stopExitCode = \$LASTEXITCODE/);
  assert.match(stopWorkflow, /if \(\$stopExitCode -ne 0\)/);
  assert.doesNotMatch(stopWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(stopWorkflow, /if: always\(\)/);
  assert.doesNotMatch(stopWorkflow, /pull_request_target/);
  assert.doesNotMatch(`${ciWorkflow}\n${deployWorkflow}\n${stopWorkflow}`, /actions\/(checkout|setup-node)@v4/);

  assert.match(runnerDoc, /document_id: DOC-E016-WINDOWS-RUNNER/);
  assert.match(runnerDoc, /C:\\actions-runners\\clariobase-preview/);
  assert.match(runnerDoc, /C:\\actions-work\\clariobase-preview/);
  assert.match(runnerDoc, /clariobase-preview/);
  assert.match(runnerDoc, /short-lived repository-scoped registration token/i);
  assert.match(runnerDoc, /minimum supported version/i);
  assert.match(runnerDoc, /2\.327\.1/);
  assert.match(runnerDoc, /VersionInfo|FileVersion|Runner\.Listener\.exe/i);
  assert.match(runnerDoc, /Automatic with delayed startup behavior/i);
  assert.match(runnerDoc, /Stop Preview completed successfully after restart/i);
  assert.match(preflightScript, /must stay outside the protected production checkout path/);
  assert.match(preflightScript, /docker version/);
  assert.match(preflightScript, /MinimumRunnerVersion/);
  assert.match(preflightScript, /runnerVersion/);
});

test("E016 telemetry keeps implementation evidence separate from dynamic PR metadata", () => {
  const telemetry = read("docs/verification/e016-budget-telemetry.yaml");
  const assurance = read("docs/verification/e016-integrated-assurance.md");

  assert.match(telemetry, /implementation_evidence:/);
  assert.match(telemetry, /final_pr_evidence:/);
  assert.match(telemetry, /head_sha: dynamic/);
  assert.match(telemetry, /verification_rule: resolve from GitHub after the final documentation commit/);
  assert.doesNotMatch(telemetry, /final_pr_head_sha:/);
  assert.doesNotMatch(telemetry, /final_ci_run_id:/);
  assert.doesNotMatch(telemetry, /final_ci_conclusion:/);
  assert.match(assurance, /Final correction CI run: `27628718272` — `success`/i);
  assert.match(assurance, /The final preview contract test set passed with no failures after the Windows workflow correction/i);
});

test("trusted preview ref validation rejects fork-style and pull-request refs", () => {
  assert.equal(normalizeRequestedRef("refs/heads/main"), "main");
  assert.equal(normalizeRequestedRef("refs/tags/v1.2.3"), "v1.2.3");
  assert.equal(assertTrustedRequestedRef("epic/e016-manual-preview", EXPECTED_REPOSITORY), "epic/e016-manual-preview");

  assert.throws(() => normalizeRequestedRef("refs/pull/1/head"), /not trusted preview deployment targets/i);
  assert.throws(() => normalizeRequestedRef("owner:branch"), /disallowed characters/i);
  assert.throws(() => assertTrustedRequestedRef("main", "someone-else/repo"), /may only run inside/i);
});

test("resolve-preview-ref works offline from local trusted refs without a second network fetch", () => {
  const tmpRoot = createSystemTmpDir("clariobase-resolve-preview-ref-");
  const originRepo = path.join(tmpRoot, "origin.git");
  const workRepo = path.join(tmpRoot, "work");
  const outputFile = path.join(tmpRoot, "github-output.txt");
  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

  fs.rmSync(originRepo, { recursive: true, force: true });
  fs.rmSync(workRepo, { recursive: true, force: true });
  fs.mkdirSync(tmpRoot, { recursive: true });

  try {
    assert.equal(spawnSync("git", ["init", "--bare", originRepo], { encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["init", workRepo], { encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.email", "codex@example.com"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.name", "Codex"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["remote", "add", "origin", originRepo], { cwd: workRepo, encoding: "utf8" }).status, 0);

    fs.writeFileSync(path.join(workRepo, "README.md"), "first\n", "utf8");
    assert.equal(spawnSync("git", ["add", "README.md"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "first"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["branch", "-M", "main"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["push", "-u", "origin", "main"], { cwd: workRepo, encoding: "utf8" }).status, 0);

    fs.writeFileSync(path.join(workRepo, "README.md"), "second\n", "utf8");
    assert.equal(spawnSync("git", ["add", "README.md"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "second"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["checkout", "-b", "feature/ref-resolution"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    fs.writeFileSync(path.join(workRepo, "feature.txt"), "feature\n", "utf8");
    assert.equal(spawnSync("git", ["add", "feature.txt"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "feature"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["tag", "v1.2.3"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["push", "origin", "feature/ref-resolution", "v1.2.3"], { cwd: workRepo, encoding: "utf8" }).status, 0);

    const mainSha = spawnSync("git", ["rev-parse", "main"], { cwd: workRepo, encoding: "utf8" });
    const featureSha = spawnSync("git", ["rev-parse", "feature/ref-resolution"], { cwd: workRepo, encoding: "utf8" });
    const tagSha = spawnSync("git", ["rev-parse", "v1.2.3"], { cwd: workRepo, encoding: "utf8" });

    assert.equal(mainSha.status, 0, mainSha.stderr);
    assert.equal(featureSha.status, 0, featureSha.stderr);
    assert.equal(tagSha.status, 0, tagSha.stderr);

    const checkoutRepo = path.join(tmpRoot, "checkout");
    assert.equal(spawnSync("git", ["clone", originRepo, checkoutRepo], { encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["fetch", "--all", "--tags"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["remote", "set-url", "origin", "https://github.invalid/private/repository.git"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.email", "codex@example.com"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.name", "Codex"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);

    const mainLocalRef = spawnSync("git", ["rev-parse", "refs/remotes/origin/main^{commit}"], { cwd: checkoutRepo, encoding: "utf8" });
    const featureLocalRef = spawnSync("git", ["rev-parse", "refs/remotes/origin/feature/ref-resolution^{commit}"], { cwd: checkoutRepo, encoding: "utf8" });
    const tagLocalRef = spawnSync("git", ["rev-parse", "refs/tags/v1.2.3^{commit}"], { cwd: checkoutRepo, encoding: "utf8" });

    assert.equal(mainLocalRef.status, 0, mainLocalRef.stderr);
    assert.equal(featureLocalRef.status, 0, featureLocalRef.stderr);
    assert.equal(tagLocalRef.status, 0, tagLocalRef.stderr);

    const branchOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "refs/heads/main"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GITHUB_OUTPUT: outputFile
      }
    });

    assert.equal(branchOutput.status, 0, branchOutput.stderr);
    assert.match(branchOutput.stdout, new RegExp(`"requestedRef":\\s*"main"`));
    assert.match(branchOutput.stdout, new RegExp(`"resolvedSha":\\s*"${mainLocalRef.stdout.trim()}"`));

    const outputContent = fs.readFileSync(outputFile, "utf8");
    assert.match(outputContent, /requested_ref=main/);
    assert.match(outputContent, new RegExp(`resolved_sha=${mainLocalRef.stdout.trim()}`));

    const featureOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "feature/ref-resolution"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.equal(featureOutput.status, 0, featureOutput.stderr);
    assert.match(featureOutput.stdout, new RegExp(`"resolvedSha":\\s*"${featureLocalRef.stdout.trim()}"`));

    const tagOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "v1.2.3"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.equal(tagOutput.status, 0, tagOutput.stderr);
    assert.match(tagOutput.stdout, new RegExp(`"resolvedSha":\\s*"${tagLocalRef.stdout.trim()}"`));

    const reachableShaOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      featureLocalRef.stdout.trim()
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.equal(reachableShaOutput.status, 0, reachableShaOutput.stderr);
    assert.match(reachableShaOutput.stdout, new RegExp(`"resolvedSha":\\s*"${featureLocalRef.stdout.trim()}"`));

    const missingRef = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "missing/ref"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.notEqual(missingRef.status, 0);
    assert.match(missingRef.stderr || missingRef.stdout, /Could not resolve trusted origin branch, tag, or commit/i);

    const pullRef = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "refs/pull/1/head"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.notEqual(pullRef.status, 0);
    assert.match(pullRef.stderr || pullRef.stdout, /Pull request refs are not trusted preview deployment targets/i);

    assert.equal(spawnSync("git", ["checkout", "-b", "local-only"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    fs.writeFileSync(path.join(checkoutRepo, "local-only.txt"), "local only\n", "utf8");
    assert.equal(spawnSync("git", ["add", "local-only.txt"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "local-only"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    const unreachableSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: checkoutRepo, encoding: "utf8" });

    assert.equal(unreachableSha.status, 0, unreachableSha.stderr);

    const unreachableOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      unreachableSha.stdout.trim()
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.notEqual(unreachableOutput.status, 0);
    assert.match(unreachableOutput.stderr || unreachableOutput.stdout, /not reachable from a trusted origin ref/i);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("preview workflows keep the requested SHA as source input while control scripts come from the trusted checkout", () => {
  const deployWorkflow = read(".github/workflows/deploy-preview.yml");
  const stopWorkflow = read(".github/workflows/stop-preview.yml");
  const deployWrapper = read("scripts/deploy-preview.ps1");
  const stopWrapper = read("scripts/stop-preview.ps1");

  assert.match(deployWorkflow, /Check out trusted workflow revision/);
  assert.match(deployWorkflow, /Check out requested source SHA/);
  assert.match(deployWorkflow, /-ControlCheckoutPath \$PWD/);
  assert.match(deployWorkflow, /-SourceCheckoutPath \(Join-Path \$PWD "\.\.\\source"\)/);
  assert.match(deployWorkflow, /Requested ref:/);
  assert.match(deployWorkflow, /Resolved SHA:/);
  assert.match(stopWorkflow, /Stop preview/);
  assert.doesNotMatch(stopWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(deployWrapper, /ControlCheckoutPath/);
  assert.match(deployWrapper, /SourceCheckoutPath/);
  assert.match(stopWrapper, /ControlCheckoutPath/);
});

test("deploy preview dry-run validates the source checkout SHA independently from the control checkout", () => {
  const tmpRoot = createSystemTmpDir("clariobase-deploy-preview-");
  const sourceCheckout = path.join(tmpRoot, "source-checkout");
  const previewEnvDir = createSystemTmpDir("clariobase-deploy-preview-env-");
  const previewEnvFile = path.join(previewEnvDir, ".env.compose.preview.local");
  const currentHead = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });

  assert.equal(currentHead.status, 0);

  try {
    fs.rmSync(sourceCheckout, { recursive: true, force: true });
    fs.mkdirSync(sourceCheckout, { recursive: true });

    const initResult = spawnSync("git", ["init"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);

    const configEmail = spawnSync("git", ["config", "user.email", "codex@example.com"], {
      cwd: sourceCheckout,
      encoding: "utf8"
    });
    assert.equal(configEmail.status, 0, configEmail.stderr);

    const configName = spawnSync("git", ["config", "user.name", "Codex"], {
      cwd: sourceCheckout,
      encoding: "utf8"
    });
    assert.equal(configName.status, 0, configName.stderr);

    fs.writeFileSync(path.join(sourceCheckout, "README.md"), "source checkout test\n");
    let commitResult = spawnSync("git", ["add", "README.md"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(commitResult.status, 0, commitResult.stderr);
    commitResult = spawnSync("git", ["commit", "-m", "first"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(commitResult.status, 0, commitResult.stderr);

    fs.writeFileSync(path.join(sourceCheckout, "README.md"), "source checkout test v2\n");
    commitResult = spawnSync("git", ["add", "README.md"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(commitResult.status, 0, commitResult.stderr);
    commitResult = spawnSync("git", ["commit", "-m", "second"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(commitResult.status, 0, commitResult.stderr);

    const sourceHead = spawnSync("git", ["rev-parse", "HEAD"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(sourceHead.status, 0, sourceHead.stderr);

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
      sourceHead.stdout.trim(),
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
    assert.match(result.stdout, new RegExp(`"sourceHeadSha":\\s*"${sourceHead.stdout.trim()}"`));
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
