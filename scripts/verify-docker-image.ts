import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import {
  createCleanupController,
  createDockerRunId,
  createVerificationFailure,
  ensureDockerOrReportSkip,
  formatCleanupFailures,
  reportVerificationStatus,
  reserveFreePort
} from "./docker-test-support";

const runId = createDockerRunId("image");
const imageTag = `clariobase-ai-crm:test-verify-${runId}`;
const networkName = `${runId}-network`;
const databaseContainerName = `${runId}-db`;
const containerName = `${runId}-verify`;
const databaseName = "clariobase_crm";
const databaseUser = "clariobase_crm_user";
const databasePassword = "change-me";
const cleanup = createCleanupController("docker:test-image");
let hostPort = "";

const databaseUrl =
  `postgresql://${databaseUser}:${databasePassword}@${databaseContainerName}:5432/${databaseName}?schema=public`;

function runDocker(args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return spawnSync("docker", args, {
    encoding: "utf8",
    stdio: options?.stdio ?? "pipe"
  });
}

function assertDockerSuccess(
  result: ReturnType<typeof runDocker>,
  description: string
) {
  assert.equal(result.status, 0, `${description} should pass: ${(result.stderr ?? result.stdout ?? "").trim()}`);
}

async function waitForHealth() {
  const healthUrl = `http://127.0.0.1:${hostPort}/health`;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(healthUrl, {
        headers: {
          "Cache-Control": "no-store"
        }
      });

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

async function waitForImportsPage() {
  const importsUrl = `http://127.0.0.1:${hostPort}/imports`;
  const readyBaseUrl = `http://127.0.0.1:${hostPort}`;

  for (let attempt = 0; attempt < 45; attempt += 1) {
    try {
      const manualResponse = await fetch(importsUrl, {
        redirect: "manual",
        headers: {
          "Cache-Control": "no-store"
        }
      });

      if ([302, 303, 307, 308].includes(manualResponse.status)) {
        const location = manualResponse.headers.get("location") ?? "";
        const resolvedLocation = new URL(location, readyBaseUrl).pathname;
        assert.equal(resolvedLocation, "/sign-in");
        return;
      }

      if (manualResponse.status === 200) {
        const body = await manualResponse.text();
        assert.doesNotMatch(body, /Lead CRM|Import batches|Duplicate review|Sales reporting/i);
        assert.match(body, /sign in|sign-in|protected by better auth/i);
        return;
      }
    } catch {
      // Retry until the container is ready or the timeout is exhausted.
    }

    await delay(1000);
  }

  throw new Error("The Dockerized app did not satisfy the protected /imports contract in time.");
}

async function waitForDatabase() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = runDocker(
      [
        "exec",
        databaseContainerName,
        "pg_isready",
        "-U",
        databaseUser,
        "-d",
        databaseName
      ],
      { stdio: "inherit" }
    );

    if (result.status === 0) {
      return;
    }

    await delay(1000);
  }

  throw new Error("The disposable PostgreSQL container did not become ready in time.");
}

function runMigrations() {
  const result = runDocker(
    [
      "run",
      "--rm",
      "--network",
      networkName,
      "-e",
      `DATABASE_URL=${databaseUrl}`,
      "--entrypoint",
      "sh",
      imageTag,
      "-lc",
      "node ./node_modules/prisma/build/index.js migrate deploy"
    ],
    { stdio: "inherit" }
  );

  assertDockerSuccess(result, "docker run migration command");
}

function inspectImageFilesystem() {
  const result = runDocker(
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
        "test -e /app/scripts/export-ai-leads.ts",
        "test -e /app/scripts/import-leads.ts",
        "test -e /app/scripts/detect-duplicates.ts",
        "test -e /app/scripts/validate-ai-import-file.ts",
        "test -e /app/tsconfig.json",
        "test -e /app/src/lib/import-contract.ts",
        "test -e /app/src/generated/prisma/client.ts",
        "test -e /app/prisma/schema.prisma",
        "test -e /app/node_modules/prisma/package.json"
      ].join(" && ")
    ],
    { stdio: "inherit" }
  );

  assertDockerSuccess(result, "image filesystem inspection");
}

async function main() {
  if (!ensureDockerOrReportSkip("docker:test-image")) {
    return;
  }

  cleanup.installProcessHandlers();
  cleanup.registerDockerImage(imageTag);
  cleanup.registerDockerNetwork(networkName);
  cleanup.registerDockerContainer(databaseContainerName);
  cleanup.registerDockerContainer(containerName);

  hostPort = await reserveFreePort();

  let mainError: unknown;

  try {
    let result = runDocker(["build", "-t", imageTag, "."], { stdio: "inherit" });
    assertDockerSuccess(result, "docker build");

    result = runDocker(["network", "create", networkName], { stdio: "inherit" });
    assertDockerSuccess(result, "docker network create");

    result = runDocker(
      [
        "run",
        "-d",
        "--rm",
        "--name",
        databaseContainerName,
        "--network",
        networkName,
        "-e",
        `POSTGRES_DB=${databaseName}`,
        "-e",
        `POSTGRES_USER=${databaseUser}`,
        "-e",
        `POSTGRES_PASSWORD=${databasePassword}`,
        "postgres:16"
      ],
      { stdio: "inherit" }
    );
    assertDockerSuccess(result, "docker run postgres");

    await waitForDatabase();
    runMigrations();

    result = runDocker(
      [
        "run",
        "-d",
        "--rm",
        "--name",
        containerName,
        "--network",
        networkName,
        "-p",
        `127.0.0.1:${hostPort}:3000`,
        "-e",
        `DATABASE_URL=${databaseUrl}`,
        "-e",
        `BETTER_AUTH_URL=http://127.0.0.1:${hostPort}`,
        "-e",
        "BETTER_AUTH_SECRET=better-auth-image-test-secret-better-auth-image-test-secret",
        imageTag
      ],
      { stdio: "inherit" }
    );
    assertDockerSuccess(result, "docker run app");

    await waitForHealth();
    await waitForImportsPage();
    inspectImageFilesystem();
  } catch (error) {
    mainError = error;
  }

  const cleanupReport = cleanup.cleanup(mainError ? "failed verification" : "successful verification");

  if (mainError) {
    throw createVerificationFailure(mainError, cleanupReport.failures, "docker:test-image");
  }

  if (cleanupReport.failures.length > 0) {
    throw new Error(formatCleanupFailures(cleanupReport.failures));
  }

  reportVerificationStatus("PASS", `docker:test-image completed for ${imageTag} on 127.0.0.1:${hostPort}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
