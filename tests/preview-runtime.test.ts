import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  PREVIEW_AI_EXCHANGE_PATH,
  PREVIEW_DB_NAME,
  PREVIEW_DB_USER,
  PREVIEW_ENV_EXAMPLE_FILE,
  PREVIEW_ENV_FILE_NAME,
  PREVIEW_HOST_PORT,
  PREVIEW_NETWORK_NAME,
  PREVIEW_PROJECT_NAME,
  PREVIEW_URL,
  PREVIEW_VOLUME_NAME,
  buildDeployPlan,
  buildStopPlan,
  createPreviewSummary,
  executeDeployPlanWithEnv,
  getRepoRoot,
  loadPreviewEnv,
  parseEnvFileContent,
  parsePreviewDatabaseLifecycleMode,
  validatePreviewComposeModel,
  validateFullCommitSha,
  validateResolvedSha,
  validateResetConfirmation
} from "../scripts/preview-runtime-support";
import { createRepoTmpDir } from "./test-helpers";

const repoRoot = getRepoRoot();
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const previewImageRef = "ghcr.io/lukexd09/clariobase-ai-crm@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function hasDocker() {
  return spawnSync("docker", ["version"], { cwd: repoRoot, stdio: "ignore" }).status === 0;
}

const dockerAvailable = hasDocker();

function createCommitRepo(rootDir: string, label: string) {
  fs.rmSync(rootDir, { recursive: true, force: true });
  fs.mkdirSync(rootDir, { recursive: true });

  assert.equal(spawnSync("git", ["init"], { cwd: rootDir, encoding: "utf8" }).status, 0);
  assert.equal(spawnSync("git", ["config", "user.email", "codex@example.com"], { cwd: rootDir, encoding: "utf8" }).status, 0);
  assert.equal(spawnSync("git", ["config", "user.name", "Codex"], { cwd: rootDir, encoding: "utf8" }).status, 0);
  fs.writeFileSync(path.join(rootDir, "README.md"), `${label}\n`, "utf8");
  assert.equal(spawnSync("git", ["add", "README.md"], { cwd: rootDir, encoding: "utf8" }).status, 0);
  assert.equal(spawnSync("git", ["commit", "-m", label], { cwd: rootDir, encoding: "utf8" }).status, 0);

  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: rootDir, encoding: "utf8" });
  assert.equal(head.status, 0, head.stderr);
  return head.stdout.trim();
}

function writePreviewEnv(rootDir: string, values?: Partial<Record<string, string>>) {
  const envDir = path.join(rootDir, "env");
  const envPath = path.join(envDir, PREVIEW_ENV_FILE_NAME);
  const defaults = {
    CRM_BIND_ADDRESS: "0.0.0.0",
    CRM_HOST_PORT: "3001",
    AI_EXCHANGE_HOST_PATH: "./data/ai-exchange-preview",
    CRM_POSTGRES_DB: "clariobase_crm_preview",
    CRM_POSTGRES_USER: "clariobase_crm_preview_user",
    CRM_POSTGRES_PASSWORD: "preview-password",
    CRM_DATABASE_URL: "postgresql://clariobase_crm_preview_user:preview-password@crm-postgres:5432/clariobase_crm_preview?schema=public",
    CRM_AUTH_RUNTIME_MODE: "localhost-dev",
    BETTER_AUTH_URL: "http://127.0.0.1:3000",
    BETTER_AUTH_SECRET: "preview-test-better-auth-secret-preview-test-better-auth-secret",
    ...values
  };

  fs.mkdirSync(envDir, { recursive: true });
  fs.writeFileSync(envPath, Object.entries(defaults).map(([name, value]) => `${name}=${value}`).join("\n"), "utf8");
  return envPath;
}

