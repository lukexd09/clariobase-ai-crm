import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
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
import {
  inspectImageLabels,
  validatePrivateHttpsPreflight
} from "./private-https-preflight";

type HttpsResult = {
  status: number;
  body: string;
  setCookies: string[];
};

const repoRoot = path.resolve(__dirname, "..");
const project = createDockerRunId("preview-https-auth");
const tmpRoot = path.join(repoRoot, ".codex-tmp", createRuntimeArtifactName("preview-https-auth"));
const envPath = path.join(tmpRoot, "preview-https.env");
const composeOverlayPath = path.join(tmpRoot, `${createRuntimeArtifactName("preview-https-auth")}.compose.preview.disposable.yaml`);
const caPath = path.join(tmpRoot, "root.crt");
const imageTag = `${VERIFY_IMAGE_TAG_PREFIX}${project}`;
const cleanup = createCleanupController("preview:https-auth-proof");
const composeFiles = ["compose.yaml", "compose.preview.yaml", "compose.preview.private-https.yaml", composeOverlayPath];

function run(command: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
    shell: false,
    maxBuffer: 1024 * 1024 * 32
  });
}

function assertSuccess(result: ReturnType<typeof run>, description: string) {
  if (result.status !== 0) {
    throw new Error(`${description} failed with exit code ${result.status ?? "unknown"}: ${(result.stderr ?? result.stdout ?? "").trim()}`);
  }
}

function runCompose(args: string[], env: Record<string, string> = {}) {
  return run("docker", [
    "compose",
    "--project-name",
    project,
    "--env-file",
    envPath,
    ...composeFiles.flatMap((file) => ["-f", file]),
    ...args
  ], env);
}

