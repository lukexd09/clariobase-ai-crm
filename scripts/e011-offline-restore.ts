import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import {
  createCleanupController,
  createDockerRunId,
  createRuntimeArtifactName,
  formatCleanupFailures
} from "./docker-test-support";

const repoRoot = process.cwd();
const t013Mode = process.argv[2] === "--t013";
const bundleRoot = t013Mode ? process.argv[3] : process.argv[2];
const runnerImage = t013Mode ? undefined : process.argv[3];
if (!bundleRoot || (!t013Mode && !runnerImage)) {
  throw new Error("bundle root and runner image arguments required");
}

type T013Manifest = {
  bundleFormatVersion: number;
  sourceSha: string;
  sourceArchive: string;
  sourceArchiveSha256: string;
  applicationImageId: string;
  ingressImage: string;
  ingressImageId: string;
  postgresImage: string;
  postgresImageId: string;
  nodeBaseImage: string;
  nodeBaseImageId: string;
  artifacts: Array<{ path: string; type: string; sha256?: string }>;
};

function run(command: string, args: string[]) {
  return spawnSync(command, args, { encoding: "utf8", shell: false });
}

function runWith(command: string, args: string[], options: { cwd?: string; env?: Record<string, string> } = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    shell: false,
    maxBuffer: 1024 * 1024 * 32
  });
}

function mustRun(result: ReturnType<typeof runWith>, phase: string) {
  if (result.status !== 0) throw new Error(`${phase} failed with exit code ${result.status ?? "unknown"}`);
  return result.stdout.trim();
}

async function sha256(filePath: string) {
  const hash = crypto.createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

async function waitForHealth(containerName: string) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const result = runWith("docker", ["inspect", "--format", "{{.State.Health.Status}}", containerName]);
    if (result.status === 0 && result.stdout.trim() === "healthy") return;
    await delay(1000);
  }
  throw new Error("Offline recovery container did not become healthy");
}

