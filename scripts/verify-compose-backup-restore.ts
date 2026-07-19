import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import {
  createCleanupController,
  createDockerRunId,
  createRuntimeArtifactName,
  createVerificationFailure,
  ensureDockerOrReportSkip,
  formatCleanupFailures,
  reportVerificationStatus,
  reserveFreePort
} from "./docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const project = createDockerRunId("backup-restore");
const tmpRoot = path.join(repoRoot, ".codex-tmp", createRuntimeArtifactName("compose-backup-restore"));
const aiPath = path.join(tmpRoot, "ai-exchange");
const envPath = path.join(tmpRoot, "compose.env");
const backupDir = path.join(tmpRoot, "backups");
const backupFilePath = path.join(backupDir, "clariobase_crm.sql");
const cleanup = createCleanupController("docker:test-backup-restore");
const databaseName = "clariobase_crm_backup_restore_test";
const databaseUser = "clariobase_crm_user";

fs.mkdirSync(path.dirname(tmpRoot), { recursive: true });

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function runDocker(args: string[], options?: { stdio?: "inherit" | "pipe"; env?: Record<string, string> }) {
  return spawnSync("docker", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options?.stdio ?? "pipe",
    env: { ...process.env, ...options?.env }
  });
}

function assertDockerSuccess(
  result: ReturnType<typeof runDocker>,
  description: string
) {
  assert.equal(result.status, 0, `${description} should pass: ${(result.stderr ?? result.stdout ?? "").trim()}`);
}

