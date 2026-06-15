import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { createCleanupController, reserveFreePort } from "../../scripts/docker-test-support";

const repoRoot = path.resolve(__dirname, "../..");
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

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
        return;
      }
    } catch {
      // Retry until the production server becomes ready.
    }

    await delay(500);
  }

  throw new Error(`${url} did not return HTTP 200 in time.`);
}

async function main() {
  const readinessFile = process.argv[2];
  const cleanup = createCleanupController("health-next-start-smoke");
  const port = await reserveFreePort();
  const child = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", "127.0.0.1", "--port", port],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  cleanup.registerProcessTree(child.pid ?? 0);
  cleanup.installProcessHandlers();

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});

  await waitForHealth(`http://127.0.0.1:${port}/health`);
  fs.writeFileSync(readinessFile, JSON.stringify({ childPid: child.pid, port }));

  setInterval(() => {}, 1000);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
