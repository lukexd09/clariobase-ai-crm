import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
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

type RuntimeCase = {
  name: "preview" | "production" | "missing" | "invalid" | "padded-production";
  deploymentEnv?: string;
  expectIndicator: boolean;
};

type RuntimeCaseEvidence = RuntimeCase & {
  containerName: string;
  hostPort: string;
  readiness: string;
  route: string;
  banner: "present" | "absent";
  markCount: number;
};

const runtimeCases: RuntimeCase[] = [
  { name: "preview", deploymentEnv: "preview", expectIndicator: true },
  { name: "production", deploymentEnv: "production", expectIndicator: false },
  { name: "missing", expectIndicator: true },
  { name: "invalid", deploymentEnv: "prod", expectIndicator: true },
  { name: "padded-production", deploymentEnv: " production ", expectIndicator: true }
];

const runId = createDockerRunId("env-proof");
const imageTag = `clariobase-ai-crm:test-verify-${runId}`;
const networkName = `${runId}-network`;
const volumeName = `${runId}-postgres-data`;
const databaseContainerName = `${runId}-db`;
const databaseName = "clariobase_crm_environment_proof";
const databaseUser = "clariobase_environment_proof";
const databasePassword = randomBytes(24).toString("hex");
const databaseUrl =
  `postgresql://${databaseUser}:${databasePassword}@${databaseContainerName}:5432/${databaseName}?schema=public`;
const appContainerNames = new Map(
  runtimeCases.map((runtimeCase) => [runtimeCase.name, `${runId}-${runtimeCase.name}`])
);
const cleanup = createCleanupController("docker:test-environment-runtime");
const buildCommand = `docker build --target runtime --tag ${imageTag} --label io.clariobase.source-sha=<source-sha> .`;
const bannerText = "TEST ENVIRONMENT — data in this environment may be reset or deleted.";
const watermarkPattern = /<span[^>]*>\s*TEST\s*<\/span>/g;

let buildCount = 0;

function runCommand(command: string, args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: options?.stdio ?? "pipe"
  });
}

function runDocker(args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return runCommand("docker", args, options);
}

function assertCommandSuccess(
  result: ReturnType<typeof runCommand>,
  description: string
) {
  assert.equal(
    result.status,
    0,
    `${description} should pass: ${(result.stderr ?? result.stdout ?? "").trim()}`
  );
}

function commandOutput(command: string, args: string[], description: string) {
  const result = runCommand(command, args);
  assertCommandSuccess(result, description);
  return (result.stdout ?? "").trim();
}

function dockerOutput(args: string[], description: string) {
  return commandOutput("docker", args, description);
}

function inspectImageId(reference: string) {
  return dockerOutput(
    ["image", "inspect", "--format", "{{.Id}}", reference],
    `inspect image identity for ${reference}`
  );
}

function assertSameImageIdentity(imageId: string, context: string) {
  assert.equal(inspectImageId(imageTag), imageId, `${context}: image tag must resolve to the original image ID`);
  assert.equal(inspectImageId(imageId), imageId, `${context}: immutable image ID must remain inspectable`);
}

function inspectRepoDigests() {
  const raw = dockerOutput(
    ["image", "inspect", "--format", "{{json .RepoDigests}}", imageTag],
    "inspect image repository digests"
  );
  const digests = JSON.parse(raw) as string[] | null;

  return digests && digests.length > 0
    ? digests.join(",")
    : "unavailable (local daemon build has no repository digest)";
}

async function waitForDatabase() {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const result = runDocker([
      "exec",
      databaseContainerName,
      "pg_isready",
      "-U",
      databaseUser,
      "-d",
      databaseName
    ]);

    if (result.status === 0) {
      return;
    }

    await delay(1000);
  }

  throw new Error("The disposable environment-proof PostgreSQL container did not become ready in time.");
}