function runCompose(args: string[], options?: { stdio?: "inherit" | "pipe"; env?: Record<string, string> }) {
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

function queryScalar(query: string) {
  const result = runCompose([
    "exec", "-T", "crm-postgres", "psql", "-U", databaseUser, "-d", databaseName, "-At", "-c", query
  ]);
  assertDockerSuccess(result, "database scalar query");
  return result.stdout.trim();
}

async function requestAuth(hostPort: string, pathName: string, options?: {
  body?: Record<string, unknown>;
  cookie?: string;
}) {
  const response = await fetch(`http://127.0.0.1:${hostPort}${pathName}`, {
    method: options?.body ? "POST" : "GET",
    headers: {
      origin: `http://127.0.0.1:${hostPort}`,
      ...(options?.cookie ? { cookie: options.cookie } : {}),
      ...(options?.body ? { "content-type": "application/json" } : {})
    },
    body: options?.body ? JSON.stringify(options.body) : undefined
  });
  return {
    status: response.status,
    body: await response.text(),
    setCookie: response.headers.get("set-cookie")
  };
}

function readSessionCookie(setCookie: string | null) {
  assert(setCookie, "authentication response should set a session cookie");
  const match = setCookie.match(/(?:^|,\s*)(?:__Secure-)?better-auth\.session_token=[^;,]+/);
  assert(match, "authentication response should contain the Better Auth session token cookie");
  return match[0].replace(/^,\s*/, "");
}

function makePathWritable(targetPath: string) {
  try {
    fs.chmodSync(targetPath, 0o777);
  } catch {
    // Best-effort cleanup hardening for Docker-created export files.
  }
}

async function main() {
  if (!ensureDockerOrReportSkip("docker:test-backup-restore")) {
    return;
  }

  cleanup.installProcessHandlers();
  cleanup.registerDockerProject(project);
  cleanup.registerTempPath(tmpRoot);

  const preparedImportPath = path.join(aiPath, "inbox", "prepared-leads.json");
  const outboxDir = path.join(aiPath, "outbox");
  const hostPort = await reserveFreePort();
  const postgresPassword = crypto.randomBytes(32).toString("base64url");
  const authSecret = crypto.randomBytes(48).toString("base64url");
  const adminEmail = `backup-admin-${crypto.randomUUID()}@example.test`;
  const adminPassword = crypto.randomBytes(24).toString("base64url");
  const userEmail = `backup-user-${crypto.randomUUID()}@example.test`;
  const userPassword = crypto.randomBytes(24).toString("base64url");

  fs.mkdirSync(path.dirname(preparedImportPath), { recursive: true });
  fs.mkdirSync(outboxDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  fs.chmodSync(aiPath, 0o777);
  fs.chmodSync(path.dirname(preparedImportPath), 0o777);
  fs.chmodSync(outboxDir, 0o777);
  fs.chmodSync(backupDir, 0o777);
  fs.writeFileSync(preparedImportPath, read("data/ai-exchange/inbox/sample-prepared-leads.json"));
  fs.writeFileSync(
    envPath,
    [
      "CRM_BIND_ADDRESS=127.0.0.1",
      `CRM_HOST_PORT=${hostPort}`,
      `AI_EXCHANGE_HOST_PATH=${aiPath.replace(/\\/g, "/")}`,
      `CRM_POSTGRES_DB=${databaseName}`,
      `CRM_POSTGRES_USER=${databaseUser}`,
      `CRM_POSTGRES_PASSWORD=${postgresPassword}`,
      `CRM_DATABASE_URL=postgresql://${databaseUser}:${postgresPassword}@crm-postgres:5432/${databaseName}?schema=public`,
      `BETTER_AUTH_URL=http://127.0.0.1:${hostPort}`,
      `BETTER_AUTH_SECRET=${authSecret}`,
      "CRM_AUTH_RUNTIME_MODE=localhost-dev"
    ].join("\n")
  );

  let mainError: unknown;

  try {
    let result = runCompose(["build", "crm-app"], { stdio: "inherit" });
    assertDockerSuccess(result, "docker compose build crm-app");

    result = runCompose(["up", "-d", "crm-postgres"], { stdio: "inherit" });
    assertDockerSuccess(result, "docker compose up -d crm-postgres");
    await waitForDockerHealth(`${project}-crm-postgres-1`);

    result = runCompose(
      ["run", "--rm", "crm-app", "sh", "-lc", "node ./node_modules/prisma/build/index.js migrate deploy"],
      { stdio: "inherit" }
    );
    assertDockerSuccess(result, "compose migration command");

    result = runComposeNodeScript("import-leads.ts", "./data/ai-exchange/inbox/prepared-leads.json");
    assert.equal(result.status, 0, `compose lead import command should pass: ${(result.stderr ?? result.stdout ?? "").trim()}`);
    assert.match(result.stdout, /created: 2/);

    const initialSnapshot = queryLeadSnapshot();
    assert.deepEqual(initialSnapshot, [
      "Aurora Nail Studio",
      "Velvet Brows & Lashes"
    ]);

    result = runCompose(["up", "-d", "crm-app"]);
    assertDockerSuccess(result, "start application for authentication backup fixtures");
    await waitForDockerHealth(`${project}-crm-app-1`);

    result = runCompose([
      "run", "--rm",
      "-v", `${path.join(repoRoot, "scripts/fixtures/e011/t013-bootstrap-admin.ts").replace(/\\/g, "/")}:/proof/bootstrap.ts:ro`,
      "-e", "CLARIOBASE_BOOTSTRAP_ENABLED", "-e", "CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL", "-e", "CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD",
      "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/bootstrap.ts"
    ], {
      stdio: "pipe",
      env: {
        CLARIOBASE_BOOTSTRAP_ENABLED: "1",
        CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL: adminEmail,
        CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD: adminPassword
      }
    });
    assert.equal(result.status, 0, "controlled admin bootstrap should pass");

    const adminSignIn = await requestAuth(hostPort, "/api/auth/sign-in/email", {
      body: { email: adminEmail, password: adminPassword, rememberMe: true }
    });
    assert.equal(adminSignIn.status, 200);
    const adminCookie = readSessionCookie(adminSignIn.setCookie);

    result = runCompose([
      "run", "--rm",
      "-v", `${path.join(repoRoot, "scripts/fixtures/e011/t013-admin-gateway.ts").replace(/\\/g, "/")}:/proof/gateway.ts:ro`,
      "-e", "T013_GATEWAY_ACTION", "-e", "T013_ADMIN_COOKIE", "-e", "T013_USER_EMAIL", "-e", "T013_USER_PASSWORD",
      "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/gateway.ts"
    ], {
      stdio: "pipe",
      env: {
        T013_GATEWAY_ACTION: "create",
        T013_ADMIN_COOKIE: adminCookie,
        T013_USER_EMAIL: userEmail,
        T013_USER_PASSWORD: userPassword
      }
    });
    assert.equal(result.status, 0, "controlled user creation should pass");

    const activeSignIn = await requestAuth(hostPort, "/api/auth/sign-in/email", {
      body: { email: userEmail, password: userPassword, rememberMe: true }
    });
    assert.equal(activeSignIn.status, 200);
    const activeCookie = readSessionCookie(activeSignIn.setCookie);
    const revokedSignIn = await requestAuth(hostPort, "/api/auth/sign-in/email", {
      body: { email: userEmail, password: userPassword, rememberMe: true }
    });
    assert.equal(revokedSignIn.status, 200);
    const revokedCookie = readSessionCookie(revokedSignIn.setCookie);
    assert.notEqual(activeCookie, revokedCookie);

    const signOut = await requestAuth(hostPort, "/api/auth/sign-out", { body: {}, cookie: revokedCookie });
    assert.equal(signOut.status, 200);
    const revokedBeforeBackup = await requestAuth(hostPort, "/api/auth/get-session", { cookie: revokedCookie });
    assert.equal(JSON.parse(revokedBeforeBackup.body), null);

    const sourceCounts = {
      users: Number(queryScalar('SELECT count(*) FROM "user";')),
      accounts: Number(queryScalar('SELECT count(*) FROM "account";')),
      sessions: Number(queryScalar('SELECT count(*) FROM "session";')),
      verifications: Number(queryScalar('SELECT count(*) FROM "verification";')),
      audits: Number(queryScalar('SELECT count(*) FROM "admin_audit_events";')),
      linkedCredentials: Number(queryScalar('SELECT count(*) FROM "account" a JOIN "user" u ON u.id = a."userId" WHERE a."providerId" = \'credential\';'))
    };
    assert.equal(sourceCounts.users, 2);
    assert.equal(sourceCounts.accounts, 2);
    assert.equal(sourceCounts.sessions, 2);
    assert.equal(sourceCounts.verifications, 0);
    assert.ok(sourceCounts.audits >= 2);
    assert.equal(sourceCounts.linkedCredentials, 2);

    const postgresVersion = queryScalar("SHOW server_version;");

    runSql(
      "mkdir -p /tmp/backups && pg_dump -U \"$POSTGRES_USER\" \"$POSTGRES_DB\" > /tmp/backups/clariobase_crm.sql",
      "logical backup command"
    );

    result = runCompose(["cp", "crm-postgres:/tmp/backups/clariobase_crm.sql", backupFilePath], {
      stdio: "inherit"
    });
    assertDockerSuccess(result, "docker compose cp backup to host");
    assert.ok(fs.existsSync(backupFilePath), "backup file should be copied to the host");
    const backupChecksum = crypto.createHash("sha256").update(fs.readFileSync(backupFilePath)).digest("hex");
    assert.match(backupChecksum, /^[a-f0-9]{64}$/);
    const sourceContainerId = runCompose(["ps", "-q", "crm-postgres"]).stdout.trim();
    assert.match(sourceContainerId, /^[a-f0-9]{64}$/);

    result = runCompose(["down", "-v", "--remove-orphans"], { stdio: "inherit" });
    assertDockerSuccess(result, "destroy disposable source database");
    result = runCompose(["up", "-d", "crm-postgres"], { stdio: "inherit" });
    assertDockerSuccess(result, "start fresh disposable restore target");
    await waitForDockerHealth(`${project}-crm-postgres-1`);
    const restoreContainerId = runCompose(["ps", "-q", "crm-postgres"]).stdout.trim();
    assert.match(restoreContainerId, /^[a-f0-9]{64}$/);
    assert.notEqual(restoreContainerId, sourceContainerId);

    result = runCompose(["cp", backupFilePath, "crm-postgres:/tmp/clariobase_crm.sql"], {
      stdio: "inherit"
    });
    assertDockerSuccess(result, "docker compose cp backup back to container");

    runSql(
      "psql -U \"$POSTGRES_USER\" \"$POSTGRES_DB\" < /tmp/clariobase_crm.sql",
      "logical restore command"
    );
    assert.deepEqual(queryLeadSnapshot(), initialSnapshot);

    const restoredCounts = {
      users: Number(queryScalar('SELECT count(*) FROM "user";')),
      accounts: Number(queryScalar('SELECT count(*) FROM "account";')),
      sessions: Number(queryScalar('SELECT count(*) FROM "session";')),
      verifications: Number(queryScalar('SELECT count(*) FROM "verification";')),
      audits: Number(queryScalar('SELECT count(*) FROM "admin_audit_events";')),
      linkedCredentials: Number(queryScalar('SELECT count(*) FROM "account" a JOIN "user" u ON u.id = a."userId" WHERE a."providerId" = \'credential\';'))
    };
    assert.deepEqual(restoredCounts, sourceCounts);

    result = runCompose(["up", "-d", "crm-app"]);
    assertDockerSuccess(result, "start restored application");
    await waitForDockerHealth(`${project}-crm-app-1`);
    const restoredActive = await requestAuth(hostPort, "/api/auth/get-session", { cookie: activeCookie });
    assert.ok(JSON.parse(restoredActive.body)?.user?.id);
    const restoredRevoked = await requestAuth(hostPort, "/api/auth/get-session", { cookie: revokedCookie });
    assert.equal(JSON.parse(restoredRevoked.body), null);

    result = runComposeNodeScript("export-ai-leads.ts");
    assert.equal(result.status, 0, `compose export after restore should pass: ${(result.stderr ?? result.stdout ?? "").trim()}`);
    for (const fileName of fs.readdirSync(backupDir)) {
      makePathWritable(path.join(backupDir, fileName));
    }
    makePathWritable(backupDir);
    assert.match(result.stdout, /row count: 2/);
    console.log(JSON.stringify({
      backupFormat: "PostgreSQL plain SQL logical dump",
      postgresVersion,
      backupSha256: backupChecksum,
      restoreTarget: "fresh disposable PostgreSQL container and volume",
      activeSessionRestored: true,
      revokedSessionRemainedRevoked: true,
      credentialAccountsLinked: true,
      auditEventsRestored: true,
      verificationRecords: "not applicable; zero preserved",
      sensitiveValuesLogged: false
    }, null, 2));
  } catch (error) {
    mainError = error;
  }

  const cleanupReport = cleanup.cleanup(mainError ? "failed verification" : "successful verification");

  if (mainError) {
    throw createVerificationFailure(mainError, cleanupReport.failures, "docker:test-backup-restore");
  }

  if (cleanupReport.failures.length > 0) {
    throw new Error(formatCleanupFailures(cleanupReport.failures));
  }

  reportVerificationStatus("PASS", `docker:test-backup-restore completed for project ${project}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