async function t013RestoreMain() {
  if (process.env.T013_DISPOSABLE_BUNDLE !== "1") {
    throw new Error("T013 offline proof requires the disposable bundle gate");
  }
  const resolvedBundle = path.resolve(bundleRoot as string);
  const manifestPath = path.join(resolvedBundle, "manifest.json");
  const declaredManifestSha = fs.readFileSync(path.join(resolvedBundle, "manifest.sha256"), "utf8").trim();
  if (await sha256(manifestPath) !== declaredManifestSha) throw new Error("T013 bundle manifest checksum mismatch");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as T013Manifest;
  if (manifest.bundleFormatVersion !== 2) throw new Error("Unsupported T013 recovery bundle format");
  for (const artifact of manifest.artifacts) {
    if (artifact.type !== "file" || !artifact.sha256) continue;
    const artifactPath = path.resolve(resolvedBundle, artifact.path);
    if (!artifactPath.startsWith(`${resolvedBundle}${path.sep}`)) throw new Error("Bundle artifact escaped the recovery root");
    if (await sha256(artifactPath) !== artifact.sha256) throw new Error("T013 bundle artifact checksum mismatch");
  }

  const project = createDockerRunId("t013-offline-restore");
  const tmpRoot = path.join(repoRoot, ".codex-tmp", createRuntimeArtifactName("t013-offline-restore"));
  const sourceRoot = path.join(tmpRoot, "source");
  const envPath = path.join(tmpRoot, "offline.env");
  const caPath = path.join(tmpRoot, "root.crt");
  const clientScript = path.join(tmpRoot, "offline-client.mjs");
  const cleanup = createCleanupController("e011-offline-restore:t013");
  cleanup.installProcessHandlers();
  cleanup.addTask("application-image", () => {
    runWith("docker", ["image", "rm", "-f", manifest.applicationImageId]);
  });
  cleanup.registerTempPath(resolvedBundle);
  cleanup.registerTempPath(tmpRoot);
  cleanup.registerDockerProject(project);
  fs.mkdirSync(sourceRoot, { recursive: true });

  let mainError: unknown;
  try {
    if (await sha256(path.join(resolvedBundle, manifest.sourceArchive)) !== manifest.sourceArchiveSha256) {
      throw new Error("T013 source archive checksum mismatch");
    }
    mustRun(runWith("tar", ["-xzf", path.join(resolvedBundle, manifest.sourceArchive), "-C", sourceRoot]), "extract exact source archive");

    for (const archive of ["application.tar", "ingress.tar", "postgres.tar", "node-base.tar"]) {
      mustRun(runWith("docker", ["load", "-i", path.join(resolvedBundle, "images", archive)]), `load ${archive}`);
    }
    const restoredImageId = mustRun(runWith("docker", ["image", "inspect", manifest.applicationImageId, "--format", "{{.Id}}"]), "inspect restored application image");
    if (restoredImageId !== manifest.applicationImageId) throw new Error("Restored application image identity mismatch");
    for (const [label, imageId] of [
      ["ingress", manifest.ingressImageId],
      ["PostgreSQL", manifest.postgresImageId],
      ["Node.js base", manifest.nodeBaseImageId]
    ] as const) {
      const restoredId = mustRun(runWith("docker", ["image", "inspect", imageId, "--format", "{{.Id}}"]), `inspect restored ${label} image`);
      if (restoredId !== imageId) throw new Error(`Restored ${label} image identity mismatch`);
    }

    const offlineInstall = runWith("docker", [
      "run", "--rm", "--network", "none",
      "-e", "COREPACK_HOME=/empty-corepack", "-e", "npm_config_cache=/empty-npm-cache",
      "-v", `${sourceRoot.replace(/\\/g, "/")}:/work`,
      "-v", `${path.join(resolvedBundle, "pnpm-store").replace(/\\/g, "/")}:/store:ro`,
      "-v", `${path.join(resolvedBundle, "tooling").replace(/\\/g, "/")}:/tooling:ro`,
      "-w", "/work", manifest.nodeBaseImageId,
      "bash", "-lc",
      "node /tooling/package/bin/pnpm.cjs install --offline --frozen-lockfile --store-dir /store && node ./node_modules/prisma/build/index.js generate"
    ]);
    mustRun(offlineInstall, "network-disabled dependency restore and Prisma generation");

    const hostname = `crm-offline-${crypto.randomBytes(6).toString("hex")}.home.arpa`;
    const postgresPassword = crypto.randomBytes(32).toString("base64url");
    const authSecret = crypto.randomBytes(48).toString("base64url");
    const adminEmail = `offline-admin-${crypto.randomUUID()}@example.test`;
    const adminPassword = crypto.randomBytes(24).toString("base64url");
    const origin = `https://${hostname}`;
    fs.writeFileSync(envPath, [
      "CRM_PRIVATE_BIND_ADDRESS=127.0.0.1", "CRM_PRIVATE_HTTPS_PORT=443",
      `CRM_PRIVATE_HOSTNAME=${hostname}`, `CRM_AUTH_TRUSTED_ORIGINS=${origin}`,
      "CRM_AUTH_RUNTIME_MODE=private-https", `BETTER_AUTH_URL=${origin}`,
      `BETTER_AUTH_SECRET=${authSecret}`, `CRM_PRIVATE_APP_IMAGE=${manifest.applicationImageId}`,
      `CRM_PRIVATE_INGRESS_IMAGE=${manifest.ingressImageId}`,
      `CRM_POSTGRES_IMAGE=${manifest.postgresImageId}`,
      `AI_EXCHANGE_HOST_PATH=${path.join(tmpRoot, "ai-exchange").replace(/\\/g, "/")}`,
      "CRM_POSTGRES_DB=clariobase_offline", "CRM_POSTGRES_USER=clariobase_offline_user",
      `CRM_POSTGRES_PASSWORD=${postgresPassword}`,
      `CRM_DATABASE_URL=postgresql://clariobase_offline_user:${postgresPassword}@crm-postgres:5432/clariobase_offline?schema=public`,
      "CRM_DEPLOYMENT_ENV=production"
    ].join("\n"), { encoding: "utf8", mode: 0o600 });
    fs.mkdirSync(path.join(tmpRoot, "ai-exchange"), { recursive: true });

    const composeBase = [
      "compose", "--project-name", project, "--env-file", envPath,
      "-f", "compose.yaml", "-f", "compose.private-https.yaml", "-f", "compose.private-https.offline-proof.yaml"
    ];
    const compose = (args: string[], env: Record<string, string> = {}) =>
      runWith("docker", [...composeBase, ...args], { cwd: sourceRoot, env });
    mustRun(compose(["config", "--quiet"]), "validate offline private HTTPS model");
    mustRun(compose(["up", "-d", "crm-postgres"]), "start offline PostgreSQL");
    await waitForHealth(`${project}-crm-postgres-1`);
    mustRun(compose(["run", "--rm", "crm-app", "node", "./node_modules/prisma/build/index.js", "migrate", "deploy"]), "run offline migrations");
    mustRun(compose(["up", "-d", "--no-build", "--pull", "never", "crm-app", "crm-private-ingress"]), "start offline exact-image HTTPS runtime");
    await waitForHealth(`${project}-crm-app-1`);
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const copied = compose(["cp", "crm-private-ingress:/data/caddy/pki/authorities/local/root.crt", caPath]);
      if (copied.status === 0 && fs.existsSync(caPath)) break;
      await delay(500);
    }
    if (!fs.existsSync(caPath)) throw new Error("Offline Caddy CA export failed");

    const bootstrapFixture = path.join(sourceRoot, "scripts/fixtures/e011/t013-bootstrap-admin.ts").replace(/\\/g, "/");
    mustRun(compose([
      "run", "--rm", "-v", `${bootstrapFixture}:/proof/bootstrap.ts:ro`,
      "-e", "CLARIOBASE_BOOTSTRAP_ENABLED", "-e", "CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL", "-e", "CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD",
      "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/bootstrap.ts"
    ], {
      CLARIOBASE_BOOTSTRAP_ENABLED: "1",
      CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL: adminEmail,
      CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD: adminPassword
    }), "bootstrap offline administrator");

    fs.writeFileSync(clientScript, [
      "const origin=process.env.T013_OFFLINE_ORIGIN;",
      "const ready=await fetch(origin+'/api/ready'); if(ready.status!==200) process.exit(2);",
      "const signIn=await fetch(origin+'/api/auth/sign-in/email',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:process.env.T013_OFFLINE_EMAIL,password:process.env.T013_OFFLINE_PASSWORD})});",
      "const cookie=signIn.headers.get('set-cookie')||''; if(signIn.status!==200||!cookie.includes('Secure')||!cookie.includes('HttpOnly')||!cookie.includes('SameSite=Lax')) process.exit(3);",
      "let blocked=false; try{await fetch('https://better-auth.com',{signal:AbortSignal.timeout(3000)})}catch{blocked=true} if(!blocked) process.exit(4);",
      "console.log('T013_OFFLINE_HTTPS_SIGN_IN: PASS');"
    ].join("\n"), "utf8");
    const edgeNetwork = `${project}_crm-edge`;
    const internal = mustRun(runWith("docker", ["network", "inspect", edgeNetwork, "--format", "{{.Internal}}"]), "inspect offline network");
    if (internal !== "true") throw new Error("Offline recovery network must be internal");
    const client = runWith("docker", [
      "run", "--rm", "--network", edgeNetwork,
      "-e", "NODE_EXTRA_CA_CERTS=/proof/root.crt", "-e", "T013_OFFLINE_ORIGIN", "-e", "T013_OFFLINE_EMAIL", "-e", "T013_OFFLINE_PASSWORD",
      "-v", `${caPath.replace(/\\/g, "/")}:/proof/root.crt:ro`,
      "-v", `${clientScript.replace(/\\/g, "/")}:/proof/client.mjs:ro`,
      manifest.nodeBaseImageId, "node", "/proof/client.mjs"
    ], {
      env: { T013_OFFLINE_ORIGIN: origin, T013_OFFLINE_EMAIL: adminEmail, T013_OFFLINE_PASSWORD: adminPassword }
    });
    mustRun(client, "offline HTTPS sign-in and egress observation");

    console.log(JSON.stringify({
      result: "PASS",
      manifestSha256: declaredManifestSha,
      sourceSha: manifest.sourceSha,
      sourceArchiveSha256: manifest.sourceArchiveSha256,
      applicationImageId: manifest.applicationImageId,
      dependencyRestoreNetwork: "none",
      packageManagerCache: "empty outside supplied bundle",
      prismaGenerate: "PASS",
      exactImageRestore: "PASS",
      offlineHttpsSignIn: "PASS",
      observedEgress: "blocked on internal Docker network",
      dnsEgress: "unavailable outside isolated Docker DNS"
    }));
  } catch (error) {
    mainError = error;
  }

  const cleanupReport = cleanup.cleanup(mainError ? "failed offline proof" : "successful offline proof");
  if (mainError) throw mainError;
  if (cleanupReport.failures.length > 0) throw new Error(formatCleanupFailures(cleanupReport.failures));
}