function runDeployDryRun(options: {
  controlCheckoutPath: string;
  previewEnvFile: string;
  sourceCheckoutPath?: string;
  sourceMode?: string;
  resolvedSha?: string;
  databaseMode?: string;
  resetConfirmation?: string;
}) {
  const args = [
    tsxCli,
    "scripts/deploy-preview.ts",
    "--dry-run",
    "--requested-ref",
    "feature/test",
    "--control-checkout-path",
    options.controlCheckoutPath
  ];

  if (options.sourceCheckoutPath) {
    args.push("--source-checkout-path", options.sourceCheckoutPath);
  }
  if (options.sourceMode) {
    args.push("--source-mode", options.sourceMode);
  }
  if (options.resolvedSha) {
    args.push("--resolved-sha", options.resolvedSha);
  }
  if (options.databaseMode) {
    args.push("--database-mode", options.databaseMode);
  }
  if (options.resetConfirmation !== undefined) {
    args.push("--reset-confirmation", options.resetConfirmation);
  }
  args.push("--preview-env-file", options.previewEnvFile);

  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CRM_PREVIEW_IMAGE_REF: previewImageRef
    }
  });
}

function runStopDryRun(options: {
  controlCheckoutPath: string;
  databaseMode?: string;
  resetConfirmation?: string;
  resolvedSha?: string;
}) {
  const args = [
    tsxCli,
    "scripts/stop-preview.ts",
    "--dry-run",
    "--requested-ref",
    "stop-preview",
    "--control-checkout-path",
    options.controlCheckoutPath
  ];

  if (options.databaseMode) {
    args.push("--database-mode", options.databaseMode);
  }
  if (options.resetConfirmation !== undefined) {
    args.push("--reset-confirmation", options.resetConfirmation);
  }
  if (options.resolvedSha) {
    args.push("--resolved-sha", options.resolvedSha);
  }

  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runStopPreview(options: {
  controlCheckoutPath: string;
  databaseMode?: string;
  resetConfirmation?: string;
  resolvedSha?: string;
  dockerExitCode?: number;
}) {
  const args = [
    tsxCli,
    "scripts/stop-preview.ts",
    "--requested-ref",
    "stop-preview",
    "--control-checkout-path",
    options.controlCheckoutPath
  ];

  if (options.databaseMode) {
    args.push("--database-mode", options.databaseMode);
  }
  if (options.resetConfirmation !== undefined) {
    args.push("--reset-confirmation", options.resetConfirmation);
  }
  if (options.resolvedSha) {
    args.push("--resolved-sha", options.resolvedSha);
  }

  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(options.dockerExitCode === undefined ? {} : { DOCKER_EXIT_CODE: String(options.dockerExitCode) })
    }
  });
}

function runPreviewComposeConfig(previewEnvFilePath: string, formatJson = false) {
  return spawnSync(
    "docker",
    [
      "compose",
      "--env-file",
      previewEnvFilePath,
      "-f",
      "compose.yaml",
      "-f",
      "compose.preview.yaml",
      "config",
      ...(formatJson ? ["--format", "json"] : [])
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CRM_POSTGRES_PASSWORD: "preview-password",
        CRM_PREVIEW_IMAGE_REF: previewImageRef
      }
    }
  );
}

test("preview runtime assets pin the approved preview identity", () => {
  const composePreviewFile = read("compose.preview.yaml");
  const composePreviewEnvExample = read(PREVIEW_ENV_EXAMPLE_FILE);
  const previewRunbook = read("docs/operations/preview-operations.md");
  const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  const deployWrapper = read("scripts/deploy-preview.ps1");
  const stopWrapper = read("scripts/stop-preview.ps1");

  assert.ok(packageJson.scripts["test:infra"].includes("tests/preview-runtime.test.ts"));
  assert.match(composePreviewFile, /clariobase-crm-preview-network/);
  assert.match(composePreviewFile, /clariobase-crm-preview-postgres-data/);
  assert.match(composePreviewFile, /io\.clariobase\.runtime-scope: preview/);
  assert.match(composePreviewEnvExample, /^CRM_BIND_ADDRESS=0\.0\.0\.0$/m);
  assert.match(composePreviewEnvExample, /^CRM_HOST_PORT=3001$/m);
  assert.match(composePreviewEnvExample, /^AI_EXCHANGE_HOST_PATH=\.\/data\/ai-exchange-preview$/m);
  assert.match(composePreviewEnvExample, /^CRM_POSTGRES_DB=clariobase_crm_preview$/m);
  assert.match(composePreviewEnvExample, /^CRM_POSTGRES_USER=clariobase_crm_preview_user$/m);
  assert.match(composePreviewEnvExample, /^CRM_POSTGRES_PASSWORD=$/m);
  assert.match(composePreviewEnvExample, /^CRM_AUTH_RUNTIME_MODE=localhost-dev$/m);
  assert.match(composePreviewEnvExample, /^BETTER_AUTH_URL=http:\/\/127\.0\.0\.1:3000$/m);
  assert.match(composePreviewEnvExample, /^BETTER_AUTH_SECRET=$/m);
  assert.match(previewRunbook, /document_id: DOC-E016-PREVIEW-OPERATIONS/);
  assert.match(previewRunbook, /scripts\/deploy-preview\.ps1/);
  assert.match(previewRunbook, /scripts\/stop-preview\.ps1/);
  assert.match(previewRunbook, /clariobase-crm-preview/);
  assert.match(previewRunbook, /do not reuse production `.env\.compose\.local`/i);
  assert.match(previewRunbook, /docker system prune/);
  assert.match(deployWrapper, /scripts\/deploy-preview\.ts/);
  assert.match(stopWrapper, /scripts\/stop-preview\.ts/);
});

