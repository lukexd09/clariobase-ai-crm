import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
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
  reserveFreePort,
  VERIFY_IMAGE_TAG_PREFIX
} from "./docker-test-support";

type HttpsResult = {
  status: number;
  body: string;
  setCookies: string[];
};

const repoRoot = path.resolve(__dirname, "..");
const project = createDockerRunId("t013-private-https");
const tmpRoot = path.join(repoRoot, ".codex-tmp", createRuntimeArtifactName("t013-private-https"));
const envPath = path.join(tmpRoot, "private-https.env");
const caPath = path.join(tmpRoot, "root.crt");
const imageTag = `${VERIFY_IMAGE_TAG_PREFIX}${project}`;
const cleanup = createCleanupController("e011:t013:proof");
let offlineBundleRoot: string | undefined;
const argv = process.argv.slice(2);
const runtimeOnly = argv.includes("--runtime-only");
const hostname = `crm-${crypto.randomBytes(6).toString("hex")}.home.arpa`;
const postgresPassword = crypto.randomBytes(32).toString("base64url");
const authSecret = crypto.randomBytes(48).toString("base64url");
const adminEmail = `admin-${crypto.randomUUID()}@example.test`;
const adminPassword = crypto.randomBytes(24).toString("base64url");
const userEmail = `user-${crypto.randomUUID()}@example.test`;
const userPassword = crypto.randomBytes(24).toString("base64url");

function run(command: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
    shell: false,
    maxBuffer: 1024 * 1024 * 32
  });
}

function runDocker(args: string[], env: Record<string, string> = {}) {
  return run("docker", args, env);
}

function assertSuccess(result: ReturnType<typeof run>, description: string) {
  if (result.status !== 0) {
    throw new Error(`${description} failed with exit code ${result.status ?? "unknown"}`);
  }
}

function runCompose(args: string[], env: Record<string, string> = {}) {
  return runDocker([
    "compose",
    "--project-name",
    project,
    "--env-file",
    envPath,
    "-f",
    "compose.yaml",
    "-f",
    "compose.private-https.yaml",
    ...args
  ], env);
}

async function waitForHealth(containerName: string) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const result = runDocker(["inspect", "--format", "{{.State.Health.Status}}", containerName]);
    if (result.status === 0 && result.stdout.trim() === "healthy") return;
    await delay(1000);
  }
  throw new Error(`${containerName} did not become healthy`);
}

function httpsRequest(options: {
  port: number;
  path: string;
  method?: string;
  body?: string;
  origin?: string;
  cookie?: string;
  ca?: Buffer;
  servername?: string;
  agent?: https.Agent;
}) {
  return new Promise<HttpsResult>((resolve, reject) => {
    const body = options.body ?? "";
    const request = https.request({
      hostname: "127.0.0.1",
      port: options.port,
      path: options.path,
      method: options.method ?? "GET",
      servername: options.servername ?? hostname,
      ca: options.ca,
      rejectUnauthorized: true,
      agent: options.agent,
      headers: {
        host: `${hostname}:${options.port}`,
        ...(options.origin ? { origin: options.origin } : {}),
        ...(options.cookie ? { cookie: options.cookie } : {}),
        ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(body) } : {})
      }
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => resolve({
        status: response.statusCode ?? 0,
        body: Buffer.concat(chunks).toString("utf8"),
        setCookies: response.headers["set-cookie"] ?? []
      }));
    });
    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}

function sessionCookie(response: HttpsResult) {
  const cookie = response.setCookies.find((entry) => entry.startsWith("__Secure-better-auth.session_token="));
  assert(cookie, "secure Better Auth session cookie should be present");
  assert.match(cookie, /;\s*Secure/i);
  assert.match(cookie, /;\s*HttpOnly/i);
  assert.match(cookie, /;\s*SameSite=Lax/i);
  assert.match(cookie, /;\s*Path=\//i);
  assert.doesNotMatch(cookie, /;\s*Domain=/i);
  return cookie.split(";", 1)[0];
}

function assertHttpStatus(response: HttpsResult, expected: number, phase: string) {
  if (response.status !== expected) {
    const responseClass = response.body.length === 0 ? "empty-response" : "auth-response";
    throw new Error(`${phase} returned HTTP ${response.status} (${responseClass})`);
  }
}

async function signIn(port: number, ca: Buffer, email: string, password: string, agent: https.Agent, origin: string) {
  return httpsRequest({
    port,
    path: "/api/auth/sign-in/email",
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe: true }),
    origin,
    ca,
    agent
  });
}

