import { execFileSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const imageTag = "clariobase-ai-crm:test-verify";
const containerName = `clariobase-t002-verify-${process.pid}`;
const hostPort = "3015";
const databaseUrl =
  "postgresql://clariobase_crm_user:change-me@127.0.0.1:5432/clariobase_crm?schema=public";

function runDocker(args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return execFileSync("docker", args, {
    encoding: "utf8",
    stdio: options?.stdio ?? "pipe"
  });
}

async function waitForHealth() {
  const healthUrl = `http://127.0.0.1:${hostPort}/health`;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(healthUrl);

      if (response.status === 200) {
        return;
      }
    } catch {
      // Retry until the container is ready or the timeout is exhausted.
    }

    await delay(1000);
  }

  throw new Error("The Dockerized app did not return HTTP 200 from /health in time.");
}

function inspectImageFilesystem() {
  runDocker(
    [
      "run",
      "--rm",
      "--entrypoint",
      "sh",
      imageTag,
      "-lc",
      [
        "test ! -e /app/.env.local",
        "test ! -e /app/data/ai-exchange",
        "test ! -e /app/ai_exchange",
        "test -e /app/src/generated/prisma/client.ts",
        "test -e /app/prisma/schema.prisma",
        "test -e /app/node_modules/prisma/package.json"
      ].join(" && ")
    ],
    { stdio: "inherit" }
  );
}

async function main() {
  try {
    runDocker(["build", "-t", imageTag, "."], { stdio: "inherit" });

    runDocker(
      [
        "run",
        "-d",
        "--rm",
        "--name",
        containerName,
        "-p",
        `127.0.0.1:${hostPort}:3000`,
        "-e",
        `DATABASE_URL=${databaseUrl}`,
        imageTag
      ],
      { stdio: "inherit" }
    );

    await waitForHealth();
    inspectImageFilesystem();
  } finally {
    try {
      runDocker(["rm", "-f", containerName], { stdio: "inherit" });
    } catch {
      // The container may already be gone when cleanup runs.
    }

    try {
      runDocker(["image", "rm", imageTag], { stdio: "inherit" });
    } catch {
      // Leave cleanup best-effort so earlier failures remain visible.
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
