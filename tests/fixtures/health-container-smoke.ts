import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import {
  createCleanupController,
  DISPOSABLE_RUNTIME_PREFIX,
  reserveFreePort
} from "../../scripts/docker-test-support";

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
  const imageTag = process.argv[2];
  const port = process.argv[3] ?? await reserveFreePort();
  const containerName = `${DISPOSABLE_RUNTIME_PREFIX}health-container-smoke-${Date.now()}`;
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

  cleanup.registerDockerContainer(containerName);
  cleanup.installProcessHandlers();

  try {
    await waitForHealth(`http://127.0.0.1:${port}/health`);

    const logs = spawnSync("docker", ["logs", containerName], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe"
    });

    if (logs.status !== 0) {
      throw new Error(`docker logs failed: ${(logs.stderr ?? logs.stdout ?? "").trim()}`);
    }

    const stop = spawnSync("docker", ["stop", containerName], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe"
    });

    if (stop.status !== 0) {
      throw new Error(`docker stop failed: ${(stop.stderr ?? stop.stdout ?? "").trim()}`);
    }

    const inspect = spawnSync("docker", ["inspect", containerName], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe"
    });

    if (inspect.status === 0) {
      throw new Error("Container still exists after stop.");
    }
  } catch (error) {
    const logs = spawnSync("docker", ["logs", containerName], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe"
    });

    if (logs.status === 0 && logs.stdout) {
      console.error(logs.stdout);
    }

    throw error;
  } finally {
    spawnSync("docker", ["rm", "-f", containerName], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe"
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