async function getSession(port: number, ca: Buffer, cookie: string, agent: https.Agent) {
  const response = await httpsRequest({ port, path: "/api/auth/get-session", cookie, ca, agent });
  assertHttpStatus(response, 200, "get session");
  return JSON.parse(response.body) as { user?: { id?: string } } | null;
}

function inspectNoPublishedPorts(containerName: string) {
  const result = runDocker(["inspect", "--format", "{{json .HostConfig.PortBindings}}", containerName]);
  assertSuccess(result, `inspect ${containerName} port bindings`);
  assert.match(result.stdout.trim(), /^(?:null|\{\})$/);
}

async function waitForHttps(port: number, ca: Buffer) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await httpsRequest({ port, path: "/api/ready", ca });
      if (response.status === 200) return response;
      lastError = new Error(`HTTPS readiness returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw lastError instanceof Error ? lastError : new Error("HTTPS ingress did not become ready");
}

async function main() {
  if (!ensureDockerOrReportSkip("e011:t013:proof")) return;

  const securityScan = run("node", ["./node_modules/tsx/dist/cli.mjs", "scripts/e011-t013-security-scan.ts"]);
  assertSuccess(securityScan, "run T013 security and managed-infrastructure scan");

  cleanup.installProcessHandlers();
  cleanup.registerDockerProject(project);
  cleanup.registerDockerImage(imageTag);
  cleanup.registerTempPath(tmpRoot);
  fs.mkdirSync(tmpRoot, { recursive: true });

  const sourceShaResult = run("git", ["rev-parse", "HEAD"]);
  assertSuccess(sourceShaResult, "resolve source SHA");
  const sourceSha = sourceShaResult.stdout.trim();
  assert.match(sourceSha, /^[0-9a-f]{40}$/);

  const build = runDocker([
    "build",
    "--build-arg",
    `CRM_SOURCE_SHA=${sourceSha}`,
    "--label",
    `io.clariobase.source-sha=${sourceSha}`,
    "-t",
    imageTag,
    "."
  ]);
  assertSuccess(build, "build exact T013 application image");

  const imageInspect = runDocker(["image", "inspect", imageTag, "--format", "{{.Id}} {{index .Config.Labels \"io.clariobase.source-sha\"}}"]).stdout.trim();
  const [imageId, imageSourceSha] = imageInspect.split(/\s+/);
  assert.match(imageId, /^sha256:[0-9a-f]{64}$/);
  assert.equal(imageSourceSha, sourceSha);

  const httpsPort = Number(await reserveFreePort());
  const origin = `https://${hostname}:${httpsPort}`;
  fs.writeFileSync(envPath, [
    "CRM_PRIVATE_BIND_ADDRESS=127.0.0.1",
    `CRM_PRIVATE_HTTPS_PORT=${httpsPort}`,
    `CRM_PRIVATE_HOSTNAME=${hostname}`,
    `CRM_AUTH_TRUSTED_ORIGINS=${origin}`,
    "CRM_AUTH_RUNTIME_MODE=private-https",
    `BETTER_AUTH_URL=${origin}`,
    `BETTER_AUTH_SECRET=${authSecret}`,
    `CRM_PRIVATE_APP_IMAGE=${imageId}`,
    "CRM_PRIVATE_INGRESS_IMAGE=caddy@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d",
    "CRM_POSTGRES_IMAGE=postgres:16@sha256:fe03a7605299a34ddf5e4f285dff78c3d7190a576b3c6b46f2fcff69f4bffd54",
    `AI_EXCHANGE_HOST_PATH=${path.join(tmpRoot, "ai-exchange").replace(/\\/g, "/")}`,
    "CRM_POSTGRES_DB=clariobase_t013",
    "CRM_POSTGRES_USER=clariobase_t013_user",
    `CRM_POSTGRES_PASSWORD=${postgresPassword}`,
    `CRM_DATABASE_URL=postgresql://clariobase_t013_user:${postgresPassword}@crm-postgres:5432/clariobase_t013?schema=public`,
    "CRM_DEPLOYMENT_ENV=production"
  ].join("\n"), { encoding: "utf8", mode: 0o600 });
  fs.mkdirSync(path.join(tmpRoot, "ai-exchange"), { recursive: true });

  const preflight = run("node", [
    "./node_modules/tsx/dist/cli.mjs",
    "scripts/private-https-preflight.ts",
    "--env-file",
    envPath,
    "--expected-source-sha",
    sourceSha
  ], {
    CRM_PRIVATE_APP_IMAGE: imageId,
    CRM_PRIVATE_INGRESS_IMAGE: "caddy@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d",
    CRM_POSTGRES_IMAGE: "postgres:16@sha256:fe03a7605299a34ddf5e4f285dff78c3d7190a576b3c6b46f2fcff69f4bffd54",
  });
  assertSuccess(preflight, "run private HTTPS preflight against exact runtime image");

  let result = runCompose(["config", "--quiet"]);
  assertSuccess(result, "validate private HTTPS Compose model");
  result = runCompose(["up", "-d", "crm-postgres"]);
  assertSuccess(result, "start disposable PostgreSQL");
  await waitForHealth(`${project}-crm-postgres-1`);

  result = runCompose(["run", "--rm", "crm-app", "node", "./node_modules/prisma/build/index.js", "migrate", "deploy"]);
  assertSuccess(result, "deploy migrations to disposable PostgreSQL");

  result = runCompose(["up", "-d", "--no-build", "--pull", "never", "crm-app", "crm-private-ingress"]);
  assertSuccess(result, "start exact app image and HTTPS ingress");
  await waitForHealth(`${project}-crm-app-1`);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    result = runCompose(["cp", "crm-private-ingress:/data/caddy/pki/authorities/local/root.crt", caPath]);
    if (result.status === 0 && fs.existsSync(caPath)) break;
    await delay(500);
  }
  assert.ok(fs.existsSync(caPath), "Caddy internal root CA should be exportable");
  const ca = fs.readFileSync(caPath);

  const ready = await waitForHttps(httpsPort, ca);
  assert.equal(ready.status, 200);
  assert.match(ready.body, /"status":"ready"/);

  inspectNoPublishedPorts(`${project}-crm-app-1`);
  inspectNoPublishedPorts(`${project}-crm-postgres-1`);
  const ingressPorts = runDocker(["inspect", "--format", "{{json .HostConfig.PortBindings}}", `${project}-crm-private-ingress-1`]);
  assertSuccess(ingressPorts, "inspect ingress port binding");
  assert.match(ingressPorts.stdout, new RegExp(`127\\.0\\.0\\.1.*${httpsPort}`));

  const bootstrapEnv = {
    CLARIOBASE_BOOTSTRAP_ENABLED: "1",
    CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL: adminEmail,
    CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD: adminPassword
  };
  result = runCompose([
    "run", "--rm",
    "-v", `${path.join(repoRoot, "scripts/fixtures/e011/t013-bootstrap-admin.ts").replace(/\\/g, "/")}:/proof/bootstrap.ts:ro`,
    "-e", "CLARIOBASE_BOOTSTRAP_ENABLED",
    "-e", "CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL",
    "-e", "CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD",
    "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/bootstrap.ts"
  ], bootstrapEnv);
  assertSuccess(result, "bootstrap disposable administrator through controlled path");

  const clientOne = new https.Agent({ keepAlive: false });
  const clientTwo = new https.Agent({ keepAlive: false });
  const adminSignIn = await signIn(httpsPort, ca, adminEmail, adminPassword, clientOne, origin);
  assertHttpStatus(adminSignIn, 200, "administrator sign-in");
  const adminCookie = sessionCookie(adminSignIn);

  const createEnv = {
    T013_GATEWAY_ACTION: "create",
    T013_ADMIN_COOKIE: adminCookie,
    T013_USER_EMAIL: userEmail,
    T013_USER_PASSWORD: userPassword
  };
  result = runCompose([
    "run", "--rm",
    "-v", `${path.join(repoRoot, "scripts/fixtures/e011/t013-admin-gateway.ts").replace(/\\/g, "/")}:/proof/gateway.ts:ro`,
    "-e", "T013_GATEWAY_ACTION", "-e", "T013_ADMIN_COOKIE", "-e", "T013_USER_EMAIL", "-e", "T013_USER_PASSWORD",
    "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/gateway.ts"
  ], createEnv);
  assertSuccess(result, "create disposable user through admin gateway");

  const firstSignIn = await signIn(httpsPort, ca, userEmail, userPassword, clientOne, origin);
  assertHttpStatus(firstSignIn, 200, "first client sign-in");
  const firstCookie = sessionCookie(firstSignIn);
  assert.ok((await getSession(httpsPort, ca, firstCookie, clientOne))?.user?.id);

  const secondSignIn = await signIn(httpsPort, ca, userEmail, userPassword, clientTwo, origin);
  assertHttpStatus(secondSignIn, 200, "second client sign-in");
  const secondCookie = sessionCookie(secondSignIn);
  assert.notEqual(secondCookie, firstCookie);
  assert.ok((await getSession(httpsPort, ca, secondCookie, clientTwo))?.user?.id);

  await assert.rejects(
    () => httpsRequest({ port: httpsPort, path: "/api/ready" }),
    /certificate|self-signed|unable to verify|issuer/i
  );
  await assert.rejects(
    () => httpsRequest({ port: httpsPort, path: "/api/ready", ca, servername: "wrong-name.home.arpa" }),
    /hostname|altname|certificate|EPROTO|tlsv1 alert internal error/i
  );

  const foreignOrigin = await signIn(httpsPort, ca, userEmail, userPassword, new https.Agent(), "https://foreign.example.test");
  assert.equal(foreignOrigin.status, 403);
  assert.equal(foreignOrigin.setCookies.length, 0);

  const signup = await httpsRequest({
    port: httpsPort,
    path: "/api/auth/sign-up/email",
    method: "POST",
    body: JSON.stringify({ email: `blocked-${crypto.randomUUID()}@example.test`, name: "Blocked", password: userPassword }),
    origin,
    ca
  });
  assert.equal(signup.status, 404);
  assert.equal(signup.setCookies.length, 0);

  result = runCompose(["exec", "-T", "crm-app", "node", "-e", "fetch('http://127.0.0.1:3000/api/auth/get-session').then(async r=>{if(r.status!==400||r.headers.has('set-cookie'))process.exit(1)}).catch(()=>process.exit(1))"]);
  assertSuccess(result, "reject direct HTTP authentication path");
  result = runCompose(["exec", "-T", "crm-app", "node", "-e", "fetch('http://127.0.0.1:3000/api/auth/get-session',{headers:{host:'wrong.home.arpa','x-forwarded-host':'wrong.home.arpa','x-forwarded-proto':'http,https'}}).then(r=>process.exit(r.status===400?0:1)).catch(()=>process.exit(1))"]);
  assertSuccess(result, "reject incorrect proxy headers");

  result = runCompose(["restart", "crm-app"]);
  assertSuccess(result, "restart application");
  await waitForHealth(`${project}-crm-app-1`);
  assert.ok((await getSession(httpsPort, ca, firstCookie, clientOne))?.user?.id);

  result = runCompose(["restart", "crm-private-ingress"]);
  assertSuccess(result, "restart HTTPS ingress");
  await delay(1500);
  assert.ok((await getSession(httpsPort, ca, firstCookie, clientOne))?.user?.id);

  result = runCompose(["restart", "crm-postgres"]);
  assertSuccess(result, "restart PostgreSQL cleanly");
  await waitForHealth(`${project}-crm-postgres-1`);
  await waitForHealth(`${project}-crm-app-1`);
  assert.ok((await getSession(httpsPort, ca, firstCookie, clientOne))?.user?.id);

  const immutableRollback = run(
    "node",
    [
      "./node_modules/tsx/dist/cli.mjs",
      "scripts/e011-immutable-image.ts",
      "--t013",
      project,
      envPath,
      imageId,
      sourceSha
    ],
    { T013_USER_COOKIE: firstCookie }
  );
  assertSuccess(immutableRollback, "prove exact-image upgrade and rollback");
  const immutableEvidence = JSON.parse(immutableRollback.stdout.trim()) as {
    originalImageId: string;
    upgradeImageId: string;
    rollbackImageId: string;
  };
  assert.equal(immutableEvidence.originalImageId, imageId);
  assert.equal(immutableEvidence.rollbackImageId, imageId);
  assert.notEqual(immutableEvidence.upgradeImageId, imageId);
  assert.ok((await getSession(httpsPort, ca, firstCookie, clientOne))?.user?.id);

  const revokeEnv = {
    T013_GATEWAY_ACTION: "revoke",
    T013_ADMIN_COOKIE: adminCookie,
    T013_USER_COOKIE: firstCookie
  };
  result = runCompose([
    "run", "--rm",
    "-v", `${path.join(repoRoot, "scripts/fixtures/e011/t013-admin-gateway.ts").replace(/\\/g, "/")}:/proof/gateway.ts:ro`,
    "-e", "T013_GATEWAY_ACTION", "-e", "T013_ADMIN_COOKIE", "-e", "T013_USER_COOKIE",
    "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/gateway.ts"
  ], revokeEnv);
  assertSuccess(result, "revoke disposable user sessions through admin gateway");
  assert.equal(await getSession(httpsPort, ca, firstCookie, clientOne), null);
  assert.equal(await getSession(httpsPort, ca, secondCookie, clientTwo), null);

  result = runCompose(["restart", "crm-app", "crm-private-ingress"]);
  assertSuccess(result, "restart app and ingress after revocation");
  await waitForHealth(`${project}-crm-app-1`);
  await delay(1000);
  assert.equal(await getSession(httpsPort, ca, firstCookie, clientOne), null);

  const runningIdentity = runDocker(["inspect", "--format", "{{.Image}}", `${project}-crm-app-1`]);
  assertSuccess(runningIdentity, "inspect running application identity");
  assert.equal(runningIdentity.stdout.trim(), imageId);

  const egress = runCompose(["exec", "-T", "crm-app", "node", "-e", "fetch('https://better-auth.com',{signal:AbortSignal.timeout(3000)}).then(()=>process.exit(1)).catch(()=>process.exit(0))"]);
  assertSuccess(egress, "observe blocked external runtime connectivity");

  const runtimeEvidence = {
    result: "PASS",
    sourceSha,
    applicationImageId: imageId,
    upgradeImageId: imageId,
    rollbackImageId: imageId,
    ingressImage: "caddy@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d",
    privateHostname: "generated .home.arpa proof hostname",
    httpsPort,
    tls: { trustedClients: 2, untrustedCaRejected: true, wrongHostnameRejected: true },
    bindings: { ingress: "127.0.0.1 only", application: "none", postgres: "none" },
    sessions: { appRestart: true, ingressRestart: true, databaseRestart: true, revocationPersisted: true },
    publicSignup: false,
    managedBetterAuthInfrastructure: false,
    securityScan: "PASS",
    externalConnectivity: "blocked by internal Docker networks"
  } as const;

  if (runtimeOnly) {
    console.log(JSON.stringify({
      ...runtimeEvidence,
      upgradeImageId: immutableEvidence.upgradeImageId,
      rollbackImageId: immutableEvidence.rollbackImageId,
      offlineRecovery: { result: "SKIPPED", reason: "runtime-only mode" }
    }, null, 2));
    const cleanupReport = cleanup.cleanup("successful runtime-only verification");
    if (cleanupReport.failures.length > 0) throw new Error(formatCleanupFailures(cleanupReport.failures));
    reportVerificationStatus("PASS", "e011:t013 runtime-only private HTTPS runtime verification completed.");
    return;
  }

  const offlineBundle = run("node", [
    "./node_modules/tsx/dist/cli.mjs",
    "scripts/e011-offline-bundle.ts",
    "--t013",
    imageId,
    sourceSha
  ]);
  assertSuccess(offlineBundle, "prepare complete exact-head offline recovery bundle");
  const bundleEvidence = JSON.parse(offlineBundle.stdout.trim()) as {
    bundleRoot: string;
    manifestSha256: string;
    sourceSha: string;
    applicationImageId: string;
  };
  offlineBundleRoot = path.resolve(bundleEvidence.bundleRoot);
  assert.ok(offlineBundleRoot.startsWith(`${path.join(repoRoot, ".codex-tmp")}${path.sep}`));
  assert.equal(bundleEvidence.sourceSha, sourceSha);
  assert.equal(bundleEvidence.applicationImageId, imageId);
  assert.match(bundleEvidence.manifestSha256, /^[a-f0-9]{64}$/);

  const cleanupReport = cleanup.cleanup("successful online verification");
  if (cleanupReport.failures.length > 0) throw new Error(formatCleanupFailures(cleanupReport.failures));
  result = runDocker(["image", "rm", "-f", imageId]);
  assertSuccess(result, "remove online application image before offline restore");

  const offlineRestore = run("node", [
    "./node_modules/tsx/dist/cli.mjs",
    "scripts/e011-offline-restore.ts",
    "--t013",
    offlineBundleRoot
  ], { T013_DISPOSABLE_BUNDLE: "1" });
  if (offlineRestore.status !== 0) {
    const safeError = offlineRestore.stderr
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.startsWith("Error:"));
    throw new Error(`restore source, dependencies, images, database, and HTTPS runtime offline failed${safeError ? `: ${safeError}` : ""}`);
  }
  const offlineEvidence = JSON.parse(offlineRestore.stdout.trim()) as {
    result: string;
    manifestSha256: string;
    sourceSha: string;
    applicationImageId: string;
    dependencyRestoreNetwork: string;
    offlineHttpsSignIn: string;
  };
  assert.equal(offlineEvidence.result, "PASS");
  assert.equal(offlineEvidence.manifestSha256, bundleEvidence.manifestSha256);
  assert.equal(offlineEvidence.sourceSha, sourceSha);
  assert.equal(offlineEvidence.applicationImageId, imageId);
  assert.equal(offlineEvidence.dependencyRestoreNetwork, "none");
  assert.equal(offlineEvidence.offlineHttpsSignIn, "PASS");
  offlineBundleRoot = undefined;

  console.log(JSON.stringify({
    ...runtimeEvidence,
    upgradeImageId: immutableEvidence.upgradeImageId,
    rollbackImageId: immutableEvidence.rollbackImageId,
    offlineRecovery: {
      manifestSha256: bundleEvidence.manifestSha256,
      exactHeadSource: sourceSha,
      exactApplicationImage: imageId,
      dependencyInstallNetwork: "none",
      prismaGenerate: "PASS",
      httpsSignIn: "PASS"
    }
  }, null, 2));

  reportVerificationStatus("PASS", "e011:t013:proof completed disposable private HTTPS runtime verification.");
}

main().catch((error) => {
  const cleanupReport = cleanup.cleanup("failed verification");
  if (offlineBundleRoot && offlineBundleRoot.startsWith(`${path.join(repoRoot, ".codex-tmp")}${path.sep}`)) {
    fs.rmSync(offlineBundleRoot, { recursive: true, force: true });
  }
  console.error(createVerificationFailure(error, cleanupReport.failures, "e011:t013:proof").message);
  process.exitCode = 1;
});
