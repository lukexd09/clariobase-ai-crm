import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const bundleRoot = process.argv[2];
const runnerImage = process.argv[3];
if (!bundleRoot || !runnerImage) {
  throw new Error("bundle root and runner image arguments required");
}

function run(command: string, args: string[]) {
  return spawnSync(command, args, { encoding: "utf8", shell: false });
}

async function main() {
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