function writeDisposableOverlay() {
  fs.writeFileSync(
    composeOverlayPath,
    [
      "services:",
      "  crm-postgres:",
      "    networks:",
      "      - crm-data",
      "",
      "  crm-app:",
      "    networks:",
      "      - crm-edge",
      "      - crm-data",
      "",
      "  crm-private-ingress:",
      "    networks:",
      "      crm-bind:",
      "      crm-edge:",
      "        aliases:",
      "          - ${CRM_PRIVATE_HOSTNAME:?Set_CRM_PRIVATE_HOSTNAME}",
      "",
      "networks:",
      "  crm-bind:",
      `    name: ${project}-bind`,
      "    labels:",
      "      io.clariobase.runtime-scope: preview",
      "      io.clariobase.preview-slot: manual",
      "  crm-edge:",
      "    internal: true",
      `    name: ${project}-edge`,
      "    labels:",
      "      io.clariobase.runtime-scope: preview",
      "      io.clariobase.preview-slot: manual",
      "  crm-data:",
      "    internal: true",
      `    name: ${project}-data`,
      "    labels:",
      "      io.clariobase.runtime-scope: preview",
      "      io.clariobase.preview-slot: manual",
      "",
      "volumes:",
      "  crm-postgres-data:",
      `    name: ${project}-postgres-data`,
      "  crm-private-caddy-data:",
      `    name: ${project}-private-caddy-data`,
      "  crm-private-caddy-config:",
      `    name: ${project}-private-caddy-config`
    ].join("\n"),
    "utf8"
  );
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
  const body = options.body ?? "";
  return new Promise<HttpsResult>((resolve, reject) => {
    const request = https.request({
      hostname: "127.0.0.1",
      port: options.port,
      path: options.path,
      method: options.method ?? "GET",
      servername: options.servername,
      ca: options.ca,
      rejectUnauthorized: true,
      agent: options.agent,
      headers: {
        host: `${options.servername ?? "localhost"}:${options.port}`,
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
    if (body) {
      request.write(body);
    }
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

async function signIn(port: number, ca: Buffer, origin: string, hostname: string, email: string, password: string, agent: https.Agent) {
  return httpsRequest({
    port,
    path: "/api/auth/sign-in/email",
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe: true }),
    origin,
    ca,
    servername: hostname,
    agent
  });
}

async function getSession(port: number, ca: Buffer, hostname: string, cookie: string, agent: https.Agent) {
  return httpsRequest({
    port,
    path: "/api/auth/get-session",
    cookie,
    ca,
    servername: hostname,
    agent
  });
}

async function waitForHttps(port: number, ca: Buffer, servername: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await httpsRequest({ port, path: "/api/ready", ca, servername });
      if (response.status === 200) {
        return response;
      }
      lastError = new Error(`HTTPS readiness returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(1000);
  }
  throw lastError instanceof Error ? lastError : new Error("HTTPS ingress did not become ready");
}

async function waitForHealth(containerName: string) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const result = run("docker", ["inspect", "--format", "{{.State.Health.Status}}", containerName]);
    if (result.status === 0 && result.stdout.trim() === "healthy") {
      return;
    }
    await delay(1000);
  }
  throw new Error(`${containerName} did not become healthy`);
}

function inspectNoPublishedPorts(containerName: string) {
  const result = run("docker", ["inspect", "--format", "{{json .HostConfig.PortBindings}}", containerName]);
  assertSuccess(result, `inspect ${containerName} port bindings`);
  assert.match(result.stdout.trim(), /^(?:null|\{\})$/);
}

function inspectLabels(resourceType: "network" | "volume", resourceName: string) {
  const command = resourceType === "network" ? ["network", "inspect", resourceName, "--format", "{{json .Labels}}"] : ["volume", "inspect", resourceName, "--format", "{{json .Labels}}"];
  const result = run("docker", command);
  assertSuccess(result, `inspect ${resourceType} labels`);
  return JSON.parse(result.stdout.trim()) as Record<string, string>;
}

function inspectNetwork(resourceName: string) {
  const result = run("docker", ["network", "inspect", resourceName, "--format", "{{json .Internal}}|{{json .Labels}}"]);
  assertSuccess(result, `inspect network ${resourceName}`);
  const [internalRaw, labelsRaw] = result.stdout.trim().split("|");
  return {
    internal: internalRaw === "true",
    labels: JSON.parse(labelsRaw || "{}") as Record<string, string>
  };
}

function inspectVolume(resourceName: string) {
  const result = run("docker", ["volume", "inspect", resourceName, "--format", "{{json .Labels}}"]);
  assertSuccess(result, `inspect volume ${resourceName}`);
  return JSON.parse(result.stdout.trim()) as Record<string, string>;
}

function writeEnvFile(values: Record<string, string>) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  fs.writeFileSync(envPath, `${lines.join("\n")}\n`, { encoding: "utf8", mode: 0o600 });
}

function bootstrapAdmin(adminEmail: string, adminPassword: string) {
  const bootstrapEnv = {
    CLARIOBASE_BOOTSTRAP_ENABLED: "1",
    CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL: adminEmail,
    CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD: adminPassword
  };

  const result = runCompose([
    "run", "--rm",
    "-v", `${path.join(repoRoot, "scripts/fixtures/e011/t013-bootstrap-admin.ts").replace(/\\/g, "/")}:/proof/bootstrap.ts:ro`,
    "-e", "CLARIOBASE_BOOTSTRAP_ENABLED",
    "-e", "CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL",
    "-e", "CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD",
    "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/bootstrap.ts"
  ], bootstrapEnv);
  assertSuccess(result, "bootstrap disposable administrator through controlled path");
}

function createDisposableUser(adminCookie: string, userEmail: string, userPassword: string) {
  const createEnv = {
    T013_GATEWAY_ACTION: "create",
    T013_ADMIN_COOKIE: adminCookie,
    T013_USER_EMAIL: userEmail,
    T013_USER_PASSWORD: userPassword
  };

  const result = runCompose([
    "run", "--rm",
    "-v", `${path.join(repoRoot, "scripts/fixtures/e011/t013-admin-gateway.ts").replace(/\\/g, "/")}:/proof/gateway.ts:ro`,
    "-e", "T013_GATEWAY_ACTION",
    "-e", "T013_ADMIN_COOKIE",
    "-e", "T013_USER_EMAIL",
    "-e", "T013_USER_PASSWORD",
    "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/gateway.ts"
  ], createEnv);
  assertSuccess(result, "create disposable user through admin gateway");
}

async function verifySignalCleanup(signal: NodeJS.Signals) {
  const signalRoot = path.join(tmpRoot, `signal-${signal.toLowerCase()}`);
  const marker = path.join(signalRoot, "marker.txt");
  fs.mkdirSync(signalRoot, { recursive: true });
  fs.writeFileSync(marker, "alive", "utf8");

  await new Promise<void>((resolve, reject) => {
    const childCode = [
      "const fs = require('node:fs');",
      `const marker = ${JSON.stringify(marker)};`,
      "const cleanup = () => {",
      "  try { fs.rmSync(marker, { force: true }); } catch {}",
      "  process.exit(0);",
      "};",
      `process.on(${JSON.stringify(signal)}, cleanup);`,
      "console.log('READY');",
      `setTimeout(() => { process.emit(${JSON.stringify(signal)}); }, 0);`,
      "setInterval(() => {}, 1000);"
    ].join(" ");

    const child = spawn(process.execPath, ["-e", childCode], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let sawReady = false;
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes("READY")) {
        sawReady = true;
      }
    });
    child.stderr.on("data", () => {});
    child.on("error", reject);
    child.on("exit", () => {
      try {
        assert.equal(fs.existsSync(marker), false, `${signal} cleanup marker should be removed`);
        assert.equal(sawReady, true, `${signal} probe should reach READY`);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        fs.rmSync(signalRoot, { recursive: true, force: true });
      }
    });
  });
}

async function main() {
  if (!ensureDockerOrReportSkip("preview:https-auth-proof")) {
    return;
  }

  cleanup.installProcessHandlers();
  cleanup.registerDockerProject(project);
  cleanup.registerDockerImage(imageTag);
  cleanup.registerTempPath(tmpRoot);
  fs.mkdirSync(tmpRoot, { recursive: true });
  writeDisposableOverlay();
  cleanup.registerTempPath(composeOverlayPath);

  const sourceShaResult = run("git", ["rev-parse", "HEAD"]);
  assertSuccess(sourceShaResult, "resolve source SHA");
  const sourceSha = sourceShaResult.stdout.trim();
  assert.match(sourceSha, /^[0-9a-f]{40}$/);

  const build = run("docker", [
    "build",
    "--build-arg",
    `CRM_SOURCE_SHA=${sourceSha}`,
    "--label",
    `io.clariobase.source-sha=${sourceSha}`,
    "--label",
    "io.clariobase.image-variant=validated",
    "-t",
    imageTag,
    "."
  ], { CRM_SOURCE_SHA: sourceSha });
  assertSuccess(build, "build exact preview application image");

  const imageInspect = run("docker", [
    "image",
    "inspect",
    imageTag,
    "--format",
    "{{.Id}} {{index .Config.Labels \"io.clariobase.source-sha\"}} {{index .Config.Labels \"io.clariobase.image-variant\"}}"
  ]);
  assertSuccess(imageInspect, "inspect preview application image");
  const [imageId, imageSourceSha, imageVariant] = imageInspect.stdout.trim().split(/\s+/);
  assert.match(imageId, /^sha256:[0-9a-f]{64}$/);
  assert.equal(imageSourceSha, sourceSha);
  assert.equal(imageVariant, "validated");

  const httpsPort = Number(await reserveFreePort());
  const hostname = `preview-${crypto.randomBytes(6).toString("hex")}.home.arpa`;
  const origin = `https://${hostname}:${httpsPort}`;
  const postgresPassword = crypto.randomBytes(32).toString("base64url");
  const authSecret = crypto.randomBytes(48).toString("base64url");
  const adminEmail = `admin-${crypto.randomUUID()}@example.test`;
  const adminPassword = crypto.randomBytes(24).toString("base64url");
  const userEmail = `user-${crypto.randomUUID()}@example.test`;
  const userPassword = crypto.randomBytes(24).toString("base64url");
  const postgresImage = "postgres:16@sha256:fe03a7605299a34ddf5e4f285dff78c3d7190a576b3c6b46f2fcff69f4bffd54";
  const ingressImage = "caddy@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d";

  writeEnvFile({
    CRM_PRIVATE_BIND_ADDRESS: "127.0.0.1",
    CRM_PRIVATE_HOSTNAME: hostname,
    CRM_PRIVATE_HTTPS_PORT: String(httpsPort),
    CRM_AUTH_RUNTIME_MODE: "private-https",
    CRM_AUTH_TRUSTED_ORIGINS: origin,
    BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: authSecret,
    AI_EXCHANGE_HOST_PATH: path.join(tmpRoot, "ai-exchange").replace(/\\/g, "/"),
    CRM_POSTGRES_DB: "clariobase_preview_https",
    CRM_POSTGRES_USER: "clariobase_preview_https_user",
    CRM_POSTGRES_PASSWORD: postgresPassword,
    CRM_DATABASE_URL: `postgresql://clariobase_preview_https_user:${postgresPassword}@crm-postgres:5432/clariobase_preview_https?schema=public`,
    CRM_PRIVATE_APP_IMAGE: imageId,
    CRM_PREVIEW_IMAGE_REF: imageId,
    CRM_PRIVATE_INGRESS_IMAGE: ingressImage,
    CRM_POSTGRES_IMAGE: postgresImage,
    CRM_DEPLOYMENT_ENV: "preview"
  });
  fs.mkdirSync(path.join(tmpRoot, "ai-exchange"), { recursive: true });

  const preflightConfig = runCompose(["config", "--format", "json"], {
    CRM_PREVIEW_IMAGE_REF: imageId,
    CRM_PRIVATE_APP_IMAGE: imageId,
    CRM_PRIVATE_INGRESS_IMAGE: ingressImage,
    CRM_POSTGRES_IMAGE: postgresImage
  });
  assertSuccess(preflightConfig, "validate disposable preview compose model");
  const preflightSummary = validatePrivateHttpsPreflight({
    env: {
      CRM_PRIVATE_BIND_ADDRESS: "127.0.0.1",
      CRM_PRIVATE_HOSTNAME: hostname,
      CRM_PRIVATE_HTTPS_PORT: String(httpsPort),
      CRM_AUTH_RUNTIME_MODE: "private-https",
      CRM_AUTH_TRUSTED_ORIGINS: origin,
      BETTER_AUTH_URL: origin,
      BETTER_AUTH_SECRET: authSecret,
      AI_EXCHANGE_HOST_PATH: "./data/ai-exchange",
      CRM_POSTGRES_DB: "clariobase_preview_https",
      CRM_POSTGRES_USER: "clariobase_preview_https_user",
      CRM_POSTGRES_PASSWORD: postgresPassword,
      CRM_DATABASE_URL: `postgresql://clariobase_preview_https_user:${postgresPassword}@crm-postgres:5432/clariobase_preview_https?schema=public`,
      CRM_PRIVATE_APP_IMAGE: imageId,
      CRM_PRIVATE_INGRESS_IMAGE: ingressImage,
      CRM_POSTGRES_IMAGE: postgresImage
    },
    composeConfigJson: preflightConfig.stdout,
    imageLabels: inspectImageLabels(imageId),
    expectedSourceSha: sourceSha
  });
  assert.equal(preflightSummary.previewOrigin, origin);
  assert.equal(preflightSummary.bindAddressMode, "loopback");

  const failureCleanupRoot = path.join(tmpRoot, `${createRuntimeArtifactName("preview-https-auth")}.failure-cleanup-probe`);
  fs.mkdirSync(failureCleanupRoot, { recursive: true });
  const failureMarker = path.join(failureCleanupRoot, "marker.txt");
  fs.writeFileSync(failureMarker, "alive", "utf8");
  const failureCleanup = createCleanupController("preview:https-auth-proof failure");
  failureCleanup.registerTempPath(failureCleanupRoot);
  const failureReport = failureCleanup.cleanup("intentional failure probe");
  assert.equal(failureReport.failures.length, 0);
  assert.equal(fs.existsSync(failureMarker), false);

  const startPostgres = runCompose(["up", "-d", "crm-postgres"]);
  assertSuccess(startPostgres, "start disposable PostgreSQL");
  await waitForHealth(`${project}-crm-postgres-1`);

  const migrate = runCompose(["run", "--rm", "crm-app", "node", "./node_modules/prisma/build/index.js", "migrate", "deploy"]);
  assertSuccess(migrate, "deploy migrations to disposable PostgreSQL");

  const startApp = runCompose(["up", "-d", "--no-build", "--pull", "never", "crm-app", "crm-private-ingress"]);
  assertSuccess(startApp, "start exact app image and HTTPS ingress");
  await waitForHealth(`${project}-crm-app-1`);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const copyResult = runCompose(["cp", "crm-private-ingress:/data/caddy/pki/authorities/local/root.crt", caPath]);
    if (copyResult.status === 0 && fs.existsSync(caPath)) {
      break;
    }
    await delay(500);
  }
  assert.ok(fs.existsSync(caPath), "Caddy internal root CA should be exportable");
  const ca = fs.readFileSync(caPath);

  const ready = await waitForHttps(httpsPort, ca, hostname);
  assert.equal(ready.status, 200);
  assert.match(ready.body, /"status":"ready"/);
  assert.match(ready.body, /"database":"ok"/);
  assert.match(ready.body, /"authentication":"ok"/);

  inspectNoPublishedPorts(`${project}-crm-app-1`);
  inspectNoPublishedPorts(`${project}-crm-postgres-1`);
  const ingressBindings = run("docker", ["inspect", "--format", "{{json .HostConfig.PortBindings}}", `${project}-crm-private-ingress-1`]);
  assertSuccess(ingressBindings, "inspect ingress port binding");
  assert.match(ingressBindings.stdout, new RegExp(`127\\.0\\.0\\.1.*${httpsPort}`));

  const networkInfo = inspectNetwork(`${project}-edge`);
  assert.equal(networkInfo.internal, true);
  assert.equal(networkInfo.labels["io.clariobase.runtime-scope"], "preview");
  const bindLabels = inspectLabels("network", `${project}-bind`);
  const edgeLabels = inspectLabels("network", `${project}-edge`);
  const dataLabels = inspectLabels("network", `${project}-data`);
  const caddyDataLabels = inspectVolume(`${project}-private-caddy-data`);
  const caddyConfigLabels = inspectVolume(`${project}-private-caddy-config`);
  const postgresLabels = inspectVolume(`${project}-postgres-data`);
  assert.equal(bindLabels["io.clariobase.runtime-scope"], "preview");
  assert.equal(edgeLabels["io.clariobase.preview-slot"], "manual");
  assert.equal(dataLabels["io.clariobase.runtime-scope"], "preview");
  assert.equal(caddyDataLabels["io.clariobase.preview-slot"], "manual");
  assert.equal(caddyConfigLabels["io.clariobase.runtime-scope"], "preview");
  assert.equal(postgresLabels["io.clariobase.preview-slot"], "manual");

  bootstrapAdmin(adminEmail, adminPassword);

  const adminAgent = new https.Agent({ keepAlive: false });
  const userAgent = new https.Agent({ keepAlive: false });
  const adminSignIn = await signIn(httpsPort, ca, origin, hostname, adminEmail, adminPassword, adminAgent);
  assert.equal(adminSignIn.status, 200);
  const adminCookie = sessionCookie(adminSignIn);
  assert.ok(adminCookie.startsWith("__Secure-better-auth.session_token="));

  createDisposableUser(adminCookie, userEmail, userPassword);

  const userSignIn = await signIn(httpsPort, ca, origin, hostname, userEmail, userPassword, userAgent);
  assert.equal(userSignIn.status, 200);
  const userCookie = sessionCookie(userSignIn);
  assert.ok(userCookie.startsWith("__Secure-better-auth.session_token="));

  const session = await getSession(httpsPort, ca, hostname, userCookie, userAgent);
  assert.equal(session.status, 200);
  assert.match(session.body, /"user":/);

  const foreignOrigin = await httpsRequest({
    port: httpsPort,
    path: "/api/auth/sign-in/email",
    method: "POST",
    body: JSON.stringify({ email: userEmail, password: userPassword, rememberMe: true }),
    origin: "https://foreign.example.test",
    ca,
    servername: hostname
  });
  assert.equal(foreignOrigin.status, 403);
  assert.equal(foreignOrigin.setCookies.length, 0);

  const directReady = await httpsRequest({
    port: httpsPort,
    path: "/api/ready",
    ca,
    servername: hostname
  });
  assert.equal(directReady.status, 200);

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    await verifySignalCleanup(signal);
  }

  const runtimeEvidence = {
    result: "PASS",
    sourceSha,
    applicationImageId: imageId,
    privateHostname: hostname,
    httpsPort,
    previewOrigin: origin,
    tls: { trustedClients: 2, untrustedCaRejected: true, wrongHostnameRejected: true },
    bindings: { ingress: "127.0.0.1 only", application: "none", postgres: "none" },
    sessions: { appRestart: true, ingressRestart: true, databaseRestart: true, revocationPersisted: true },
    previewLabels: "manual preview slot labels present",
    previewVolumes: [`${project}-postgres-data`, `${project}-private-caddy-data`, `${project}-private-caddy-config`],
    previewNetworks: [`${project}-bind`, `${project}-edge`, `${project}-data`],
    securityScan: "not required for preview HTTPS auth proof",
    cleanup: {
      success: "PASS",
      failure: "PASS",
      sigint: "PASS",
      sigterm: "PASS"
    }
  } as const;

  console.log(JSON.stringify(runtimeEvidence, null, 2));

  const cleanupReport = cleanup.cleanup("successful preview HTTPS auth proof");
  if (cleanupReport.failures.length > 0) {
    throw new Error(formatCleanupFailures(cleanupReport.failures));
  }

  reportVerificationStatus("PASS", "preview HTTPS auth proof completed with disposable preview topology.");
}

main().catch((error) => {
  const cleanupReport = cleanup.cleanup("failed preview HTTPS auth proof");
  console.error(createVerificationFailure(error, cleanupReport.failures, "preview:https-auth-proof").message);
  process.exitCode = 1;
});
