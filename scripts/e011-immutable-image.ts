import { strict as assert } from "node:assert";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { spawnSync } from "node:child_process";
import * as crypto from "node:crypto";

type ProcResult = ReturnType<typeof spawnSync>;
type PhaseResult = {
  phase: string;
  command: string;
  start: string;
  timeoutMs: number;
  durationMs: number;
  status: number | null;
  signal: NodeJS.Signals | null;
  stdoutTail: string;
  stderrTail: string;
  outcome: "PASS" | "FAIL" | "TIMEOUT";
};
type BundleManifest = {
  overallBundleResult: string;
  fetchExitCode: number;
  preflightExitCode: number;
  offlinePreflightNetworkMode: string;
  pnpmVersion: string;
  sourceRetentionManifestSha256: string;
  sourceRetentionArtifactCount: number;
  schemaEngineSha256: string;
  canonicalSchemaSha256: string;
};

const bundleRoot = process.argv[2];
if (!bundleRoot) {
  throw new Error("bundle root argument required");
}

const repoRoot = process.cwd();
const pnpmVersion = "9.15.0";
const baseImage = "node:24-bookworm-slim";
const baseImageDigest = "sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc";
const expectedSourceRetention = [
  {
    fileName: "@better-auth-cli-1.4.21.tgz",
    packageName: "@better-auth/cli",
    packageVersion: "1.4.21",
  },
  {
    fileName: "@better-auth-prisma-adapter-1.6.23.tgz",
    packageName: "@better-auth/prisma-adapter",
    packageVersion: "1.6.23",
  },
  {
    fileName: "better-auth-1.6.23.tgz",
    packageName: "better-auth",
    packageVersion: "1.6.23",
  },
] as const;

function run(command: string, args: string[], options: { cwd?: string; env?: Record<string, string> } = {}): ProcResult {
  return spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    shell: false,
    maxBuffer: 1024 * 1024 * 64,
  });
}

function tail(text: string | Buffer | undefined, lines = 20) {
  const value = String(text ?? "");
  return value.split(/\r?\n/).slice(-lines).join("\n");
}

function runCommandWithTimeout(
  phase: string,
  command: string,
  args: string[],
  timeoutMs: number,
  options: { cwd?: string; env?: Record<string, string> } = {},
) {
  const start = new Date();
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    shell: false,
    maxBuffer: 1024 * 1024 * 64,
    timeout: timeoutMs,
  });
  const timedOut = Boolean(result.error && "code" in result.error && result.error.code === "ETIMEDOUT");
  const phaseResult: PhaseResult = {
    phase,
    command: [command, ...args].join(" "),
    start: start.toISOString(),
    timeoutMs,
    durationMs: Date.now() - start.getTime(),
    status: result.status,
    signal: result.signal,
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr),
    outcome: timedOut ? "TIMEOUT" : result.status === 0 ? "PASS" : "FAIL",
  };
  console.log(JSON.stringify(phaseResult, null, 2));
  return { result, phaseResult };
}

function mustSucceed(result: ProcResult, message: string) {
  if (result.status !== 0) {
    throw new Error(`${message}\nSTDOUT:\n${result.stdout ?? ""}\nSTDERR:\n${result.stderr ?? ""}`);
  }
}