async function main() {
  if (t013Mode) {
    await t013RestoreMain();
    return;
  }
  const network = `e011-offline-${Date.now()}`;
  const dbName = "clariobase_auth_offline";
  const dbPassword = "clariobase_test_password";
  const dbUser = "postgres";
  const dbContainer = `e011-offline-pg-${Date.now()}`;
  const runnerContainer = `e011-offline-runner-${Date.now()}`;
  const phaseLog: Array<Record<string, unknown>> = [];
  const startedAt = Date.now();

  const record = (phase: string, command: string, result: ReturnType<typeof run>, durationMs: number) => {
    phaseLog.push({
      phase,
      command,
      exitCode: result.status,
      durationMs,
      stdoutTail: result.stdout?.toString().trim().slice(-1000),
      stderrTail: result.stderr?.toString().trim().slice(-1000)
    });
  };

  let phaseStart = Date.now();
  const createNetwork = run("docker", ["network", "create", "--internal", network]);
  if (createNetwork.status !== 0) throw new Error(`network create failed: ${createNetwork.stderr}`);
  record("network", "docker network create --internal", createNetwork, Date.now() - phaseStart);

  phaseStart = Date.now();
  const postgres = run("docker", [
    "run", "-d", "--rm", "--name", dbContainer, "--network", network,
    "-e", `POSTGRES_PASSWORD=${dbPassword}`,
    "-e", `POSTGRES_DB=${dbName}`,
    "postgres:16"
  ]);
  if (postgres.status !== 0) throw new Error(`postgres start failed: ${postgres.stderr}`);
  record("postgres", "docker run postgres:16", postgres, Date.now() - phaseStart);

  phaseStart = Date.now();
  const runner = run("docker", [
    "run", "--name", runnerContainer, "--network", network,
    "-v", `${bundleRoot}:/bundle`,
    "-w", "/work",
    runnerImage,
    "bash", "-lc",
    [
      "set -euo pipefail",
      "mkdir -p /work/scripts /work/prisma",
      "mkdir -p /work/tools/e011-auth-recovery /work/scripts/fixtures/e011",
      "cp /bundle/workspace/tools/e011-auth-recovery/package.json /work/tools/e011-auth-recovery/package.json",
      "cp /bundle/workspace/tools/e011-auth-recovery/pnpm-lock.yaml /work/tools/e011-auth-recovery/pnpm-lock.yaml",
      "cp /bundle/workspace/scripts/fixtures/e011/better-auth-core.schema.prisma /work/scripts/fixtures/e011/better-auth-core.schema.prisma",
      "cp /bundle/workspace/scripts/better-auth-proof-auth.ts /work/scripts/better-auth-proof-auth.ts",
      "cp /bundle/workspace/scripts/better-auth-proof.config.ts /work/scripts/better-auth-proof.config.ts",
      "cp /bundle/workspace/scripts/better-auth-proof.ts /work/scripts/better-auth-proof.ts",
      "ln -s /work/tools/e011-auth-recovery/node_modules /work/node_modules",
      "cat <<'EOF' >/usr/local/bin/pnpm\n#!/usr/bin/env sh\nexec node /bundle/tooling/pnpm/package/bin/pnpm.cjs \"$@\"\nEOF\nchmod +x /usr/local/bin/pnpm",
      "ENGINE_PATH=$(find /bundle/tooling/prisma-engines -type f -name 'schema-engine' | head -n 1)",
      "test -n \"$ENGINE_PATH\"",
      "test -x \"$ENGINE_PATH\"",
      "export PRISMA_SCHEMA_ENGINE_BINARY=\"$ENGINE_PATH\"",
      "unset PRISMA_ENGINES_MIRROR",
      "unset PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING",
      "unset PRISMA_MIGRATION_ENGINE_BINARY",
      "cd /work/tools/e011-auth-recovery && node /bundle/tooling/pnpm/package/bin/pnpm.cjs install --offline --frozen-lockfile --store-dir /bundle/pnpm-store",
      `export BETTER_AUTH_PROOF_DATABASE_URL='postgresql://${dbUser}:${dbPassword}@${dbContainer}:5432/${dbName}?schema=public'`,
      "export E011_AUTH_REPO_ROOT=/work",
      "export PNPM_RUNTIME_CJS=/bundle/tooling/pnpm/package/bin/pnpm.cjs",
      "cd /work/tools/e011-auth-recovery && node /bundle/tooling/pnpm/package/bin/pnpm.cjs exec tsx ../../scripts/better-auth-proof.ts"
    ].join(" && ")
  ]);
  record("offline-restore", "docker run runner ...", runner, Date.now() - phaseStart);

  run("docker", ["rm", "-f", runnerContainer]);
  run("docker", ["stop", dbContainer]);
  run("docker", ["network", "rm", network]);

  console.log(JSON.stringify({
    phaseLog,
    totalDurationMs: Date.now() - startedAt,
    bundleRoot,
    network,
    postgresStatus: postgres.status,
    restoreStatus: runner.status,
    restoreStdout: runner.stdout?.toString(),
    restoreStderr: runner.stderr?.toString()
  }, null, 2));

  process.exitCode = runner.status ?? 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
