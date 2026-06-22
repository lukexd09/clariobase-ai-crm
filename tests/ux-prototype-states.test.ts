import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { reserveFreePort, terminateProcessTree } from "../scripts/docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

function build() {
  const result = spawnSync(process.execPath, [nextCli, "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://clariobase_crm_user:clariobase_test_password@localhost:5432/clariobase_crm?schema=public"
    }
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
}

async function waitForPage(url: string) {
  const started = Date.now();
  while (Date.now() - started < 60000) {
    try {
      const response = await fetch(url);
      if (response.status === 200) return response;
    } catch {
      // retry
    }
    await delay(500);
  }
  throw new Error(`${url} did not become ready`);
}

test("ux prototype renders key review states without a database", { timeout: 180000 }, async () => {
  build();
  const port = await reserveFreePort();
  const child = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://clariobase_crm_user:clariobase_test_password@localhost:5432/clariobase_crm?schema=public"
    }
  });

  let output = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));

  try {
    const routes = [
      "/ux-prototype",
      "/ux-prototype/dashboard?state=loading",
      "/ux-prototype/daily-work?state=empty",
      "/ux-prototype/leads?state=stress",
      "/ux-prototype/leads/lead-aurora-bikes?state=success",
      "/ux-prototype/import-batches/batch-2026-06-21",
      "/ux-prototype/duplicate-candidates/dup-aurora-bikes",
      "/ux-prototype/system-status"
    ];

    for (const route of routes) {
      const response = await waitForPage(`http://127.0.0.1:${port}${route}`);
      const html = await response.text();
      assert.match(html, /UX prototype — no data is saved/);
      assert.match(html, /<main/i);
      assert.match(html, /noindex/i);
      assert.doesNotMatch(html, /PrismaClient|postgresql|route handlers|server actions/i);
    }
  } finally {
    terminateProcessTree(child.pid ?? 0);
  }

  assert.doesNotMatch(output, /Failed to compile|Type error/i);
});