test("preview runtime support validates a safe preview env file", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "preview-runtime-");
  const previewEnvFilePath = writePreviewEnv(tmpRoot);

  try {
    process.env.CRM_PREVIEW_IMAGE_REF = previewImageRef;
    const config = loadPreviewEnv(previewEnvFilePath);

    assert.equal(config.env.CRM_BIND_ADDRESS, "0.0.0.0");
    assert.equal(config.env.CRM_HOST_PORT, PREVIEW_HOST_PORT);
    assert.equal(config.previewUrl, PREVIEW_URL);
    assert.equal(config.env.AI_EXCHANGE_HOST_PATH, PREVIEW_AI_EXCHANGE_PATH);
    assert.equal(config.env.CRM_DATABASE_URL, `postgresql://${PREVIEW_DB_USER}:preview-password@crm-postgres:5432/${PREVIEW_DB_NAME}?schema=public`);
    assert.equal(config.previewAiExchangeAbsolutePath.replace(/\\/g, "/").endsWith("/data/ai-exchange-preview"), true);
    assert.match(config.previewLocalReadyUrl, /127\.0\.0\.1:3001\/api\/ready/);
  } finally {
    delete process.env.CRM_PREVIEW_IMAGE_REF;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("preview runtime support rejects production collisions", () => {
  const previewEnv = parseEnvFileContent([
    "CRM_BIND_ADDRESS=0.0.0.0",
    "CRM_HOST_PORT=3000",
    "AI_EXCHANGE_HOST_PATH=./data/ai-exchange",
    "CRM_POSTGRES_DB=clariobase_crm",
    "CRM_POSTGRES_USER=clariobase_crm_user",
    "CRM_POSTGRES_PASSWORD=preview-password"
  ].join("\n"));
  assert.equal(previewEnv.get("CRM_HOST_PORT"), "3000");

  const tmpRoot = createRepoTmpDir(repoRoot, "preview-runtime-unsafe-");
  const previewEnvFilePath = writePreviewEnv(tmpRoot, {
    CRM_HOST_PORT: "3000",
    AI_EXCHANGE_HOST_PATH: "./data/ai-exchange",
    CRM_POSTGRES_DB: "clariobase_crm"
  });

  try {
    process.env.CRM_PREVIEW_IMAGE_REF = previewImageRef;
    assert.throws(() => loadPreviewEnv(previewEnvFilePath), /Preview host port must stay pinned to 3001|protected production path|preview database/i);
  } finally {
    delete process.env.CRM_PREVIEW_IMAGE_REF;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("preview deploy and stop plans stay scoped to the approved preview stack", () => {
  const deployPlan = buildDeployPlan(path.join(repoRoot, PREVIEW_ENV_FILE_NAME), previewImageRef);
  const resetDeployPlan = buildDeployPlan(path.join(repoRoot, PREVIEW_ENV_FILE_NAME), previewImageRef, "reset");
  const stopPlan = buildStopPlan(path.join(repoRoot, PREVIEW_ENV_FILE_NAME));
  const resetStopPlan = buildStopPlan(path.join(repoRoot, PREVIEW_ENV_FILE_NAME), "reset");
  const summary = createPreviewSummary("epic/e016-manual-preview", "0123456789abcdef0123456789abcdef01234567", "open_pr");

  assert.match(deployPlan.validateComposeModel.join(" "), /config --format json/);
  assert.deepEqual(deployPlan.pullExactImage, ["pull", previewImageRef]);
  assert.match(deployPlan.replaceExistingPreview.join(" "), /down --remove-orphans/);
  assert.match(deployPlan.startDatabase.join(" "), /up -d crm-postgres/);
  assert.match(deployPlan.migrate.join(" "), /run --rm --pull never crm-app/);
  assert.match(deployPlan.startApplication.join(" "), /up -d --no-build --pull never crm-app/);
  assert.match(stopPlan.down.join(" "), /down --remove-orphans/);
  assert.match(resetDeployPlan.replaceExistingPreview.join(" "), /down -v --remove-orphans/);
  assert.match(resetStopPlan.down.join(" "), /down -v --remove-orphans/);
  assert.equal(deployPlan.databaseLifecycleMode, "preserve");
  assert.equal(deployPlan.databaseVolumeAction, "preserve");
  assert.equal(resetDeployPlan.databaseLifecycleMode, "reset");
  assert.equal(resetDeployPlan.databaseVolumeAction, "reset");
  assert.equal(stopPlan.databaseLifecycleMode, "preserve");
  assert.equal(stopPlan.databaseVolumeAction, "preserve");
  assert.equal(resetStopPlan.databaseLifecycleMode, "reset");
  assert.equal(resetStopPlan.databaseVolumeAction, "reset");
  assert.equal(summary.previewUrl, PREVIEW_URL);
  assert.equal(summary.projectName, PREVIEW_PROJECT_NAME);
  assert.equal(summary.volumeName, PREVIEW_VOLUME_NAME);
  assert.equal(summary.networkName, PREVIEW_NETWORK_NAME);
  assert.equal(summary.sourceMode, "open_pr");
});

test("preview identity validation separates control and source checkout identities", () => {
  const controlSha = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const sourceSha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

  assert.equal(validateFullCommitSha(controlSha, "Control checkout HEAD"), controlSha);
  assert.equal(validateFullCommitSha(sourceSha, "Resolved SHA"), sourceSha);
  assert.equal(validateResolvedSha(sourceSha, sourceSha), sourceSha);
  assert.equal(validateResolvedSha(controlSha), controlSha);
  assert.throws(
    () => validateResolvedSha(controlSha, sourceSha),
    /Current checkout SHA aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa does not match the expected resolved SHA bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\./
  );
  assert.throws(() => validateFullCommitSha("not-a-sha", "Resolved SHA"), /Resolved SHA must be a full 40-character Git commit SHA: not-a-sha/);
});

test("preview compose model validation fails closed for malformed or unsafe models", () => {
  const baseModel = { services: { "crm-app": { image: previewImageRef, pull_policy: "never" } } };

  assert.throws(() => validatePreviewComposeModel("{", previewImageRef), /Failed to parse preview compose model as JSON/);
  assert.throws(() => validatePreviewComposeModel("{}", previewImageRef), /must define crm-app/);
  assert.throws(() => validatePreviewComposeModel(JSON.stringify({ services: {} }), previewImageRef), /must define crm-app/);
  assert.throws(
    () => validatePreviewComposeModel(JSON.stringify({ services: { "crm-app": { pull_policy: "never" } } }), previewImageRef),
    /must match/
  );
  assert.throws(
    () => validatePreviewComposeModel(JSON.stringify({ services: { "crm-app": { image: previewImageRef, build: {}, pull_policy: "never" } } }), previewImageRef),
    /must not include crm-app\.build/
  );
  assert.throws(
    () => validatePreviewComposeModel(JSON.stringify({ services: { "crm-app": { image: previewImageRef, build: null, pull_policy: "never" } } }), previewImageRef),
    /must not include crm-app\.build/
  );
  assert.throws(
    () => validatePreviewComposeModel(JSON.stringify({ services: { "crm-app": { image: previewImageRef } } }), previewImageRef),
    /pull_policy to never/
  );
  assert.throws(
    () => validatePreviewComposeModel(JSON.stringify({ services: { "crm-app": { image: previewImageRef, pull_policy: "always" } } }), previewImageRef),
    /pull_policy to never/
  );
  assert.doesNotThrow(() => validatePreviewComposeModel(JSON.stringify(baseModel), previewImageRef));
});

test("deploy preview dry-run separates trusted control checkout from resolved deployment SHA", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "deploy-preview-dry-run-control-only-");
  const controlCheckoutPath = path.join(tmpRoot, "control");
  const previewEnvFile = writePreviewEnv(tmpRoot);

  try {
    const controlHeadSha = createCommitRepo(controlCheckoutPath, "control-checkout");
    const resolvedSha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const result = runDeployDryRun({ controlCheckoutPath, resolvedSha, previewEnvFile, sourceMode: "main" });

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout) as {
      controlHeadSha: string;
      resolvedSha: string;
      sourceCheckoutProvided: boolean;
      sourceMode: string;
      sourceHeadSha?: string;
    };
    assert.equal(output.controlHeadSha, controlHeadSha);
    assert.equal(output.resolvedSha, resolvedSha);
    assert.equal(output.sourceMode, "main");
    assert.equal(output.sourceCheckoutProvided, false);
    assert.equal(output.sourceHeadSha, undefined);
    assert.doesNotMatch(result.stdout, /Current checkout SHA .* does not match the expected resolved SHA/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("deploy preview dry-run accepts an explicit source checkout when it matches the resolved SHA", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "deploy-preview-dry-run-source-match-");
  const controlCheckoutPath = path.join(tmpRoot, "control");
  const sourceCheckoutPath = path.join(tmpRoot, "source");
  const previewEnvFile = writePreviewEnv(tmpRoot);

  try {
    const controlHeadSha = createCommitRepo(controlCheckoutPath, "control-checkout");
    const sourceHeadSha = createCommitRepo(sourceCheckoutPath, "source-checkout");
    const result = runDeployDryRun({ controlCheckoutPath, sourceCheckoutPath, resolvedSha: sourceHeadSha, previewEnvFile });

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout) as {
      controlHeadSha: string;
      resolvedSha: string;
      sourceCheckoutProvided: boolean;
      sourceHeadSha: string;
    };
    assert.equal(output.controlHeadSha, controlHeadSha);
    assert.equal(output.sourceHeadSha, sourceHeadSha);
    assert.equal(output.resolvedSha, sourceHeadSha);
    assert.equal(output.sourceCheckoutProvided, true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("deploy preview dry-run fails when the explicit source checkout mismatches the resolved SHA", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "deploy-preview-dry-run-source-mismatch-");
  const controlCheckoutPath = path.join(tmpRoot, "control");
  const sourceCheckoutPath = path.join(tmpRoot, "source");
  const previewEnvFile = writePreviewEnv(tmpRoot);

  try {
    createCommitRepo(controlCheckoutPath, "control-checkout");
    const sourceHeadSha = createCommitRepo(sourceCheckoutPath, "source-checkout");
    const expectedResolvedSha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const result = runDeployDryRun({ controlCheckoutPath, sourceCheckoutPath, resolvedSha: expectedResolvedSha, previewEnvFile });

    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr || result.stdout,
      new RegExp(`Current checkout SHA ${sourceHeadSha} does not match the expected resolved SHA ${expectedResolvedSha}\\.`, "i")
    );
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("deploy preview dry-run rejects invalid resolved SHAs without a source checkout", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "deploy-preview-dry-run-invalid-sha-");
  const controlCheckoutPath = path.join(tmpRoot, "control");
  const previewEnvFile = writePreviewEnv(tmpRoot);

  try {
    createCommitRepo(controlCheckoutPath, "control-checkout");
    const result = runDeployDryRun({ controlCheckoutPath, resolvedSha: "not-a-sha", previewEnvFile });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr || result.stdout, /Resolved SHA must be a full 40-character Git commit SHA: not-a-sha/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("deploy preview dry-run falls back to the trusted control checkout HEAD when no resolved SHA is provided", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "deploy-preview-dry-run-fallback-");
  const controlCheckoutPath = path.join(tmpRoot, "control");
  const previewEnvFile = writePreviewEnv(tmpRoot);

  try {
    const controlHeadSha = createCommitRepo(controlCheckoutPath, "control-checkout");
    const result = runDeployDryRun({ controlCheckoutPath, previewEnvFile });

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout) as {
      controlHeadSha: string;
      resolvedSha: string;
      sourceCheckoutProvided: boolean;
      sourceHeadSha?: string;
    };
    assert.equal(output.controlHeadSha, controlHeadSha);
    assert.equal(output.resolvedSha, controlHeadSha);
    assert.equal(output.sourceCheckoutProvided, false);
    assert.equal(output.sourceHeadSha, undefined);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("deploy preview propagates the immutable image ref to the preview commands", () => {
  const deployPlan = buildDeployPlan(path.join(repoRoot, PREVIEW_ENV_FILE_NAME), previewImageRef);
  const observed = [] as Array<{ description: string; previewImageRef?: string }>;

  executeDeployPlanWithEnv(deployPlan, { CRM_PREVIEW_IMAGE_REF: previewImageRef }, (command, args, env) => {
    assert.equal(command, "docker");
    observed.push({ description: args.join(" "), previewImageRef: env.CRM_PREVIEW_IMAGE_REF });
    return { pid: 1, output: ["", ""], stdout: "", stderr: "", status: 0, signal: null };
  });

  assert.equal(observed.length, 6);
  assert.deepEqual(observed.map((entry) => entry.previewImageRef), Array(6).fill(previewImageRef));
  assert.match(observed[0].description, /config --format json/);
  assert.match(observed[1].description, /pull ghcr\.io/);
  assert.match(observed[2].description, /down --remove-orphans/);
  assert.match(observed[3].description, /up -d crm-postgres/);
  assert.match(observed[4].description, /migrate deploy/);
  assert.match(observed[5].description, /up -d --no-build --pull never crm-app/);
});

test("deploy preview dry-run propagates reset confirmation only through validated inputs", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "deploy-preview-dry-run-reset-confirmation-");
  const controlCheckoutPath = path.join(tmpRoot, "control");
  const previewEnvFile = writePreviewEnv(tmpRoot);

  try {
    const controlHeadSha = createCommitRepo(controlCheckoutPath, "control-checkout");
    const preserveResult = runDeployDryRun({ controlCheckoutPath, previewEnvFile, databaseMode: "preserve" });
    assert.equal(preserveResult.status, 0, preserveResult.stderr);
    assert.doesNotMatch(preserveResult.stdout, /RESET PREVIEW DATABASE/);

    const resetResult = runDeployDryRun({
      controlCheckoutPath,
      previewEnvFile,
      resolvedSha: controlHeadSha,
      databaseMode: "reset",
      resetConfirmation: "RESET PREVIEW DATABASE"
    });
    assert.equal(resetResult.status, 0, resetResult.stderr);
    assert.doesNotMatch(resetResult.stdout, /RESET PREVIEW DATABASE/);

    const blockedReset = runDeployDryRun({
      controlCheckoutPath,
      previewEnvFile,
      resolvedSha: controlHeadSha,
      databaseMode: "reset"
    });
    assert.notEqual(blockedReset.status, 0);
    assert.match(blockedReset.stderr || blockedReset.stdout, /reset_confirmation must exactly equal RESET PREVIEW DATABASE/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("stop preview dry-run classifies validation and docker failure states", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "stop-preview-dry-run-");
  const controlCheckoutPath = path.join(tmpRoot, "control");

  try {
    const controlHeadSha = createCommitRepo(controlCheckoutPath, "control-checkout");
    const preserve = runStopDryRun({ controlCheckoutPath, resolvedSha: controlHeadSha, databaseMode: "preserve" });
    assert.equal(preserve.status, 0, preserve.stderr);
    const preservePayload = JSON.parse(preserve.stdout) as { result: string; databaseMode: string; databaseVolume: string; failureStage?: string };
    assert.equal(preservePayload.result, "PASS");
    assert.equal(preservePayload.databaseMode, "preserve");
    assert.equal(preservePayload.databaseVolume, "preserved");

    const blockedReset = runStopDryRun({ controlCheckoutPath, resolvedSha: controlHeadSha, databaseMode: "reset", resetConfirmation: "" });
    assert.notEqual(blockedReset.status, 0);
    const blockedPayload = JSON.parse(blockedReset.stdout) as { result: string; databaseMode: string; databaseVolume: string; failureStage?: string };
    assert.equal(blockedPayload.result, "BLOCKED");
    assert.equal(blockedPayload.databaseMode, "reset");
    assert.equal(blockedPayload.databaseVolume, "unchanged");
    assert.equal(blockedPayload.failureStage, "validation");
    assert.match(blockedReset.stderr || blockedReset.stdout, /RESET PREVIEW DATABASE/);

    const invalidMode = runStopDryRun({ controlCheckoutPath, resolvedSha: controlHeadSha, databaseMode: "wipe" });
    assert.notEqual(invalidMode.status, 0);
    const invalidPayload = JSON.parse(invalidMode.stdout) as { result: string; databaseMode: string; databaseVolume: string; failureStage?: string };
    assert.equal(invalidPayload.result, "BLOCKED");
    assert.equal(invalidPayload.databaseMode, "unknown");
    assert.equal(invalidPayload.databaseVolume, "unchanged");
    assert.equal(invalidPayload.failureStage, "validation");
    assert.match(invalidMode.stderr || invalidMode.stdout, /database_mode must be one of: preserve, reset/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("stop preview classifies docker failure and success states", () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "stop-preview-run-");
  const controlCheckoutPath = path.join(tmpRoot, "control");

  try {
    const controlHeadSha = createCommitRepo(controlCheckoutPath, "control-checkout");

    const preservePass = runStopPreview({ controlCheckoutPath, resolvedSha: controlHeadSha, databaseMode: "preserve", dockerExitCode: 0 });
    assert.equal(preservePass.status, 0, preservePass.stderr);
    const preservePayload = JSON.parse(preservePass.stdout) as { status: string; databaseVolume: string; databaseMode: string };
    assert.equal(preservePayload.status, "PASS");
    assert.equal(preservePayload.databaseMode, "preserve");
    assert.equal(preservePayload.databaseVolume, "preserved");

    const resetPass = runStopPreview({ controlCheckoutPath, resolvedSha: controlHeadSha, databaseMode: "reset", resetConfirmation: "RESET PREVIEW DATABASE", dockerExitCode: 0 });
    assert.equal(resetPass.status, 0, resetPass.stderr);
    const resetPayload = JSON.parse(resetPass.stdout) as { status: string; databaseVolume: string; databaseMode: string };
    assert.equal(resetPayload.status, "PASS");
    assert.equal(resetPayload.databaseMode, "reset");
    assert.equal(resetPayload.databaseVolume, "reset");

    const preserveFail = runStopPreview({ controlCheckoutPath, resolvedSha: controlHeadSha, databaseMode: "preserve", dockerExitCode: 1 });
    assert.notEqual(preserveFail.status, 0);
    const preserveFailPayload = JSON.parse(preserveFail.stdout) as { result: string; failureStage?: string; databaseVolume: string };
    assert.equal(preserveFailPayload.result, "FAILED");
    assert.equal(preserveFailPayload.failureStage, "docker");
    assert.equal(preserveFailPayload.databaseVolume, "unknown");

    const resetFail = runStopPreview({ controlCheckoutPath, resolvedSha: controlHeadSha, databaseMode: "reset", resetConfirmation: "RESET PREVIEW DATABASE", dockerExitCode: 1 });
    assert.notEqual(resetFail.status, 0);
    const resetFailPayload = JSON.parse(resetFail.stdout) as { result: string; failureStage?: string; databaseVolume: string };
    assert.equal(resetFailPayload.result, "FAILED");
    assert.equal(resetFailPayload.failureStage, "docker");
    assert.equal(resetFailPayload.databaseVolume, "unknown");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("preview database lifecycle parsing accepts only preserve or reset", () => {
  assert.equal(parsePreviewDatabaseLifecycleMode("preserve"), "preserve");
  assert.equal(parsePreviewDatabaseLifecycleMode("reset"), "reset");
  assert.throws(() => parsePreviewDatabaseLifecycleMode("wipe"), /database_mode must be one of: preserve, reset/);
});

test("preview reset confirmation requires the exact phrase", () => {
  assert.doesNotThrow(() => validateResetConfirmation("preserve", ""));
  assert.doesNotThrow(() => validateResetConfirmation("reset", "RESET PREVIEW DATABASE"));
  assert.throws(() => validateResetConfirmation("reset", ""), /RESET PREVIEW DATABASE/);
  assert.throws(() => validateResetConfirmation("reset", "reset preview database"), /RESET PREVIEW DATABASE/);
});

test("preview compose config removes app build and keeps the immutable digest contract", { skip: !dockerAvailable }, () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "preview-compose-config-");
  const previewEnvFilePath = writePreviewEnv(tmpRoot, { CRM_DATABASE_URL: "" });

  try {
    process.env.CRM_PREVIEW_IMAGE_REF = previewImageRef;
    const result = runPreviewComposeConfig(previewEnvFilePath, true);
    assert.equal(result.status, 0, `preview docker compose config should pass: ${result.stderr}`);

    const config = JSON.parse(result.stdout) as {
      services: Record<string, {
        image?: string;
        build?: unknown;
        pull_policy?: string;
        ports?: Array<{ published?: string; target?: number }>;
      }>;
      networks: Record<string, unknown>;
      volumes: Record<string, unknown>;
    };
    assert.equal(config.services["crm-app"].image, process.env.CRM_PREVIEW_IMAGE_REF);
    assert.equal(Object.prototype.hasOwnProperty.call(config.services["crm-app"], "build"), false);
    assert.equal(config.services["crm-app"].pull_policy, "never");
    assert.equal(config.services["crm-app"].ports?.[0]?.published, "3001");
    assert.equal(config.services["crm-app"].ports?.[0]?.target, 3000);
    assert.equal(config.services["crm-postgres"].ports, undefined);
    assert.match(result.stdout, /clariobase-crm-preview-network/);
    assert.match(result.stdout, /clariobase-crm-preview-postgres-data/);
  } finally {
    delete process.env.CRM_PREVIEW_IMAGE_REF;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("secret-free stop preview config stays on preview-only resources", { skip: !dockerAvailable }, () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "preview-stop-config-");
  const stopEnvFilePath = writePreviewEnv(tmpRoot, {
    CRM_POSTGRES_PASSWORD: "unused-for-stop",
    CRM_DATABASE_URL: ""
  });

  try {
    const result = runPreviewComposeConfig(stopEnvFilePath);
    assert.equal(result.status, 0, `secret-free stop compose config should pass: ${result.stderr}`);
    assert.match(result.stdout, /clariobase-crm-preview-network/);
    assert.match(result.stdout, /clariobase-crm-preview-postgres-data/);
    assert.doesNotMatch(result.stdout, /Set_CRM_POSTGRES_PASSWORD/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("preview compose config keeps the app on port 3001 and does not publish PostgreSQL", { skip: !dockerAvailable }, () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "preview-compose-config-");
  const previewEnvFilePath = writePreviewEnv(tmpRoot, { CRM_DATABASE_URL: "" });

  try {
    const result = runPreviewComposeConfig(previewEnvFilePath);
    assert.equal(result.status, 0, `preview docker compose config should pass: ${result.stderr}`);
    assert.match(result.stdout, /published: "3001"/);
    assert.match(result.stdout, /host_ip: 0\.0\.0\.0/);
    const postgresSection = result.stdout.split("\n  crm-postgres:\n")[1]?.split("\nnetworks:\n")[0] ?? "";
    assert.ok(postgresSection.length > 0, "crm-postgres section should exist in preview compose config");
    assert.doesNotMatch(postgresSection, /\n\s+ports:/);
    assert.match(result.stdout, /clariobase-crm-preview-network/);
    assert.match(result.stdout, /clariobase-crm-preview-postgres-data/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