async function waitForRuntimeReadiness(hostPort: string) {
  const readinessUrl = `http://127.0.0.1:${hostPort}/api/ready`;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(readinessUrl, {
        headers: { "Cache-Control": "no-store" }
      });

      if (response.status === 200) {
        const payload = await response.json() as {
          status?: string;
          checks?: { database?: string };
        };

        assert.equal(payload.status, "ready");
        assert.equal(payload.checks?.database, "ok");
        return "HTTP 200; status=ready; database=ok";
      }
    } catch {
      // Retry until the production server and disposable database are ready.
    }

    await delay(1000);
  }

  throw new Error(`The Dockerized app on disposable port ${hostPort} did not become ready in time.`);
}

async function fetchRenderedHealthRoute(hostPort: string) {
  const routeUrl = `http://127.0.0.1:${hostPort}/health`;
  const response = await fetch(routeUrl, {
    headers: { "Cache-Control": "no-store" }
  });
  const html = await response.text();

  assert.equal(response.status, 200, "The representative server-rendered route should return HTTP 200.");
  assert.match(html, /<h1[^>]*>\s*Health check\s*<\/h1>/s, "The response must be the real /health route HTML.");

  return html;
}

function inspectContainerEnvironment(containerName: string) {
  const raw = dockerOutput(
    ["inspect", "--format", "{{json .Config.Env}}", containerName],
    `inspect runtime environment for ${containerName}`
  );
  return JSON.parse(raw) as string[];
}

function assertRuntimeEnvironment(containerName: string, runtimeCase: RuntimeCase) {
  const environment = inspectContainerEnvironment(containerName);
  const deploymentEntries = environment.filter((entry) => entry.startsWith("CRM_DEPLOYMENT_ENV="));

  if (runtimeCase.deploymentEnv === undefined) {
    assert.deepEqual(deploymentEntries, [], "Missing configuration case must omit CRM_DEPLOYMENT_ENV.");
    return;
  }

  assert.deepEqual(
    deploymentEntries,
    [`CRM_DEPLOYMENT_ENV=${runtimeCase.deploymentEnv}`],
    `${runtimeCase.name} must receive exactly the requested runtime deployment environment.`
  );
}

function assertContainerUsesImage(containerName: string, imageId: string, hostPort: string) {
  const containerImageId = dockerOutput(
    ["inspect", "--format", "{{.Image}}", containerName],
    `inspect container image for ${containerName}`
  );
  const configuredImageReference = dockerOutput(
    ["inspect", "--format", "{{.Config.Image}}", containerName],
    `inspect configured image reference for ${containerName}`
  );
  const publishedPort = dockerOutput(
    ["port", containerName, "3000/tcp"],
    `inspect published route for ${containerName}`
  );

  assert.equal(containerImageId, imageId, `${containerName} must run the original image ID.`);
  assert.equal(configuredImageReference, imageId, `${containerName} must be started by immutable image ID, not tag.`);
  assert.equal(publishedPort, `127.0.0.1:${hostPort}`, `${containerName} must own the fetched localhost route.`);
}

function assertMarkers(html: string, runtimeCase: RuntimeCase) {
  const bannerPresent = html.includes(bannerText);
  const markCount = Array.from(html.matchAll(watermarkPattern)).length;

  assert.equal(
    bannerPresent,
    false,
    `${runtimeCase.name}: warning banner must be removed entirely.`
  );
  assert.equal(
    markCount,
    runtimeCase.expectIndicator ? 8 : 0,
    `${runtimeCase.name}: repeated TEST watermark count should match the fail-safe environment contract.`
  );

  return {
    banner: bannerPresent ? "present" : "absent",
    markCount
  } as const;
}

function removeCaseContainer(containerName: string) {
  const result = runDocker(["rm", "-f", containerName]);
  assertCommandSuccess(result, `remove completed runtime case ${containerName}`);
}

