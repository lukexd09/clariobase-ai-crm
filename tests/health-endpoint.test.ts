import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { createCleanupController, reserveFreePort, terminateProcessTree } from "../scripts/docker-test-support";
import { createRepoTmpDir } from "./test-helpers";

const repoRoot = path.resolve(__dirname, "..");
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

function extractTimestamp(html: string) {
  const timestamp = html.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);

  assert.ok(timestamp, "health page should include an ISO timestamp");
  return timestamp[0];
}

function processExists(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForHealth(url: string, timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-store"
        }
      });

      if (response.status === 200) {
        return response;
      }
    } catch {
      // Retry until the production server becomes ready.
    }

    await delay(500);
  }

  throw new Error(`${url} did not return HTTP 200 in time.`);
}

async function waitForFile(filePath: string, timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(filePath)) {
      return;
    }

    await delay(250);
  }

  throw new Error(`${filePath} was not created in time.`);
}

async function waitForChildExit(child: ReturnType<typeof spawn>) {
  return await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
    child.once("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });
}

function buildProductionApp() {
  fs.rmSync(path.join(repoRoot, ".next"), { recursive: true, force: true });

  const result = spawnSync(process.execPath, [nextCli, "build"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `next build should pass: ${result.stderr ?? result.stdout}`);
  assert.ok(fs.existsSync(path.join(repoRoot, ".next", "BUILD_ID")), "next build should create a production BUILD_ID");
}

test("health endpoint is non-cacheable and returns a fresh timestamp on every request in production mode", { timeout: 180000 }, async () => {
  buildProductionApp();

  const port = await reserveFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const cleanup = createCleanupController("health-endpoint-test");
  const child = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", "127.0.0.1", "--port", port],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  const childPid = child.pid ?? 0;

  assert.ok(childPid > 0, "Next.js server PID should be available");
  cleanup.registerProcessTree(childPid);
  cleanup.installProcessHandlers();

  let output = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });

  try {
    const firstResponse = await waitForHealth(`${baseUrl}/health`);
    const firstHtml = await firstResponse.text();
    const firstTimestamp = extractTimestamp(firstHtml);

    assert.equal(firstResponse.status, 200);
    assert.match(firstResponse.headers.get("cache-control") ?? "", /no-store/i);
    assert.doesNotMatch(firstResponse.headers.get("x-nextjs-cache") ?? "", /HIT/i);

    await delay(25);

    const secondResponse = await waitForHealth(`${baseUrl}/health`);
    const secondHtml = await secondResponse.text();
    const secondTimestamp = extractTimestamp(secondHtml);

    assert.equal(secondResponse.status, 200);
    assert.match(secondResponse.headers.get("cache-control") ?? "", /no-store/i);
    assert.notEqual(secondTimestamp, firstTimestamp, "health timestamp should be fresh on every request");
  } finally {
    cleanup.cleanup("test completion");
    terminateProcessTree(childPid);
    child.removeAllListeners();
  }
});

test("health endpoint cleanup controller reaps next start on SIGTERM interruption", { timeout: 180000 }, async () => {
  buildProductionApp();

  const readinessFile = path.join(createRepoTmpDir(repoRoot, "health-next-start-"), `health-next-start-${Date.now()}.json`);
  const fixture = path.join(repoRoot, "tests", "fixtures", "health-next-start-smoke.ts");
  const child = spawn(process.execPath, [path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs"), fixture, readinessFile], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });

  try {
    await waitForFile(readinessFile);
    const payload = JSON.parse(fs.readFileSync(readinessFile, "utf8")) as { childPid: number };

    assert.ok(Number.isInteger(payload.childPid) && payload.childPid > 0, "child PID should be discoverable");
    assert.equal(processExists(payload.childPid), true);

    child.kill("SIGTERM");
    const result = await waitForChildExit(child);
    terminateProcessTree(child.pid ?? 0);

    assert.ok(result.signal === "SIGTERM" || result.code === 143, "fixture should exit from SIGTERM cleanup");
    assert.equal(processExists(payload.childPid), false, output);
  } finally {
    fs.rmSync(readinessFile, { force: true });
    terminateProcessTree(child.pid ?? 0);
    child.removeAllListeners();
  }
});
