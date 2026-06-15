import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import {
  createDockerRunId,
  ensureDockerOrReportSkip,
  reportVerificationStatus,
  reserveFreePort
} from "./docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const project = createDockerRunId("clariobase-e014-runtime");
const tmpRoot = path.join(repoRoot, ".codex-tmp", `compose-runtime-verify-${process.pid}`);
const aiPath = path.join(tmpRoot, "ai-exchange");
const envPath = path.join(tmpRoot, "compose.env");
let hostPort = "";
let baseUrl = "";

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function runDocker(args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return spawnSync("docker", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options?.stdio ?? "pipe"
  });
}

function runCompose(args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return runDocker(["compose", "--project-name", project, "--env-file", envPath, ...args], options);
}

async function waitForDockerHealth(containerName: string, expectedStatus: "healthy" | "unhealthy" = "healthy") {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const result = runDocker(["inspect", "--format={{.State.Health.Status}}", containerName]);

    if (result.status === 0 && result.stdout.trim() === expectedStatus) {
      return;
    }

    await delay(1000);
  }

  throw new Error(`Container ${containerName} did not become ${expectedStatus} in time.`);
}

async function waitForHttpStatus(url: string, expectedStatus: number) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-store"
        }
      });

      if (response.status === expectedStatus) {
        return response;
      }
    } catch {
      // Retry until the service becomes available.
    }

    await delay(1000);
  }

  throw new Error(`${url} did not return HTTP ${expectedStatus} in time.`);
}

function assertNoSensitiveData(payload: unknown) {
  const serialized = JSON.stringify(payload);

  assert.doesNotMatch(serialized, /DATABASE_URL/i);
  assert.doesNotMatch(serialized, /password/i);
  assert.doesNotMatch(serialized, /postgres(?:ql)?:\/\//i);
}

async function assertReadyStatus(expectedHttpStatus: 200 | 503, expectedDatabaseStatus: "ok" | "unavailable") {
  const response = await waitForHttpStatus(`${baseUrl}/api/ready`, expectedHttpStatus);
  const payload = await response.json() as {
    service: string;
    status: string;
    timestamp: string;
    checks: { database: string };
  };

  assert.equal(payload.service, "clariobase-ai-crm");
  assert.equal(payload.checks.database, expectedDatabaseStatus);
  assert.equal(payload.status, expectedHttpStatus === 200 ? "ready" : "not_ready");
  assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assertNoSensitiveData(payload);
}

function runComposeNodeScript(scriptName: string, ...scriptArgs: string[]) {
  return runCompose(
    [
      "run",
      "--rm",
      "crm-app",
      "node",
      "--env-file-if-exists=.env.local",
      "./node_modules/tsx/dist/cli.mjs",
      `scripts/${scriptName}`,
      ...scriptArgs
    ],
    { stdio: "pipe" }
  );
}

async function main() {
  if (!ensureDockerOrReportSkip("docker:test-runtime")) {
    return;
  }

  const preparedImportPath = path.join(aiPath, "inbox", "prepared-leads.json");
  const outboxDir = path.join(aiPath, "outbox");

  hostPort = await reserveFreePort();
  baseUrl = `http://127.0.0.1:${hostPort}`;

  fs.mkdirSync(path.dirname(preparedImportPath), { recursive: true });
  fs.mkdirSync(outboxDir, { recursive: true });
  fs.writeFileSync(preparedImportPath, read("data/ai-exchange/inbox/sample-prepared-leads.json"));
  fs.writeFileSync(
    envPath,
    [
      "CRM_BIND_ADDRESS=127.0.0.1",
      `CRM_HOST_PORT=${hostPort}`,
      `AI_EXCHANGE_HOST_PATH=${aiPath.replace(/\\/g, "/")}`,
      "CRM_POSTGRES_DB=clariobase_crm_compose_test",
      "CRM_POSTGRES_USER=clariobase_crm_user",
      "CRM_POSTGRES_PASSWORD=clariobase_test_password"
    ].join("\n")
  );

  try {
    let result = runCompose(["build"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose build should pass");

    result = runCompose(["up", "-d", "crm-postgres"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose up -d crm-postgres should pass");
    await waitForDockerHealth(`${project}-crm-postgres-1`);

    result = runCompose(["up", "-d", "crm-app"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose up -d crm-app before migrations should pass");

    await waitForHttpStatus(`${baseUrl}/health`, 200);
    await assertReadyStatus(503, "unavailable");
    await waitForDockerHealth(`${project}-crm-app-1`, "unhealthy");

    result = runCompose(["stop", "crm-app"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose stop crm-app before migrations should pass");

    result = runCompose(
      ["run", "--rm", "crm-app", "sh", "-lc", "node ./node_modules/prisma/build/index.js migrate deploy"],
      { stdio: "inherit" }
    );
    assert.equal(result.status, 0, "compose migration command should pass");

    result = runCompose(["up", "-d", "crm-app"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose up -d crm-app should pass");

    await waitForDockerHealth(`${project}-crm-app-1`);
    await waitForHttpStatus(`${baseUrl}/health`, 200);
    await assertReadyStatus(200, "ok");
    await waitForHttpStatus(`${baseUrl}/imports`, 200);

    result = runComposeNodeScript("export-ai-leads.ts");
    assert.equal(result.status, 0, "compose AI export command should pass");
    assert.match(result.stdout, /row count: 0/);
    assert.ok(
      fs.readdirSync(outboxDir).some((fileName) => /^clariobase_leads_export_.*\.json$/.test(fileName)),
      "compose AI export should create a host-visible outbox file"
    );

    result = runComposeNodeScript("validate-ai-import-file.ts", "./data/ai-exchange/inbox/prepared-leads.json");
    assert.equal(result.status, 0, "compose AI validation command should pass");

    result = runComposeNodeScript("import-leads.ts", "./data/ai-exchange/inbox/prepared-leads.json");
    assert.equal(result.status, 0, "compose lead import command should pass");
    assert.match(result.stdout, /created: 2/);

    result = runComposeNodeScript("detect-duplicates.ts");
    assert.equal(result.status, 0, "compose duplicate detection command should pass");

    result = runComposeNodeScript("export-ai-leads.ts");
    assert.equal(result.status, 0, "compose post-import export command should pass");
    assert.match(result.stdout, /row count: 2/);
    assert.ok(
      fs.readdirSync(outboxDir).some((fileName) => /^clariobase_leads_export_.*\.json$/.test(fileName)),
      "compose post-import export should keep producing host-visible outbox files"
    );

    result = runCompose(["stop", "crm-postgres"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose stop crm-postgres should pass");

    await assertReadyStatus(503, "unavailable");
    await waitForDockerHealth(`${project}-crm-app-1`, "unhealthy");

    result = runCompose(["start", "crm-postgres"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose start crm-postgres should pass");

    await waitForDockerHealth(`${project}-crm-postgres-1`);
    await assertReadyStatus(200, "ok");
    await waitForDockerHealth(`${project}-crm-app-1`);

    result = runCompose(["restart", "crm-app"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose restart crm-app should pass");

    await waitForDockerHealth(`${project}-crm-app-1`);
    await waitForHttpStatus(`${baseUrl}/health`, 200);
    await assertReadyStatus(200, "ok");

    result = runComposeNodeScript("export-ai-leads.ts");
    assert.equal(result.status, 0, "compose export after restart should pass");
    assert.match(result.stdout, /row count: 2/);
    reportVerificationStatus("PASS", `docker:test-runtime completed for project ${project}.`);
  } finally {
    runCompose(["down", "-v"], { stdio: "inherit" });
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
