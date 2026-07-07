import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { createCleanupController, reserveFreePort, terminateProcessTree } from "../scripts/docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

function buildCommand() {
  return process.platform === "win32"
    ? { command: "cmd.exe", args: ["/d", "/s", "/c", "corepack pnpm build"] }
    : { command: "corepack", args: ["pnpm", "build"] };
}

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

function buildProductionApp() {
  fs.rmSync(path.join(repoRoot, ".next"), { recursive: true, force: true });

  const { command, args } = buildCommand();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "test-only-better-auth-secret-32-chars-minimum",
      BETTER_AUTH_TELEMETRY: "0",
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://clariobase_crm_user:clariobase_test_password@localhost:5432/clariobase_crm?schema=public"
    }
  });

  assert.equal(result.status, 0, `pnpm build should pass: ${result.stderr ?? result.stdout}`);
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
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
        BETTER_AUTH_SECRET:
          process.env.BETTER_AUTH_SECRET ?? "test-only-better-auth-secret-32-chars-minimum",
        BETTER_AUTH_TELEMETRY: "0",
        DATABASE_URL:
          process.env.DATABASE_URL ??
          "postgresql://clariobase_crm_user:clariobase_test_password@localhost:5432/clariobase_crm?schema=public"
      }
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