async function sha256(filePath: string) {
  const buffer = await readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function dockerPath(value: string) {
  return value.replace(/\\/g, "/");
}

async function copySelectedRepoSnapshot(stagingDir: string) {
  const entries: Array<[string, string]> = [
    ["package.json", "package.json"],
    ["pnpm-lock.yaml", "pnpm-lock.yaml"],
    ["tsconfig.json", "tsconfig.json"],
    ["next.config.ts", "next.config.ts"],
    ["postcss.config.mjs", "postcss.config.mjs"],
    ["tailwind.config.ts", "tailwind.config.ts"],
    ["prisma", "prisma"],
    ["src", "src"],
    ["scripts/better-auth-proof.ts", "scripts/better-auth-proof.ts"],
    ["scripts/better-auth-proof.config.ts", "scripts/better-auth-proof.config.ts"],
    ["scripts/better-auth-proof-auth.ts", "scripts/better-auth-proof-auth.ts"],
    ["scripts/e011-offline-bundle.ts", "scripts/e011-offline-bundle.ts"],
    ["scripts/e011-offline-restore.ts", "scripts/e011-offline-restore.ts"],
    ["scripts/fixtures/e011/better-auth-core.schema.prisma", "scripts/fixtures/e011/better-auth-core.schema.prisma"],
    ["tools/e011-auth-recovery/package.json", "tools/e011-auth-recovery/package.json"],
    ["tools/e011-auth-recovery/pnpm-lock.yaml", "tools/e011-auth-recovery/pnpm-lock.yaml"],
  ];

  for (const [source, target] of entries) {
    await mkdir(path.dirname(path.join(stagingDir, target)), { recursive: true });
    const sourcePath = await realpath(path.join(repoRoot, source));
    await cp(sourcePath, path.join(stagingDir, target), { recursive: true, force: true, dereference: true });
  }
}

async function validateBundle() {
  const phase = "BUNDLE_VALIDATION";
  const bundleManifestPath = path.join(bundleRoot, "manifest.json");
  const sourceRetentionManifestPath = path.join(bundleRoot, "source-retention", "manifest.json");
  const bundleManifest = await readJson<BundleManifest>(bundleManifestPath);
  const sourceRetentionManifest = await readJson<{
    artifactCount: number;
    artifacts: Array<{ relativePath: string; sha256: string; packageName: string; packageVersion: string }>;
  }>(sourceRetentionManifestPath);

  assert.equal(bundleManifest.overallBundleResult, "PASS");
  assert.equal(bundleManifest.fetchExitCode, 0);
  assert.equal(bundleManifest.preflightExitCode, 0);
  assert.equal(bundleManifest.offlinePreflightNetworkMode, "none");
  assert.equal(bundleManifest.pnpmVersion, pnpmVersion);
  assert.equal(bundleManifest.sourceRetentionManifestSha256, await sha256(sourceRetentionManifestPath));
  assert.equal(bundleManifest.sourceRetentionArtifactCount, expectedSourceRetention.length);
  assert.equal(bundleManifest.schemaEngineSha256, "present-in-tooling");
  assert.equal(bundleManifest.canonicalSchemaSha256, await sha256(path.join(repoRoot, "scripts", "fixtures", "e011", "better-auth-core.schema.prisma")));
  assert.equal(sourceRetentionManifest.artifactCount, expectedSourceRetention.length);

  for (const expected of expectedSourceRetention) {
    const artifactPath = path.join(bundleRoot, "source-retention", expected.fileName);
    const artifact = sourceRetentionManifest.artifacts.find((item) => item.relativePath === `source-retention/${expected.fileName}`);
    assert(artifact, `missing source retention record for ${expected.fileName}`);
    assert.equal(artifact.packageName, expected.packageName);
    assert.equal(artifact.packageVersion, expected.packageVersion);
    assert.equal(await sha256(artifactPath), artifact.sha256);
  }

  const repositorySnapshotManifestPath = path.join(bundleRoot, "workspace", "scripts", "fixtures", "e011", "better-auth-core.schema.prisma");
  await stat(repositorySnapshotManifestPath);

  return {
    bundleManifest,
    sourceRetentionManifest,
  };
}

async function buildContextTar(tmpRoot: string, bundleManifest: BundleManifest) {
  const stagingDir = path.join(tmpRoot, "staging");
  const contextTar = path.join(tmpRoot, "context.tar");
  const contextManifestPath = path.join(tmpRoot, "context-manifest.json");
  await mkdir(stagingDir, { recursive: true });
  await copySelectedRepoSnapshot(stagingDir);
  await cp(path.join(bundleRoot, "pnpm-store"), path.join(stagingDir, "pnpm-store"), { recursive: true, force: true });

  const dockerfile = [
    "FROM node:24-bookworm-slim",
    "WORKDIR /work",
    "COPY . /work",
    "RUN corepack enable && corepack prepare pnpm@9.15.0 --activate && cd tools/e011-auth-recovery && pnpm install --offline --frozen-lockfile --store-dir /work/pnpm-store && cd /work && ln -sfn tools/e011-auth-recovery/node_modules node_modules",
    "CMD [\"node\", \"-e\", \"const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');process.env.BETTER_AUTH_PROOF_DATABASE_URL='postgresql://postgres:clariobase_test_password@crm-postgres:5432/clariobase_auth_image?schema=public';process.env.DATABASE_URL='postgresql://postgres:clariobase_test_password@crm-postgres:5432/clariobase_auth_image?schema=public';const child=spawn(process.execPath,['--experimental-strip-types','/work/scripts/better-auth-proof.ts'],{stdio:'inherit',env:process.env});const timer=setInterval(()=>{try{for(const dirent of fs.readdirSync('/tmp',{withFileTypes:true})){if(!dirent.isDirectory()||!dirent.name.startsWith('clariobase-better-auth-')) continue;const dir=path.join('/tmp',dirent.name,'proof-client');if(!fs.existsSync(dir)||fs.existsSync(path.join(dir,'client.js'))) continue;const entry=fs.readdirSync(dir).filter(name=>name.endsWith('.js')||name.endsWith('.cjs')||name.endsWith('.mjs')).filter(name=>name!=='client.js').sort()[0];if(entry){fs.writeFileSync(path.join(dir,'client.js'),'module.exports = require(\\'./'+entry+'\\');\\n');}}}catch{}},250);child.on('exit',code=>{clearInterval(timer);process.exit(code??1);});\"]",
  ].join("\n") + "\n";
  await writeFile(path.join(stagingDir, "Dockerfile"), dockerfile, "utf8");

  const contextManifest = {
    bundleRoot,
    repoRoot,
    baseImage,
    baseImageDigest,
    bundleManifestSha256: await sha256(path.join(bundleRoot, "manifest.json")),
    sourceRetentionManifestSha256: await sha256(path.join(bundleRoot, "source-retention", "manifest.json")),
    contextCreatedAt: new Date().toISOString(),
    selectedFiles: [
      "package.json",
      "pnpm-lock.yaml",
      "tsconfig.json",
      "next.config.ts",
      "postcss.config.mjs",
      "tailwind.config.ts",
      "prisma",
      "src",
      "scripts/better-auth-proof.ts",
      "scripts/better-auth-proof.config.ts",
      "scripts/better-auth-proof-auth.ts",
      "scripts/e011-offline-bundle.ts",
      "scripts/e011-offline-restore.ts",
      "scripts/fixtures/e011/better-auth-core.schema.prisma",
      "tools/e011-auth-recovery/package.json",
      "tools/e011-auth-recovery/pnpm-lock.yaml",
      "pnpm-store",
    ],
    upstreamBundleSummary: {
      pnpmVersion: bundleManifest.pnpmVersion,
      overallBundleResult: bundleManifest.overallBundleResult,
      offlinePreflightNetworkMode: bundleManifest.offlinePreflightNetworkMode,
    },
  };
  await writeFile(contextManifestPath, JSON.stringify(contextManifest, null, 2) + "\n", "utf8");
  const { result: tarResult } = runCommandWithTimeout("CONTEXT_TAR", "tar", ["-cf", contextTar, "-C", stagingDir, "."], 600000);
  mustSucceed(tarResult, "context tar creation failed");

  return {
    stagingDir,
    contextTar,
    contextManifestPath,
  };
}

function redactForbiddenLogContent(text: string) {
  const forbidden = [
    "clariobase_test_password",
    "BETTER_AUTH_PROOF_DATABASE_URL",
    "api key",
  ];
  for (const value of forbidden) {
    if (text.toLowerCase().includes(value.toLowerCase())) {
      throw new Error(`forbidden secret-like content detected in log output: ${value}`);
    }
  }
}

function proofDatabaseUrl() {
  return `postgresql://postgres:${encodeURIComponent("clariobase_test_password")}@crm-postgres:5432/clariobase_auth_image?schema=public`;
}

function proofDatabaseUrlFor(host: string) {
  return `postgresql://postgres:${encodeURIComponent("clariobase_test_password")}@${host}:5432/clariobase_auth_image?schema=public`;
}

async function runTsExecutorSelfCheck(imageRef: string, network: string) {
  const checks = [
    ["node", ["-e", "console.log(require.resolve('tsx/package.json'))"]],
    ["pnpm", ["exec", "tsx", "--version"]],
    ["pnpm", ["exec", "tsx", "-e", "console.log('tsx-runtime-pass')"]],
  ] as const;
  const aggregate = [];
  for (const [command, args] of checks) {
    const { result } = runCommandWithTimeout("RUNTIME_TS_EXECUTOR_SELF_CHECK", "docker", [
      "run",
      "--rm",
      "--network",
      network,
      "--entrypoint",
      command,
      imageRef,
      ...args,
    ], 300000);
    redactForbiddenLogContent(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
    aggregate.push(result.status);
    mustSucceed(result, `ts executor self-check failed: ${command} ${args.join(" ")}`);
  }
  const { result } = { result: { status: aggregate.every((status) => status === 0) ? 0 : 1 } as ProcResult };
  return result;
}

async function runRuntimeProof(imageRef: string, network: string) {
  const { result } = runCommandWithTimeout("FIRST_RUNTIME", "docker", [
    "run",
    "--rm",
    "--network",
    network,
    "-e",
    `BETTER_AUTH_PROOF_DATABASE_URL=${proofDatabaseUrl()}`,
    "-e",
    `DATABASE_URL=${proofDatabaseUrl()}`,
    "--entrypoint",
    "pnpm",
    imageRef,
    "exec",
    "tsx",
    "scripts/better-auth-proof.ts",
  ], 300000);
  redactForbiddenLogContent(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  mustSucceed(result, "runtime proof failed");
  return result;
}

async function runNetworkIsolationChecks(network: string, dbContainer: string, imageRef: string) {
  const checks = [
    {
      phase: "NETWORK_ISOLATION",
      label: "PostgreSQL reachable inside internal network",
      command: [
        "docker",
        "run",
        "--rm",
        "--network",
        network,
        "--entrypoint",
        "node",
        imageRef,
        "-e",
        "const net = require('node:net'); const socket = net.createConnection({ host: 'crm-postgres', port: 5432 }); socket.setTimeout(5000); socket.on('connect', () => { console.log('PASS'); socket.end(); process.exit(0); }); socket.on('timeout', () => { console.error('TIMEOUT'); socket.destroy(); process.exit(2); }); socket.on('error', (error) => { console.error(`FAIL ${error.code || 'UNKNOWN'} ${error.message}`); process.exit(1); });",
      ],
    },
    {
      phase: "NETWORK_ISOLATION",
      label: "npm registry unreachable",
      command: ["docker", "run", "--rm", "--network", network, "--entrypoint", "node", imageRef, "-e", "const dns=require('node:dns/promises'); dns.lookup('registry.npmjs.org').then(() => { console.log('FAIL'); process.exit(1); }).catch(() => { console.log('PASS'); process.exit(0); });"],
    },
    {
      phase: "NETWORK_ISOLATION",
      label: "GitHub unreachable",
      command: ["docker", "run", "--rm", "--network", network, "--entrypoint", "node", imageRef, "-e", "const dns=require('node:dns/promises'); dns.lookup('github.com').then(() => { console.log('FAIL'); process.exit(1); }).catch(() => { console.log('PASS'); process.exit(0); });"],
    },
    {
      phase: "NETWORK_ISOLATION",
      label: "binaries.prisma.sh unreachable",
      command: ["docker", "run", "--rm", "--network", network, "--entrypoint", "node", imageRef, "-e", "const dns=require('node:dns/promises'); dns.lookup('binaries.prisma.sh').then(() => { console.log('FAIL'); process.exit(1); }).catch(() => { console.log('PASS'); process.exit(0); });"],
    },
    {
      phase: "NETWORK_ISOLATION",
      label: "Better Auth external domains unreachable",
      command: ["docker", "run", "--rm", "--network", network, "--entrypoint", "node", imageRef, "-e", "const dns=require('node:dns/promises'); dns.lookup('better-auth.com').then(() => { console.log('FAIL'); process.exit(1); }).catch(() => { console.log('PASS'); process.exit(0); });"],
    },
  ] as const;
  for (const check of checks) {
    const { result } = runCommandWithTimeout(check.phase, check.command[0], check.command.slice(1), 60000);
    redactForbiddenLogContent(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
    mustSucceed(result, `${check.label} failed`);
    console.log(JSON.stringify({ phase: check.phase, label: check.label, result: result.status }, null, 2));
  }
}

async function startRuntimeInfra(network: string, dbContainer: string) {
  const { result: postgres } = runCommandWithTimeout("RUNTIME_INFRA_CREATE", "docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    dbContainer,
    "--network",
    network,
    "--network-alias",
    "crm-postgres",
    "-e",
    "POSTGRES_PASSWORD=clariobase_test_password",
    "-e",
    "POSTGRES_DB=clariobase_auth_image",
    "postgres:16",
  ], 180000);
  mustSucceed(postgres, "postgres start failed");
  await waitForPostgres(network, dbContainer);
}

async function runRunnerDnsProbe(imageRef: string, network: string) {
  const probe = [
    "const dns = require('node:dns/promises');",
    "dns.lookup('crm-postgres')",
    "  .then((result) => {",
    "    console.log(`[probe] dns: PASS ${result.address}`);",
    "    process.exit(0);",
    "  })",
    "  .catch((error) => {",
    "    console.error(`[probe] dns: FAIL ${error.code || 'UNKNOWN'} ${error.message}`);",
    "    process.exit(1);",
    "  });",
  ].join(" ");
  const { result } = runCommandWithTimeout("RUNNER_DNS_PROBE", "docker", [
    "run",
    "--rm",
    "--network",
    network,
    "--entrypoint",
    "node",
    imageRef,
    "-e",
    probe,
  ], 60000);
  redactForbiddenLogContent(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  mustSucceed(result, "runner dns probe failed");
  return result;
}

async function runRunnerTcpProbe(imageRef: string, network: string) {
  const probe = [
    "const net = require('node:net');",
    "const host = 'crm-postgres';",
    "const port = 5432;",
    "console.log(`[probe] connecting to ${host}:${port}`);",
    "const socket = net.createConnection({ host, port });",
    "socket.setTimeout(5000);",
    "socket.on('connect', () => { console.log('[probe] tcp connection: PASS'); socket.end(); process.exit(0); });",
    "socket.on('timeout', () => { console.error('[probe] tcp connection: TIMEOUT'); socket.destroy(); process.exit(2); });",
    "socket.on('error', (error) => { console.error(`[probe] tcp connection: FAIL ${error.code || 'UNKNOWN'} ${error.message}`); process.exit(1); });",
  ].join(" ");
  const { result } = runCommandWithTimeout("RUNNER_TCP_PROBE", "docker", [
    "run",
    "--rm",
    "--network",
    network,
    "--entrypoint",
    "node",
    imageRef,
    "-e",
    probe,
  ], 60000);
  redactForbiddenLogContent(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  mustSucceed(result, "runner tcp probe failed");
  return result;
}

async function waitForPostgres(network: string, dbContainer: string) {
  for (let attempt = 1; attempt <= 18; attempt += 1) {
    const { result } = runCommandWithTimeout(
      "POSTGRES_LOCAL_READY",
      "docker",
      ["exec", dbContainer, "pg_isready", "-h", "127.0.0.1", "-p", "5432", "-U", "postgres", "-d", "clariobase_auth_image"],
      10000,
    );
    console.log(JSON.stringify({ phase: "POSTGRES_LOCAL_READY", attempt, result: result.status }, null, 2));
    if (result.status === 0) {
      return;
    }
  }
  throw new Error("POSTGRES_LOCAL_READY: FAIL");
}

async function main() {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "clariobase-e011-image-"));
  const run1Id = Date.now();
  const network = `e011-image-${run1Id}`;
  const dbContainer = `e011-image-pg-${run1Id}`;
  const imageTag = `clariobase-e011-proof-${Date.now()}`;
  const imageTar = path.join(tmpRoot, "image.tar");
  let postgresStarted = false;
  let firstRunImageId = "";
  let secondNetwork = "";
  let secondDbContainer = "";
  try {
    const bundleManifest = await validateBundle();
    const context = await buildContextTar(tmpRoot, bundleManifest.bundleManifest);
    const { result: buildResult } = runCommandWithTimeout("IMAGE_BUILD", "docker", ["build", "-t", imageTag, context.stagingDir], 600000);
    mustSucceed(buildResult, "image build failed");

    const { result: imageInspect } = runCommandWithTimeout("IMAGE_INSPECT", "docker", ["image", "inspect", "--format", "{{.Id}}", imageTag], 60000);
    mustSucceed(imageInspect, "image inspect failed");
    firstRunImageId = String(imageInspect.stdout ?? "").trim();
    assert(firstRunImageId, "image id required");

    const { result: networkCreate } = runCommandWithTimeout("RUNTIME_INFRA_CREATE", "docker", ["network", "create", "--internal", network], 180000);
    mustSucceed(networkCreate, "network create failed");

    await startRuntimeInfra(network, dbContainer);
    postgresStarted = true;

    await waitForPostgres(network, dbContainer);
    await runRunnerDnsProbe(firstRunImageId, network);
    await runRunnerTcpProbe(firstRunImageId, network);
    await runTsExecutorSelfCheck(firstRunImageId, network);
    const firstRun = await runRuntimeProof(firstRunImageId, network);
    await writeFile(path.join(tmpRoot, "first-run.log"), `${firstRun.stdout ?? ""}\n${firstRun.stderr ?? ""}`, "utf8");
    await runNetworkIsolationChecks(network, dbContainer, firstRunImageId);

    const { result: saveImage } = runCommandWithTimeout("IMAGE_SAVE", "docker", ["save", "-o", imageTar, imageTag], 300000);
    mustSucceed(saveImage, "image save failed");
    const { result: removeImage } = runCommandWithTimeout("IMAGE_REMOVE", "docker", ["rmi", imageTag], 120000);
    mustSucceed(removeImage, "image remove failed");

    const { result: loadImage } = runCommandWithTimeout("IMAGE_LOAD", "docker", ["load", "-i", imageTar], 300000);
    mustSucceed(loadImage, "image load failed");
    const { result: loadedInspect } = runCommandWithTimeout("IMAGE_INSPECT", "docker", ["image", "inspect", "--format", "{{.Id}}", imageTag], 60000);
    mustSucceed(loadedInspect, "loaded image inspect failed");
    assert.equal(String(loadedInspect.stdout ?? "").trim(), firstRunImageId);

    const secondRunId = Date.now();
    secondNetwork = `e011-image-${secondRunId}`;
    secondDbContainer = `e011-image-pg-${secondRunId}`;
    const { result: secondNetworkCreate } = runCommandWithTimeout("RUNTIME_INFRA_CREATE", "docker", ["network", "create", "--internal", secondNetwork], 180000);
    mustSucceed(secondNetworkCreate, "second network create failed");
    await startRuntimeInfra(secondNetwork, secondDbContainer);
    await runRunnerDnsProbe(imageTag, secondNetwork);
    await runRunnerTcpProbe(imageTag, secondNetwork);
    await runTsExecutorSelfCheck(imageTag, secondNetwork);
    const secondRun = await runRuntimeProof(imageTag, secondNetwork);
    await writeFile(path.join(tmpRoot, "second-run.log"), `${secondRun.stdout ?? ""}\n${secondRun.stderr ?? ""}`, "utf8");

    const summary = {
      bundleRoot,
      tmpRoot,
      imageTag,
      imageId: firstRunImageId,
      contextManifestPath: path.join(tmpRoot, "context-manifest.json"),
      imageTar,
      firstRunStatus: firstRun.status,
      secondRunStatus: secondRun.status,
      result: "PASS",
    };
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 0;
  } finally {
    if (secondDbContainer) {
      runCommandWithTimeout("CLEANUP", "docker", ["stop", secondDbContainer], 180000);
    }
    if (secondNetwork) {
      runCommandWithTimeout("CLEANUP", "docker", ["network", "rm", secondNetwork], 180000);
    }
    if (postgresStarted) {
      runCommandWithTimeout("CLEANUP", "docker", ["stop", dbContainer], 180000);
    }
    runCommandWithTimeout("CLEANUP", "docker", ["network", "rm", network], 180000);
    await rm(tmpRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
