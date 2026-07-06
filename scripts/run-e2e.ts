import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawnSync, spawn, type ChildProcess } from "node:child_process";
import process from "node:process";

import {
  assertNoProductionTargetInRepo,
  buildE2EChildEnv,
  createRuntimeManifest,
  createRuntimeRunId,
  resolvePlaywrightBaseUrl,
  validateRuntimeManifest
} from "./e2e-guard";
import { buildPlaywrightGrepForMode, type E2EMode, parseE2ECommandArgs } from "./e2e-command";
import { buildE021T002RuntimeLabels, validateOwnedRuntimeSnapshot } from "./docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const tmpRoot = path.join(repoRoot, ".codex-tmp");
const parsedArgs = parseE2ECommandArgs(process.argv.slice(2));
const mode: E2EMode = parsedArgs.mode;
const appBaseUrl = resolvePlaywrightBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3011");
const runtimeRunId = createRuntimeRunId();

assertNoProductionTargetInRepo(repoRoot);

const selectedArea = parsedArgs.area;
const grep = buildPlaywrightGrepForMode(mode, selectedArea);

const cleanupLog: string[] = [];
let postgres: ChildProcess | undefined;
let nextApp: ChildProcess | undefined;
let hostPort = 0;
let databaseUrl = "";
let cleanupError: Error | undefined;
const runtimeLabels = buildE021T002RuntimeLabels(runtimeRunId);
let manifest = validateRuntimeManifest(createRuntimeManifest({
  runId: runtimeRunId,
  containerName: `${runtimeRunId}-postgres`,
  networkName: `${runtimeRunId}-network`,
  hostPort: 1,
  databaseName: `clariobase_e021_t002_${runtimeRunId.replace(/-/g, "_")}`,
  appBaseUrl
}));

function run(command: string, args: string[], options?: { stdio?: "inherit" | "pipe"; env?: NodeJS.ProcessEnv }) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options?.stdio ?? "pipe",
    env: options?.env ?? process.env
  });
}

function ensureSuccess(result: ReturnType<typeof run>, label: string) {
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${(result.stderr ?? result.stdout ?? "").trim()}`);
  }
}

function freePort(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function waitForHttp(url: string, expected = 200) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "Cache-Control": "no-store" } });
      if (response.status === expected) {
        return response;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${url} did not return HTTP ${expected} in time`);
}

async function pauseBeforePlaywright() {
  const rawPause = process.env.CLARIOBASE_E2E_PAUSE_BEFORE_PLAYWRIGHT_MS;
  if (!rawPause) {
    return;
  }

  const pauseMs = Number.parseInt(rawPause, 10);
  if (!Number.isInteger(pauseMs) || pauseMs < 0) {
    throw new Error(`CLARIOBASE_E2E_PAUSE_BEFORE_PLAYWRIGHT_MS must be a non-negative integer, got ${rawPause}`);
  }

  await new Promise((resolve) => setTimeout(resolve, pauseMs));
}

