import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { reserveFreePort, terminateProcessTree } from "../scripts/docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

function extractTimestamp(html: string) {
  const timestamp = html.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);

  assert.ok(timestamp, "health page should include an ISO timestamp");
  return timestamp[0];
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
  const child = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", "127.0.0.1", "--port", port],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  const childPid = child.pid ?? 0;

  assert.ok(childPid > 0, "Next.js dev server PID should be available");

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
    terminateProcessTree(childPid);
    child.removeAllListeners();
  }
});