function dockerResourceExists(kind: "container" | "network" | "volume" | "image", name: string) {
  const argsByKind = {
    container: ["container", "inspect", name],
    network: ["network", "inspect", name],
    volume: ["volume", "inspect", name],
    image: ["image", "inspect", name]
  };

  return runDocker(argsByKind[kind]).status === 0;
}

function assertCleanupComplete() {
  for (const containerName of [databaseContainerName, ...appContainerNames.values()]) {
    assert.equal(dockerResourceExists("container", containerName), false, `Container cleanup failed for ${containerName}.`);
  }
  assert.equal(dockerResourceExists("network", networkName), false, `Network cleanup failed for ${networkName}.`);
  assert.equal(dockerResourceExists("volume", volumeName), false, `Volume cleanup failed for ${volumeName}.`);
  assert.equal(dockerResourceExists("image", imageTag), false, `Image tag cleanup failed for ${imageTag}.`);
}

function runMigrations(imageId: string) {
  assertSameImageIdentity(imageId, "before disposable database migration");
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
      imageId,
      "-lc",
      "node ./node_modules/prisma/build/index.js migrate deploy"
    ],
    { stdio: "inherit" }
  );
  assertCommandSuccess(result, "run migrations from the immutable application image");
}

async function runRuntimeCase(runtimeCase: RuntimeCase, imageId: string): Promise<RuntimeCaseEvidence> {
  assertSameImageIdentity(imageId, `before ${runtimeCase.name} case`);

  const containerName = appContainerNames.get(runtimeCase.name);
  assert.ok(containerName, `A disposable container name must exist for ${runtimeCase.name}.`);
  const hostPort = await reserveFreePort();
  const args = [
    "run",
    "-d",
    "--name",
    containerName,
    "--network",
    networkName,
    "-p",
    `127.0.0.1:${hostPort}:3000`,
    "-e",
    `DATABASE_URL=${databaseUrl}`
  ];

  if (runtimeCase.deploymentEnv !== undefined) {
    args.push("-e", `CRM_DEPLOYMENT_ENV=${runtimeCase.deploymentEnv}`);
  }

  args.push(imageId);
  const startResult = runDocker(args);
  assertCommandSuccess(startResult, `start ${runtimeCase.name} runtime case`);

  assertContainerUsesImage(containerName, imageId, hostPort);
  assertRuntimeEnvironment(containerName, runtimeCase);
  const readiness = await waitForRuntimeReadiness(hostPort);
  const html = await fetchRenderedHealthRoute(hostPort);
  const markers = assertMarkers(html, runtimeCase);

  removeCaseContainer(containerName);

  return {
    ...runtimeCase,
    containerName,
    hostPort,
    readiness,
    route: `/health HTTP 200; fingerprint=Health check; source=${containerName}`,
    ...markers
  };
}