async function waitForPostgres(containerName: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = docker(["exec", containerName, "pg_isready", "-U", "clariobase_e021_t002_user", "-d", manifest.databaseName]);
    if (result.status === 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("PostgreSQL did not become ready in time");
}

function docker(args: string[]) {
  return run("docker", args, { stdio: "pipe" });
}

function startPostgres() {
  hostPort = Number.parseInt((process.env.E2E_DB_PORT ?? "0"), 10);
  if (!Number.isInteger(hostPort) || hostPort <= 0) {
    hostPort = 0;
  }
  if (hostPort === 0) {
    throw new Error("host port allocation failed");
  }
}

async function main() {
  let mainError: unknown;
  if (!(await freePort(3011))) {
    throw new Error("Port 3011 is occupied");
  }

  const portProbe = net.createServer();
  portProbe.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => portProbe.once("listening", () => resolve()));
  hostPort = (portProbe.address() as net.AddressInfo).port;
  portProbe.close();

  databaseUrl = `postgresql://clariobase_e021_t002_user:clariobase_e021_t002_password@127.0.0.1:${hostPort}/${manifest.databaseName}?schema=public`;
  const childEnv = buildE2EChildEnv(process.env, manifest, databaseUrl);
  const manifestPath = path.join(tmpRoot, `${manifest.runId}.json`);
  fs.mkdirSync(tmpRoot, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, hostPort, databaseUrl }, null, 2));

  if (mode === "area") {
    // noop; supported area already validated
  }

  const containerName = manifest.containerName;
  const networkName = manifest.networkName;

  try {
    ensureSuccess(docker(["network", "create", networkName]), "docker network create");
    ensureSuccess(docker(["pull", "postgres:16"]), "docker pull postgres:16");
    ensureSuccess(docker([
      "run",
      "-d",
      "--name", containerName,
      "--label", runtimeLabels[0],
      "--label", runtimeLabels[1],
      "--label", runtimeLabels[2],
      "--network", networkName,
      "-p", `127.0.0.1:${hostPort}:5432`,
      "-e", "POSTGRES_DB=" + manifest.databaseName,
      "-e", "POSTGRES_USER=clariobase_e021_t002_user",
      "-e", "POSTGRES_PASSWORD=clariobase_e021_t002_password",
      "postgres:16"
    ]), "docker run postgres");

    const inspect = docker(["inspect", containerName]);
    ensureSuccess(inspect, "docker inspect postgres");
    validateOwnedRuntimeSnapshot({
      runId: manifest.runId,
      hostPort,
      expectedImage: "postgres:16",
      inspect: {
        container: JSON.parse(inspect.stdout)[0],
        manifest: {
          ...manifest,
          hostPort
        }
      }
    });

    await waitForPostgres(containerName);

    ensureSuccess(run(process.execPath, ["./node_modules/prisma/build/index.js", "migrate", "deploy"], { env: childEnv }), "prisma migrate deploy");

    ensureSuccess(run(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "scripts/e2e-fixture.ts", "setup"], { env: childEnv }), "fixture setup");
    ensureSuccess(run(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "scripts/e2e-fixture.ts", "verify"], { env: childEnv }), "fixture verify");

    nextApp = spawn(
      process.execPath,
      ["./node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3011"],
      { cwd: repoRoot, stdio: "inherit", env: childEnv }
    );

    const nextPid = nextApp.pid;
    const manifestWithPid = { ...manifest, nextPid };
    fs.writeFileSync(manifestPath, JSON.stringify({ ...manifestWithPid, hostPort, databaseUrl }, null, 2));

    await waitForHttp(`${appBaseUrl}/api/ready`, 200);
    await pauseBeforePlaywright();

    const playwrightCli = path.join(repoRoot, "node_modules", "@playwright", "test", "cli.js");
    const playwrightArgs = ["test", ...(grep ? ["--grep", grep] : [])];
    const playwright = spawnSync(process.execPath, [playwrightCli, ...playwrightArgs], {
      cwd: repoRoot,
      stdio: "inherit",
      env: childEnv
    });

    if (playwright.status !== 0) {
      throw new Error(`Playwright exited with status ${playwright.status}`);
    }

    cleanupLog.push("playwright-success");
  } catch (error) {
    mainError = error;
  } finally {
    if (nextApp?.pid) {
      try {
        nextApp.kill("SIGTERM");
      } catch {
        // best effort
      }
    }
    try {
      await run(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "scripts/e2e-fixture.ts", "cleanup"], { env: childEnv });
    } catch (error) {
      cleanupError = error instanceof Error ? error : new Error(String(error));
    }
    docker(["rm", "-f", containerName]);
    docker(["network", "rm", networkName]);
    fs.rmSync(manifestPath, { force: true });
    const freeAgain = await freePort(3011);
    if (!freeAgain) {
      throw new Error("Port 3011 remained occupied after cleanup");
    }
    if (cleanupError && !mainError) {
      throw cleanupError;
    }
  }

  if (mainError) {
    throw mainError;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
