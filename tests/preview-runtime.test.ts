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
  getRepoRoot,
  loadPreviewEnv,
  parseEnvFileContent
} from "../scripts/preview-runtime-support";
import { createRepoTmpDir } from "./test-helpers";

const repoRoot = getRepoRoot();

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function hasDocker() {
  const result = spawnSync("docker", ["version"], {
    cwd: repoRoot,
    stdio: "ignore"
  });

  return result.status === 0;
}

const dockerAvailable = hasDocker();

test("preview runtime assets pin the approved preview identity", () => {
  const composePreviewFile = read("compose.preview.yaml");
  const composePreviewEnvExample = read(PREVIEW_ENV_EXAMPLE_FILE);
  const previewRunbook = read("docs/operations/preview-operations.md");
  const packageJson = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };
  const deployWrapper = read("scripts/deploy-preview.ps1");
  const stopWrapper = read("scripts/stop-preview.ps1");

  assert.ok(packageJson.scripts.test.includes("tests/preview-runtime.test.ts"));
  assert.match(composePreviewFile, /clariobase-crm-preview-network/);
  assert.match(composePreviewFile, /clariobase-crm-preview-postgres-data/);
  assert.match(composePreviewFile, /io\.clariobase\.runtime-scope: preview/);
  assert.match(composePreviewEnvExample, /^CRM_BIND_ADDRESS=0\.0\.0\.0$/m);
  assert.match(composePreviewEnvExample, /^CRM_HOST_PORT=3001$/m);
  assert.match(composePreviewEnvExample, /^AI_EXCHANGE_HOST_PATH=\.\/data\/ai-exchange-preview$/m);
  assert.match(composePreviewEnvExample, /^CRM_POSTGRES_DB=clariobase_crm_preview$/m);
  assert.match(composePreviewEnvExample, /^CRM_POSTGRES_USER=clariobase_crm_preview_user$/m);
  assert.match(composePreviewEnvExample, /^CRM_POSTGRES_PASSWORD=$/m);
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
  const previewEnvFilePath = path.join(tmpRoot, PREVIEW_ENV_FILE_NAME);

  fs.writeFileSync(
    previewEnvFilePath,
    [
      "CRM_BIND_ADDRESS=0.0.0.0",
      `CRM_HOST_PORT=${PREVIEW_HOST_PORT}`,
      `AI_EXCHANGE_HOST_PATH=${PREVIEW_AI_EXCHANGE_PATH}`,
      `CRM_POSTGRES_DB=${PREVIEW_DB_NAME}`,
      `CRM_POSTGRES_USER=${PREVIEW_DB_USER}`,
      "CRM_POSTGRES_PASSWORD=preview-password",
      `CRM_DATABASE_URL=postgresql://${PREVIEW_DB_USER}:preview-password@crm-postgres:5432/${PREVIEW_DB_NAME}?schema=public`
    ].join("\n"),
    "utf8"
  );

  try {
    const config = loadPreviewEnv(previewEnvFilePath);

    assert.equal(config.env.CRM_BIND_ADDRESS, "0.0.0.0");
    assert.equal(config.env.CRM_HOST_PORT, PREVIEW_HOST_PORT);
    assert.equal(config.previewUrl, PREVIEW_URL);
    assert.equal(config.env.AI_EXCHANGE_HOST_PATH, PREVIEW_AI_EXCHANGE_PATH);
    assert.equal(config.env.CRM_DATABASE_URL, `postgresql://${PREVIEW_DB_USER}:preview-password@crm-postgres:5432/${PREVIEW_DB_NAME}?schema=public`);
    assert.equal(config.previewAiExchangeAbsolutePath.replace(/\\/g, "/").endsWith("/data/ai-exchange-preview"), true);
    assert.match(config.previewLocalReadyUrl, /127\.0\.0\.1:3001\/api\/ready/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("preview runtime support rejects production collisions", () => {
  const previewEnv = parseEnvFileContent(
    [
      "CRM_BIND_ADDRESS=0.0.0.0",
      "CRM_HOST_PORT=3000",
      "AI_EXCHANGE_HOST_PATH=./data/ai-exchange",
      "CRM_POSTGRES_DB=clariobase_crm",
      "CRM_POSTGRES_USER=clariobase_crm_user",
      "CRM_POSTGRES_PASSWORD=preview-password"
    ].join("\n")
  );

  assert.equal(previewEnv.get("CRM_HOST_PORT"), "3000");

  const tmpRoot = createRepoTmpDir(repoRoot, "preview-runtime-unsafe-");
  const previewEnvFilePath = path.join(tmpRoot, PREVIEW_ENV_FILE_NAME);

  fs.writeFileSync(
    previewEnvFilePath,
    [
      "CRM_BIND_ADDRESS=0.0.0.0",
      "CRM_HOST_PORT=3000",
      "AI_EXCHANGE_HOST_PATH=./data/ai-exchange",
      "CRM_POSTGRES_DB=clariobase_crm",
      `CRM_POSTGRES_USER=${PREVIEW_DB_USER}`,
      "CRM_POSTGRES_PASSWORD=preview-password"
    ].join("\n"),
    "utf8"
  );

  try {
    assert.throws(() => loadPreviewEnv(previewEnvFilePath), /Preview host port must stay pinned to 3001|protected production path|preview database/i);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("preview deploy and stop plans stay scoped to the approved preview stack", () => {
  const deployPlan = buildDeployPlan(path.join(repoRoot, PREVIEW_ENV_FILE_NAME));
  const stopPlan = buildStopPlan(path.join(repoRoot, PREVIEW_ENV_FILE_NAME));
  const summary = createPreviewSummary("epic/e016-manual-preview", "0123456789abcdef0123456789abcdef01234567");

  assert.deepEqual(deployPlan.buildApp.slice(0, 8), [
    "compose",
    "--project-name",
    PREVIEW_PROJECT_NAME,
    "--env-file",
    path.join(repoRoot, PREVIEW_ENV_FILE_NAME),
    "-f",
    "compose.yaml",
    "-f"
  ]);
  assert.match(deployPlan.startDatabase.join(" "), /up -d crm-postgres/);
  assert.match(deployPlan.migrate.join(" "), /migrate deploy/);
  assert.match(deployPlan.startApplication.join(" "), /up -d crm-app/);
  assert.match(stopPlan.down.join(" "), /down -v --remove-orphans/);
  assert.equal(summary.previewUrl, PREVIEW_URL);
  assert.equal(summary.projectName, PREVIEW_PROJECT_NAME);
  assert.equal(summary.volumeName, PREVIEW_VOLUME_NAME);
  assert.equal(summary.networkName, PREVIEW_NETWORK_NAME);
});

test("preview compose config keeps the app on port 3001 and does not publish PostgreSQL", { skip: !dockerAvailable }, () => {
  const tmpRoot = createRepoTmpDir(repoRoot, "preview-compose-config-");
  const previewEnvFilePath = path.join(tmpRoot, PREVIEW_ENV_FILE_NAME);

  fs.writeFileSync(
    previewEnvFilePath,
    [
      "CRM_BIND_ADDRESS=0.0.0.0",
      "CRM_HOST_PORT=3001",
      "AI_EXCHANGE_HOST_PATH=./data/ai-exchange-preview",
      "CRM_POSTGRES_DB=clariobase_crm_preview",
      "CRM_POSTGRES_USER=clariobase_crm_preview_user",
      "CRM_POSTGRES_PASSWORD=preview-password"
    ].join("\n"),
    "utf8"
  );

  try {
    const result = spawnSync(
      "docker",
      [
        ...buildDeployPlan(previewEnvFilePath).buildApp.slice(0, 8),
        "compose.preview.yaml",
        "config"
      ],
      {
        cwd: repoRoot,
        encoding: "utf8"
      }
    );

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