async function main() {
  if (!ensureDockerOrReportSkip("docker:test-environment-runtime")) {
    return;
  }

  cleanup.installProcessHandlers();
  cleanup.registerDockerImage(imageTag);
  cleanup.registerDockerNetwork(networkName);
  cleanup.registerDockerVolume(volumeName);
  cleanup.registerDockerContainer(databaseContainerName);
  for (const containerName of appContainerNames.values()) {
    cleanup.registerDockerContainer(containerName);
  }

  let mainError: unknown;
  let sourceSha = "";
  let imageId = "";
  let imageDigest = "";
  let databaseContainerId = "";
  let buildStartedAt = "";
  let buildCompletedAt = "";
  const caseEvidence: RuntimeCaseEvidence[] = [];

  try {
    assert.ok(databaseContainerName.length <= 63, "Disposable database name must remain a valid Docker DNS label.");
    sourceSha = commandOutput("git", ["rev-parse", "HEAD"], "resolve source Git SHA");
    buildStartedAt = new Date().toISOString();
    buildCount += 1;
    const buildResult = runDocker(
      [
        "build",
        "--target",
        "runtime",
        "--tag",
        imageTag,
        "--label",
        `io.clariobase.source-sha=${sourceSha}`,
        "."
      ],
      { stdio: "inherit" }
    );
    assertCommandSuccess(buildResult, "single application image build");
    buildCompletedAt = new Date().toISOString();
    assert.equal(buildCount, 1, "The application image must be built exactly once.");

    imageId = inspectImageId(imageTag);
    assert.match(imageId, /^sha256:[a-f0-9]{64}$/, "Docker image ID must be a content-addressed sha256 identity.");
    imageDigest = inspectRepoDigests();
    assertSameImageIdentity(imageId, "after the single build");

    let result = runDocker(["network", "create", networkName]);
    assertCommandSuccess(result, "create disposable environment-proof network");
    result = runDocker(["volume", "create", volumeName]);
    assertCommandSuccess(result, "create disposable environment-proof database volume");
    result = runDocker([
      "run",
      "-d",
      "--name",
      databaseContainerName,
      "--network",
      networkName,
      "--mount",
      `type=volume,source=${volumeName},target=/var/lib/postgresql/data`,
      "-e",
      `POSTGRES_DB=${databaseName}`,
      "-e",
      `POSTGRES_USER=${databaseUser}`,
      "-e",
      `POSTGRES_PASSWORD=${databasePassword}`,
      "postgres:16"
    ]);
    assertCommandSuccess(result, "start disposable environment-proof PostgreSQL");
    databaseContainerId = (result.stdout ?? "").trim();
    assert.match(databaseContainerId, /^[a-f0-9]{64}$/, "Disposable database container ID should be recorded.");

    await waitForDatabase();
    runMigrations(imageId);

    for (const runtimeCase of runtimeCases) {
      caseEvidence.push(await runRuntimeCase(runtimeCase, imageId));
    }

    assertSameImageIdentity(imageId, "after all runtime cases");
    assert.equal(buildCount, 1, "No hidden application image rebuild may occur between runtime cases.");
  } catch (error) {
    mainError = error;
  }

  const cleanupReport = cleanup.cleanup(mainError ? "failed verification" : "successful verification");

  if (!mainError && cleanupReport.failures.length === 0) {
    try {
      assertCleanupComplete();
    } catch (error) {
      mainError = error;
    }
  }

  if (mainError) {
    throw createVerificationFailure(mainError, cleanupReport.failures, "docker:test-environment-runtime");
  }

  if (cleanupReport.failures.length > 0) {
    throw new Error(formatCleanupFailures(cleanupReport.failures));
  }

  console.log("E016.T014 same-image runtime evidence");
  console.log(`source_sha=${sourceSha}`);
  console.log(`build_command=${buildCommand.replace("<source-sha>", sourceSha)}`);
  console.log(`build_started_at=${buildStartedAt}`);
  console.log(`build_completed_at=${buildCompletedAt}`);
  console.log("dockerfile=./Dockerfile; target=runtime");
  console.log(`image_tag=${imageTag} (reference only)`);
  console.log(`image_id=${imageId}`);
  console.log(`image_digest=${imageDigest}`);
  console.log("identity_method=tag and immutable ID inspected before every case and after all cases; every docker run used image ID");
  console.log(`build_count=${buildCount}`);
  console.log(`network=${networkName}`);
  console.log(`database_container=${databaseContainerName}`);
  console.log(`database_container_id=${databaseContainerId}`);
  console.log(`database_name=${databaseName}`);
  console.log(`database_volume=${volumeName}`);
  for (const evidence of caseEvidence) {
    console.log(
      `case=${evidence.name}; container=${evidence.containerName}; port=${evidence.hostPort}; env=${evidence.deploymentEnv ?? "omitted"}; readiness=${evidence.readiness}; route=${evidence.route}; banner=${evidence.banner}; mark_count=${evidence.markCount}; image_id_match=true`
    );
  }
  console.log("cleanup=PASS; disposable containers, network, database volume, and image tag absent");
  reportVerificationStatus("PASS", "E016.T014 reused one immutable application image for all runtime cases.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
