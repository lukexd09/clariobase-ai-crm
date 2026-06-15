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
const project = createDockerRunId("clariobase-e014-backup-restore");
const tmpRoot = path.join(repoRoot, ".codex-tmp", `compose-backup-restore-${process.pid}`);
const aiPath = path.join(tmpRoot, "ai-exchange");
const envPath = path.join(tmpRoot, "compose.env");
const backupDir = path.join(tmpRoot, "backups");
const backupFilePath = path.join(backupDir, "clariobase_crm.sql");

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

async function waitForDockerHealth(containerName: string) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const result = runDocker(["inspect", "--format={{.State.Health.Status}}", containerName]);

    if (result.status === 0 && result.stdout.trim() === "healthy") {
      return;
    }

    await delay(1000);
  }

  throw new Error(`Container ${containerName} did not become healthy in time.`);
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

function queryLeadSnapshot() {
  const result = runCompose(
    [
      "exec",
      "-T",
      "crm-postgres",
      "sh",
      "-lc",
      "psql -U \"$POSTGRES_USER\" \"$POSTGRES_DB\" -At -c 'SELECT business_name FROM leads ORDER BY business_name;'"
    ],
    { stdio: "pipe" }
  );

  assert.equal(result.status, 0, "lead snapshot query should pass");

  return result.stdout
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
}

function runSql(command: string, description: string) {
  const result = runCompose(["exec", "-T", "crm-postgres", "sh", "-lc", command], {
    stdio: "pipe"
  });

  assert.equal(result.status, 0, `${description} should pass`);
}

async function main() {
  if (!ensureDockerOrReportSkip("docker:test-backup-restore")) {
    return;
  }

  const preparedImportPath = path.join(aiPath, "inbox", "prepared-leads.json");
  const hostPort = await reserveFreePort();

  fs.mkdirSync(path.dirname(preparedImportPath), { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(preparedImportPath, read("data/ai-exchange/inbox/sample-prepared-leads.json"));
  fs.writeFileSync(
    envPath,
    [
      "CRM_BIND_ADDRESS=127.0.0.1",
      `CRM_HOST_PORT=${hostPort}`,
      `AI_EXCHANGE_HOST_PATH=${aiPath.replace(/\\/g, "/")}`,
      "CRM_POSTGRES_DB=clariobase_crm_backup_restore_test",
      "CRM_POSTGRES_USER=clariobase_crm_user",
      "CRM_POSTGRES_PASSWORD=clariobase_test_password"
    ].join("\n")
  );

  try {
    let result = runCompose(["build", "crm-app"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose build crm-app should pass");

    result = runCompose(["up", "-d", "crm-postgres"], { stdio: "inherit" });
    assert.equal(result.status, 0, "docker compose up -d crm-postgres should pass");
    await waitForDockerHealth(`${project}-crm-postgres-1`);

    result = runCompose(
      ["run", "--rm", "crm-app", "sh", "-lc", "node ./node_modules/prisma/build/index.js migrate deploy"],
      { stdio: "inherit" }
    );
    assert.equal(result.status, 0, "compose migration command should pass");

    result = runComposeNodeScript("import-leads.ts", "./data/ai-exchange/inbox/prepared-leads.json");
    assert.equal(result.status, 0, "compose lead import command should pass");
    assert.match(result.stdout, /created: 2/);

    const initialSnapshot = queryLeadSnapshot();
    assert.deepEqual(initialSnapshot, [
      "Aurora Nail Studio",
      "Velvet Brows & Lashes"
    ]);

    runSql(
      "mkdir -p /tmp/backups && pg_dump -U \"$POSTGRES_USER\" \"$POSTGRES_DB\" > /tmp/backups/clariobase_crm.sql",
      "logical backup command"
    );

    result = runCompose(["cp", "crm-postgres:/tmp/backups/clariobase_crm.sql", backupFilePath], {
      stdio: "inherit"
    });
    assert.equal(result.status, 0, "docker compose cp backup to host should pass");
    assert.ok(fs.existsSync(backupFilePath), "backup file should be copied to the host");

    runSql(
      "psql -U \"$POSTGRES_USER\" \"$POSTGRES_DB\" -c 'TRUNCATE TABLE leads CASCADE;'",
      "lead truncation command"
    );
    assert.deepEqual(queryLeadSnapshot(), []);

    result = runCompose(["cp", backupFilePath, "crm-postgres:/tmp/clariobase_crm.sql"], {
      stdio: "inherit"
    });
    assert.equal(result.status, 0, "docker compose cp backup back to container should pass");

    runSql(
      "db_name=\"$POSTGRES_DB\"; db_user=\"$POSTGRES_USER\"; dropdb -U \"$db_user\" --force --if-exists \"$db_name\" && createdb -U \"$db_user\" \"$db_name\" && psql -U \"$db_user\" \"$db_name\" < /tmp/clariobase_crm.sql",
      "logical restore command"
    );
    assert.deepEqual(queryLeadSnapshot(), initialSnapshot);

    result = runComposeNodeScript("export-ai-leads.ts");
    assert.equal(result.status, 0, "compose export after restore should pass");
    assert.match(result.stdout, /row count: 2/);

    reportVerificationStatus("PASS", `docker:test-backup-restore completed for project ${project}.`);
  } finally {
    runCompose(["down", "-v"], { stdio: "inherit" });
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
