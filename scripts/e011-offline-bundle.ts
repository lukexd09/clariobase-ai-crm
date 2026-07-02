import { mkdir, readFile, writeFile, readdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const bundleRoot = path.join(repoRoot, ".codex-tmp", `e011-offline-bundle-${Date.now()}`);
const contextRoot = path.join(bundleRoot, "workspace");
const storeDir = path.join(bundleRoot, "pnpm-store");
const toolingDir = path.join(bundleRoot, "tooling");
const sourceRetentionDir = path.join(bundleRoot, "source-retention");
const prismaEnginesDir = path.join(toolingDir, "prisma-engines");
const baseImage = "node:24-bookworm-slim";
const baseDigest = "sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc";
const pnpmVersion = "9.15.0";

function run(command: string, args: string[], opts: { cwd?: string; shell?: boolean; env?: Record<string, string> } = {}) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd ?? repoRoot,
    env: { ...process.env, ...opts.env },
    encoding: "utf8",
    shell: opts.shell ?? false
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

async function sha256(filePath: string) {
  const buffer = await readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  await mkdir(contextRoot, { recursive: true });
  await mkdir(storeDir, { recursive: true });
  await mkdir(toolingDir, { recursive: true });
  await mkdir(sourceRetentionDir, { recursive: true });
  await mkdir(prismaEnginesDir, { recursive: true });

  const filesToCopy = [
    "tools/e011-auth-recovery/package.json",
    "tools/e011-auth-recovery/pnpm-lock.yaml",
    "scripts/fixtures/e011/better-auth-core.schema.prisma",
    "scripts/better-auth-proof.ts",
    "scripts/better-auth-proof-auth.ts",
    "scripts/better-auth-proof.config.ts"
  ];
  for (const relative of filesToCopy) {
    const source = path.join(repoRoot, relative);
    try {
      await copyFile(source, path.join(contextRoot, relative));
    } catch {
      // Optional files are skipped if absent.
    }
  }

  const imageMount = `${repoRoot.replace(/\\/g, "/")}:/repo`;
  const bundleMount = `${bundleRoot.replace(/\\/g, "/")}:/bundle`;

  const prepScript = [
    "set -euo pipefail",
    `mkdir -p /bundle/workspace /bundle/pnpm-store /bundle/tooling /bundle/source-retention`,
    "mkdir -p /bundle/workspace/scripts/fixtures/e011 /bundle/workspace/prisma /bundle/workspace/tools/e011-auth-recovery",
    "cp /repo/tools/e011-auth-recovery/package.json /bundle/workspace/tools/e011-auth-recovery/package.json",
    "cp /repo/tools/e011-auth-recovery/pnpm-lock.yaml /bundle/workspace/tools/e011-auth-recovery/pnpm-lock.yaml",
    "cp /repo/scripts/fixtures/e011/better-auth-core.schema.prisma /bundle/workspace/scripts/fixtures/e011/better-auth-core.schema.prisma",
    "cp /repo/scripts/better-auth-proof.ts /bundle/workspace/scripts/better-auth-proof.ts",
    "cp /repo/scripts/better-auth-proof-auth.ts /bundle/workspace/scripts/better-auth-proof-auth.ts",
    "cp /repo/scripts/better-auth-proof.config.ts /bundle/workspace/scripts/better-auth-proof.config.ts",
    `node --input-type=module -e "const res = await fetch('https://registry.npmjs.org/pnpm/-/pnpm-${pnpmVersion}.tgz'); if (!res.ok) throw new Error('pnpm download failed'); const buf = Buffer.from(await res.arrayBuffer()); await import('node:fs/promises').then(fs => fs.writeFile('/bundle/tooling/pnpm-${pnpmVersion}.tgz', buf));"`,
    `mkdir -p /bundle/tooling/pnpm && tar -xzf /bundle/tooling/pnpm-${pnpmVersion}.tgz -C /bundle/tooling/pnpm`,
    "node /bundle/tooling/pnpm/package/bin/pnpm.cjs --version",
    "cd /bundle/workspace/tools/e011-auth-recovery && node /bundle/tooling/pnpm/package/bin/pnpm.cjs install --frozen-lockfile --ignore-scripts --store-dir /bundle/pnpm-store",
    "cd /bundle/workspace/tools/e011-auth-recovery && node /bundle/tooling/pnpm/package/bin/pnpm.cjs exec prisma -v",
    "ENGINE_PATH=$(find /bundle/workspace/tools/e011-auth-recovery/node_modules -type f \\( -name 'schema-engine' -o -name 'schema-engine*' \\) | head -n 1)",
    "test -n \"$ENGINE_PATH\"",
    "ENGINE_PLATFORM=$(basename \"$ENGINE_PATH\")",
    "mkdir -p /bundle/tooling/prisma-engines/$ENGINE_PLATFORM",
    "cp \"$ENGINE_PATH\" /bundle/tooling/prisma-engines/$ENGINE_PLATFORM/schema-engine",
    "chmod 0755 /bundle/tooling/prisma-engines/$ENGINE_PLATFORM/schema-engine",
    "sha256sum /bundle/tooling/prisma-engines/$ENGINE_PLATFORM/schema-engine > /bundle/tooling/prisma-engines/$ENGINE_PLATFORM/schema-engine.sha256",
    "npm pack better-auth@1.6.23 --pack-destination /bundle/source-retention",
    "npm pack @better-auth/prisma-adapter@1.6.23 --pack-destination /bundle/source-retention",
    "npm pack @better-auth/cli@1.4.21 --pack-destination /bundle/source-retention",
    "sha256sum /bundle/tooling/pnpm-9.15.0.tgz /bundle/source-retention/*.tgz > /bundle/checksums.sha256",
    `node --input-type=module -e "import { createHash } from 'node:crypto'; import { readdir, readFile, writeFile } from 'node:fs/promises'; import { join } from 'node:path'; const root='/bundle'; const files=[]; for (const name of (await readdir(join(root,'source-retention'))).filter((entry)=>entry.endsWith('.tgz')).sort()) { const file=join(root,'source-retention',name); files.push({ file: 'source-retention/' + name, sha256: createHash('sha256').update(await readFile(file)).digest('hex') }); } const engineDirs = await readdir(join(root,'tooling','prisma-engines')); for (const dir of engineDirs) { const engine = join(root,'tooling','prisma-engines',dir,'schema-engine'); files.push({ file: 'tooling/prisma-engines/' + dir + '/schema-engine', sha256: createHash('sha256').update(await readFile(engine)).digest('hex') }); } for (const file of ['tooling/pnpm-9.15.0.tgz','workspace/tools/e011-auth-recovery/package.json','workspace/tools/e011-auth-recovery/pnpm-lock.yaml','workspace/scripts/fixtures/e011/better-auth-core.schema.prisma']) { files.push({ file, sha256: createHash('sha256').update(await readFile(join(root, file))).digest('hex') }); } const manifest = { createdAt: new Date().toISOString(), baseImage: 'node:24-bookworm-slim', baseDigest: 'sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc', nodeVersion: process.version, pnpmVersion: '9.15.0', files }; await writeFile(join(root,'manifest.json'), JSON.stringify(manifest, null, 2));"`
  ].join(" && ");

  const result = run("docker", [
    "run",
    "--rm",
    "--network",
    "host",
    "-v",
    imageMount,
    "-v",
    bundleMount,
    `${baseImage}@${baseDigest}`,
    "bash",
    "-lc",
    prepScript
  ], { shell: false, env: { npm_config_registry: "https://registry.npmjs.org/" } });

  const lockfileChecksum = await sha256(path.join(contextRoot, "tools/e011-auth-recovery/pnpm-lock.yaml"));
  const packageChecksum = await sha256(path.join(contextRoot, "tools/e011-auth-recovery/package.json"));
  const pnpmChecksum = await sha256(path.join(bundleRoot, "tooling", `pnpm-${pnpmVersion}.tgz`));

  await writeFile(path.join(bundleRoot, "manifest.json"), JSON.stringify({
    createdAt: new Date().toISOString(),
    baseImage,
    baseDigest,
    linuxDistribution: "Debian bookworm",
    architecture: "x86_64",
    nodeVersion: process.version,
    pnpmVersion,
    baselineSha: "aac25270072e6b280f1c732723fed36e1a77f5b1",
    checkpointSha: "ba57000",
    checksums: {
      packageJson: packageChecksum,
      lockfile: lockfileChecksum,
      pnpmRuntime: pnpmChecksum
    },
    outputs: {
      workspace: "workspace/",
      pnpmStore: "pnpm-store/",
      tooling: "tooling/",
      sourceRetention: "source-retention/"
    },
    commands: {
      preparation: `docker run --rm --network host -v <repo>:/repo -v <bundle>:/bundle ${baseImage}@${baseDigest} bash -lc '<prepScript>'`
    }
  }, null, 2), "utf8");

  console.log(JSON.stringify({
    bundleRoot,
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
