import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(__dirname, "..");

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

test("Backup and restore verification script exercises disposable logical recovery", () => {
  const packageJson = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };
  const verifierScript = read("scripts/verify-compose-backup-restore.ts");
  const operationsRunbook = read("docs/operations/container-operations.md");
  const runtimeContract = read("docs/runtime/container-runtime.md");

  assert.equal(packageJson.scripts["docker:test-backup-restore"], "tsx scripts/verify-compose-backup-restore.ts");
  assert.match(verifierScript, /ensureDockerOrReportSkip\("docker:test-backup-restore"\)/);
  assert.match(verifierScript, /createCleanupController\("docker:test-backup-restore"\)/);
  assert.match(verifierScript, /cleanup\.registerDockerProject\(project\)/);
  assert.match(verifierScript, /cleanup\.registerTempPath\(tmpRoot\)/);
  assert.match(verifierScript, /const project = createDockerRunId\("backup-restore"\)/);
  assert.match(verifierScript, /pg_dump -U .*POSTGRES_USER.*POSTGRES_DB/);
  assert.match(verifierScript, /dropdb -U .*db_user.*--force --if-exists .*db_name/);
  assert.match(verifierScript, /TRUNCATE TABLE leads CASCADE;/);
  assert.match(verifierScript, /SELECT business_name FROM leads ORDER BY business_name/);
  assert.match(verifierScript, /reportVerificationStatus\("PASS", `docker:test-backup-restore completed/);

  assert.match(operationsRunbook, /corepack pnpm docker:test-backup-restore/);
  assert.match(operationsRunbook, /corepack pnpm cleanup:test-runtime/);
  assert.match(operationsRunbook, /clariobase-crm/);
  assert.match(operationsRunbook, /exec -T crm-postgres sh -lc 'mkdir -p \/tmp\/backups/);
  assert.match(operationsRunbook, /dropdb -U "\$db_user" --force --if-exists "\$db_name"/);
  assert.match(runtimeContract, /corepack pnpm docker:test-backup-restore/);
});

test("Backup and restore verification passes on disposable Docker resources when Docker is available", { skip: !dockerAvailable }, () => {
  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const result = spawnSync(process.execPath, [tsxCli, "scripts/verify-compose-backup-restore.ts"], {
    cwd: repoRoot,
    stdio: "inherit"
  });

  assert.equal(result.status, 0, "backup and restore verification should pass");
});
