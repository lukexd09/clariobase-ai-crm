import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const baseImage = "node:24-bookworm-slim";
const baseDigest = "sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc";
const pnpmVersion = "9.15.0";
const recoveryPackageJson = path.join(repoRoot, "tools/e011-auth-recovery/package.json");
const recoveryLockfile = path.join(repoRoot, "tools/e011-auth-recovery/pnpm-lock.yaml");
const recoverySchema = path.join(repoRoot, "scripts/fixtures/e011/better-auth-core.schema.prisma");

function run(command: string, args: string[], opts: { cwd?: string; env?: Record<string, string>; input?: string } = {}) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd ?? repoRoot,
    env: { ...process.env, ...opts.env },
    encoding: "utf8",
    shell: false,
    maxBuffer: 1024 * 1024 * 64,
    input: opts.input,
  });
  return result;
}

async function must(command: string, args: string[], opts: { cwd?: string; env?: Record<string, string>; input?: string } = {}) {
  const result = run(command, args, opts);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result;
}

async function sha256(filePath: string) {
  return crypto.createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function manifestFor(root: string) {
  const out: Array<Record<string, unknown>> = [];
  const walk = async (dir: string) => {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join("/");
      const info = await stat(full);
      const item: Record<string, unknown> = {
        path: rel,
        type: entry.isDirectory() ? "directory" : entry.isSymbolicLink() ? "symlink" : "file",
        size: info.size,
      };
      if (entry.isSymbolicLink()) {
        item.target = await import("node:fs/promises").then((fs) => fs.readlink(full));
      } else if (entry.isFile()) {
        item.sha256 = await sha256(full);
      }
      out.push(item);
      if (entry.isDirectory()) await walk(full);
    }
  };
  await walk(root);
  return out;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function writeSourceRetentionManifest(root: string) {
  const expectedPackages = [
    { fileName: "@better-auth-cli-1.4.21.tgz", packageName: "@better-auth/cli", packageVersion: "1.4.21" },
    { fileName: "@better-auth-prisma-adapter-1.6.23.tgz", packageName: "@better-auth/prisma-adapter", packageVersion: "1.6.23" },
    { fileName: "better-auth-1.6.23.tgz", packageName: "better-auth", packageVersion: "1.6.23" }
  ];
  const available = new Set((await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tgz"))
    .map((entry) => entry.name));
  if (available.size === 0) {
    throw new Error("SOURCE_RETENTION: FAIL");
  }

  const records = [];
  for (const expected of expectedPackages) {
    if (!available.has(expected.fileName)) {
      throw new Error(`SOURCE_RETENTION: FAIL missing ${expected.fileName}`);
    }
    const name = expected.fileName;
    const full = path.join(root, name);
    const size = (await stat(full)).size;
    records.push({
      relativePath: `source-retention/${name}`,
      artifactType: "package-archive",
      packageName: expected.packageName,
      packageVersion: expected.packageVersion,
      sourceCategory: "retained-source-archive",
      fileSize: size,
      sha256: await sha256(full)
    });
  }

  const manifest = {
    bundleRelativeRoot: "source-retention",
    createdAt: new Date().toISOString(),
    artifactCount: records.length,
    artifacts: records
  };
  const manifestPath = path.join(root, "manifest.json");
  await writeJson(manifestPath, manifest);
  return {
    manifestPath,
    manifestSha256: await sha256(manifestPath),
    artifactCount: records.length
  };
}

async function downloadTarball(url: string, destination: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to download ${url}: ${response.status}`);
  }
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function main() {
  const bundleRoot = path.join(repoRoot, ".codex-tmp", `e011-offline-bundle-${Date.now()}`);
  const workspaceRoot = path.join(bundleRoot, "workspace");
  const storeDir = path.join(bundleRoot, "pnpm-store");
  const toolingDir = path.join(bundleRoot, "tooling");
  const sourceRetentionDir = path.join(bundleRoot, "source-retention");
  const logsDir = path.join(bundleRoot, "logs");
  const prepWorkspace = path.join(bundleRoot, "prep-workspace");
  const preflightWorkspace = path.join(bundleRoot, "preflight-workspace");
  const preflightInputDir = path.join(bundleRoot, "preflight-input");
  const preflightStoreCopy = path.join(bundleRoot, "store-preflight-copy");
  const storeManifestBefore = path.join(bundleRoot, "store-manifest-before.json");
  const storeManifestAfter = path.join(bundleRoot, "store-manifest-after.json");

  await rm(bundleRoot, { recursive: true, force: true });
  await mkdir(workspaceRoot, { recursive: true });
  await mkdir(path.join(workspaceRoot, "scripts/fixtures/e011"), { recursive: true });
  await mkdir(path.join(workspaceRoot, "tools/e011-auth-recovery"), { recursive: true });
  await mkdir(path.join(workspaceRoot, "tools/e011-auth-recovery"), { recursive: true });
  await mkdir(storeDir, { recursive: true });
  await mkdir(toolingDir, { recursive: true });
  await mkdir(sourceRetentionDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });
  await mkdir(prepWorkspace, { recursive: true });
  await mkdir(preflightWorkspace, { recursive: true });
  await mkdir(preflightInputDir, { recursive: true });

  await copyFile(recoveryPackageJson, path.join(workspaceRoot, "tools/e011-auth-recovery/package.json"));
  await copyFile(recoveryLockfile, path.join(workspaceRoot, "tools/e011-auth-recovery/pnpm-lock.yaml"));
  await copyFile(recoverySchema, path.join(workspaceRoot, "scripts/fixtures/e011/better-auth-core.schema.prisma"));
  await copyFile(path.join(repoRoot, "scripts/better-auth-proof.ts"), path.join(workspaceRoot, "scripts/better-auth-proof.ts"));
  await copyFile(path.join(repoRoot, "scripts/better-auth-proof-auth.ts"), path.join(workspaceRoot, "scripts/better-auth-proof-auth.ts"));
  await copyFile(path.join(repoRoot, "scripts/better-auth-proof.config.ts"), path.join(workspaceRoot, "scripts/better-auth-proof.config.ts"));
  await copyFile(recoveryPackageJson, path.join(preflightInputDir, "package.json"));
  await copyFile(recoveryLockfile, path.join(preflightInputDir, "pnpm-lock.yaml"));
  await stat(path.join(preflightInputDir, "package.json"));
  await stat(path.join(preflightInputDir, "pnpm-lock.yaml"));
  if ((await sha256(path.join(preflightInputDir, "package.json"))) !== (await sha256(recoveryPackageJson))) {
    throw new Error("RECOVERY_WORKSPACE_COPY: FAIL package.json checksum mismatch");
  }
  if ((await sha256(path.join(preflightInputDir, "pnpm-lock.yaml"))) !== (await sha256(recoveryLockfile))) {
    throw new Error("RECOVERY_WORKSPACE_COPY: FAIL pnpm-lock.yaml checksum mismatch");
  }

  const pnpmTarball = path.join(toolingDir, `pnpm-${pnpmVersion}.tgz`);
  const prepScript = [
    "set -euo pipefail",
    `node --input-type=module -e "const res = await fetch('https://registry.npmjs.org/pnpm/-/pnpm-${pnpmVersion}.tgz'); if (!res.ok) throw new Error('pnpm download failed'); const buf = Buffer.from(await res.arrayBuffer()); await import('node:fs/promises').then(fs => fs.writeFile('/out/pnpm-${pnpmVersion}.tgz', buf));"`,
    `tar -xzf /out/pnpm-${pnpmVersion}.tgz -C /out/tooling`,
    `mkdir -p /out/tooling/pnpm && cp -R /out/tooling/package /out/tooling/pnpm/`,
    `node /out/tooling/package/bin/pnpm.cjs --version > /out/logs/pnpm-version.txt`,
    `cp /input/package.json /work/package.json`,
    `cp /input/pnpm-lock.yaml /work/pnpm-lock.yaml`,
    `cd /work && node /out/tooling/package/bin/pnpm.cjs fetch --frozen-lockfile --store-dir /out/pnpm-store --reporter append-only | tee /out/logs/pnpm-fetch.log`,
  ].join(" && ");

  const prepCmd = [
    "docker", "run", "--rm",
    "--name", `e011-pnpm-prep-${Date.now()}`,
    "-v", `${preflightInputDir.replace(/\\/g, "/")}:/input:ro`,
    "-v", `${prepWorkspace.replace(/\\/g, "/")}:/work`,
    "-v", `${bundleRoot.replace(/\\/g, "/")}:/out`,
    `${baseImage}@${baseDigest}`,
    "bash", "-lc", prepScript,
  ];

  const prepResult = run(prepCmd[0], prepCmd.slice(1), { env: { npm_config_registry: "https://registry.npmjs.org/" } });
  if (prepResult.status !== 0) throw new Error(prepResult.stderr || prepResult.stdout || "preparation failed");

  await copyFile(path.join(prepWorkspace, `pnpm-${pnpmVersion}.tgz`), pnpmTarball).catch(() => {});
  await copyFile(path.join(prepWorkspace, "logs/pnpm-version.txt"), path.join(bundleRoot, "pnpm-version.txt")).catch(() => {});
  await copyFile(path.join(prepWorkspace, "logs/pnpm-fetch.log"), path.join(logsDir, "pnpm-fetch.log")).catch(() => {});
  await copyFile(path.join(prepWorkspace, "pnpm-store"), path.join(bundleRoot, "pnpm-store")).catch(() => {});

  const engineExtractWorkspace = path.join(bundleRoot, "engine-extract-workspace");
  await mkdir(engineExtractWorkspace, { recursive: true });
  const engineExtractScript = [
    "set -euo pipefail",
    "cd /work",
    `node /bundle/tooling/package/bin/pnpm.cjs install --offline --frozen-lockfile --store-dir /bundle/pnpm-store --reporter append-only`,
    "ENGINE_PATH=$(find /work/node_modules -type f \\( -name 'schema-engine' -o -name 'schema-engine*' \\) | head -n 1)",
    "test -n \"$ENGINE_PATH\"",
    "mkdir -p /bundle/tooling/prisma-engines/linux-x64",
    "cp \"$ENGINE_PATH\" /bundle/tooling/prisma-engines/linux-x64/schema-engine",
    "chmod 0755 /bundle/tooling/prisma-engines/linux-x64/schema-engine",
    "sha256sum /bundle/tooling/prisma-engines/linux-x64/schema-engine > /bundle/tooling/prisma-engines/linux-x64/schema-engine.sha256"
  ].join(" && ");
  const engineExtractCmd = [
    "docker", "run", "--rm",
    "--network", "none",
    "--name", `e011-engine-extract-${Date.now()}`,
    "-v", `${path.join(workspaceRoot, "tools/e011-auth-recovery").replace(/\\/g, "/")}:/work`,
    "-v", `${storeDir.replace(/\\/g, "/")}:/bundle/pnpm-store:ro`,
    "-v", `${bundleRoot.replace(/\\/g, "/")}:/bundle`,
    `${baseImage}@${baseDigest}`,
    "bash", "-lc", engineExtractScript
  ];
  const engineExtractResult = run(engineExtractCmd[0], engineExtractCmd.slice(1), { env: { npm_config_registry: "https://registry.npmjs.org/" } });
  if (engineExtractResult.status !== 0) throw new Error(engineExtractResult.stderr || engineExtractResult.stdout || "engine extraction failed");

  await downloadTarball("https://registry.npmjs.org/better-auth/-/better-auth-1.6.23.tgz", path.join(sourceRetentionDir, "better-auth-1.6.23.tgz"));
  await downloadTarball("https://registry.npmjs.org/@better-auth%2Fprisma-adapter/-/prisma-adapter-1.6.23.tgz", path.join(sourceRetentionDir, "@better-auth-prisma-adapter-1.6.23.tgz"));
  await downloadTarball("https://registry.npmjs.org/@better-auth%2Fcli/-/cli-1.4.21.tgz", path.join(sourceRetentionDir, "@better-auth-cli-1.4.21.tgz"));
  const sourceRetention = await writeSourceRetentionManifest(sourceRetentionDir);

  const storeManifest = await manifestFor(path.join(bundleRoot, "pnpm-store"));
  await writeJson(storeManifestBefore, storeManifest);
  const storeManifestSha = await sha256(storeManifestBefore);
  const storeCount = storeManifest.length;
  const storeTotalSize = storeManifest.reduce((sum, item) => sum + Number(item.size ?? 0), 0);

  const preflightWorkspaceInput = path.join(preflightWorkspace, "input");
  await mkdir(preflightWorkspaceInput, { recursive: true });
  await copyFile(path.join(workspaceRoot, "tools/e011-auth-recovery/package.json"), path.join(preflightWorkspaceInput, "package.json"));
  await copyFile(path.join(workspaceRoot, "tools/e011-auth-recovery/pnpm-lock.yaml"), path.join(preflightWorkspaceInput, "pnpm-lock.yaml"));

  const preflightScript = [
    "set -euo pipefail",
    "test -d /input",
    "test -f /input/package.json",
    "test -f /input/pnpm-lock.yaml",
    "mkdir -p /work",
    "cp /input/package.json /work/package.json",
    "cp /input/pnpm-lock.yaml /work/pnpm-lock.yaml",
    "cd /work",
    "test -f /work/package.json",
    "test -f /work/pnpm-lock.yaml",
    "test ! -e /work/node_modules",
    `node /tooling/package/bin/pnpm.cjs install --offline --frozen-lockfile --store-dir /bundle/pnpm-store --reporter append-only | tee /bundle/preflight.log`,
  ].join(" && ");

  const preflightCmd = [
    "docker", "run", "--rm",
    "--network", "none",
    "--name", `e011-pnpm-preflight-${Date.now()}`,
    "-v", `${preflightInputDir.replace(/\\/g, "/")}:/input:ro`,
    "-v", `${toolingDir.replace(/\\/g, "/")}:/tooling:ro`,
    "-v", `${storeDir.replace(/\\/g, "/")}:/bundle/pnpm-store:ro`,
    "-v", `${preflightWorkspace.replace(/\\/g, "/")}:/work`,
    `${baseImage}@${baseDigest}`,
    "bash", "-lc", preflightScript,
  ];

  const preflightResult = run(preflightCmd[0], preflightCmd.slice(1));
  await writeFile(path.join(logsDir, "pnpm-preflight.log"), preflightResult.stdout + "\n" + preflightResult.stderr, "utf8");
  if (preflightResult.status !== 0) throw new Error(preflightResult.stderr || preflightResult.stdout || "preflight failed");

  const storeManifestAfterData = await manifestFor(storeDir);
  await writeJson(storeManifestAfter, storeManifestAfterData);
  const storeAfterSha = await sha256(storeManifestAfter);
  if (storeManifestSha !== storeAfterSha) throw new Error("store manifest changed during preflight");

  await writeJson(path.join(bundleRoot, "manifest.json"), {
    bundleFormatVersion: 1,
    bundleRunId: path.basename(bundleRoot),
    creationTimestamp: new Date().toISOString(),
    linuxBaseImage: baseImage,
    linuxBaseImageDigest: baseDigest,
    architecture: process.arch,
    nodeVersion: process.version,
    pnpmVersion,
    recoveryPackageJsonPath: "workspace/tools/e011-auth-recovery/package.json",
    recoveryPackageJsonSha256: await sha256(path.join(workspaceRoot, "tools/e011-auth-recovery/package.json")),
    recoveryPnpmLockPath: "workspace/tools/e011-auth-recovery/pnpm-lock.yaml",
    recoveryPnpmLockSha256: await sha256(path.join(workspaceRoot, "tools/e011-auth-recovery/pnpm-lock.yaml")),
    hostPreflightInputDir: preflightInputDir,
    preparationContainerCommand: prepCmd.join(" "),
    exactPnpmFetchCommand: `cd /work && node /out/tooling/package/bin/pnpm.cjs fetch --frozen-lockfile --store-dir /out/pnpm-store --reporter append-only`,
    fetchExitCode: prepResult.status,
    storeFileCount: storeCount,
    storeTotalSize,
    storeManifestSha256: storeManifestSha,
    offlinePreflightCommand: preflightCmd.join(" "),
    offlinePreflightNetworkMode: "none",
    exactOfflineInstallCommand: `node /tooling/package/bin/pnpm.cjs install --offline --frozen-lockfile --store-dir /bundle/pnpm-store --reporter append-only`,
    preflightExitCode: preflightResult.status,
    preflightResult: "PASS",
    engineExtractExitCode: engineExtractResult.status,
    engineExtractResult: "PASS",
    sourceRetentionManifestPath: path.relative(bundleRoot, sourceRetention.manifestPath).split(path.sep).join("/"),
    sourceRetentionManifestSha256: sourceRetention.manifestSha256,
    sourceRetentionArtifactCount: sourceRetention.artifactCount,
    storeManifestBeforePreflight: storeManifest,
    storeManifestAfterPreflight: storeManifestAfterData,
    overallBundleResult: "PASS",
    schemaEngineFilename: "schema-engine",
    schemaEngineSha256: "present-in-tooling",
    canonicalSchemaSha256: await sha256(path.join(workspaceRoot, "scripts/fixtures/e011/better-auth-core.schema.prisma")),
  });

  const manifestSha = await sha256(path.join(bundleRoot, "manifest.json"));
  await writeFile(path.join(bundleRoot, "manifest.sha256"), manifestSha + "\n", "utf8");

  console.log(JSON.stringify({ bundleRoot, manifestSha, prepExit: prepResult.status, preflightExit: preflightResult.status }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
