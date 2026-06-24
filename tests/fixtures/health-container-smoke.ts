import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { createCleanupController } from "../../scripts/docker-test-support";

const repoRoot = path.resolve(__dirname, "../..");

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
      // Retry until the container becomes ready.
    }

    await delay(500);
  }

  throw new Error(`${url} did not return HTTP 200 in time.`);
}

async function main() {
  const readinessFile = process.argv[2];
  const imageTag = process.argv[3];
  const port = process.argv[4];
  const containerName = `health-container-smoke-${Date.now()}`;
  const cleanup = createCleanupController("health-container-smoke");
  const run = spawnSync("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    containerName,
    "-p",
    `127.0.0.1:${port}:3000`,
    "-e",
    "DATABASE_URL=postgresql://clariobase_crm_user:change-me@localhost:5432/clariobase_crm?schema=public",
    imageTag
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });

  if (run.status !== 0) {
    throw new Error(`docker run failed: ${(run.stderr ?? run.stdout ?? "").trim()}`);
  }

  const containerId = run.stdout.trim();
  cleanup.registerDockerContainer(containerName);
  cleanup.installProcessHandlers();

  process.once("SIGTERM", () => {
    process.exit(143);
  });

  fs.writeFileSync(readinessFile, JSON.stringify({ containerId, containerName, port }));

  await waitForHealth(`http://127.0.0.1:${port}/health`);
  setInterval(() => {}, 1000);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
