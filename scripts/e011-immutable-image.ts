import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

import { createCleanupController, VERIFY_IMAGE_TAG_PREFIX } from "./docker-test-support";

type ProcResult = ReturnType<typeof spawnSync>;

const repoRoot = process.cwd();
const t013Mode = process.argv[2] === "--t013";

if (!t013Mode) {
  throw new Error("T013 mode required");
}

function runT013(command: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
    shell: false,
    maxBuffer: 1024 * 1024 * 32
  });
}

function mustT013(result: ProcResult, phase: string) {
  if (result.status !== 0) throw new Error(`${phase} failed with exit code ${result.status ?? "unknown"}`);
  return result.stdout.trim();
}

async function waitForT013Health(containerName: string) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const result = runT013("docker", ["inspect", "--format", "{{.State.Health.Status}}", containerName]);
    if (result.status === 0 && result.stdout.trim() === "healthy") return;
    await delay(1000);
  }
  throw new Error("T013 application did not become healthy");
}

async function t013ImmutableRollbackMain() {
  const project = process.argv[3];
  const envPath = process.argv[4];
  const originalImageId = process.argv[5];
  const sourceSha = process.argv[6];
  if (!project || !envPath || !originalImageId || !sourceSha) {
    throw new Error("T013 immutable rollback arguments are required");
  }

  assert.match(project, /^clariobase-e014-runtime-t013-private-https-/);
  assert.match(originalImageId, /^sha256:[a-f0-9]{64}$/);
  assert.match(sourceSha, /^[a-f0-9]{40}$/);

  const upgradeTag = `${VERIFY_IMAGE_TAG_PREFIX}${project}-upgrade`;
  const cleanup = createCleanupController("e011-immutable-image:t013");
  cleanup.installProcessHandlers();
  cleanup.registerDockerImage(upgradeTag);

  const composeArgs = [
    "compose", "--project-name", project, "--env-file", envPath,
    "-f", "compose.yaml", "-f", "compose.private-https.yaml"
  ];
  const runCompose = (appImage: string, args: string[], env: Record<string, string> = {}) =>
    runT013("docker", [...composeArgs, ...args], { ...env, CRM_PRIVATE_APP_IMAGE: appImage });

  let mainError: unknown;
  try {
    // prove exact-image upgrade and rollback
    const originalInspect = mustT013(runT013("docker", [
      "image", "inspect", originalImageId, "--format",
      "{{.Id}} {{index .Config.Labels \"io.clariobase.source-sha\"}} {{index .Config.Labels \"io.clariobase.image-variant\"}}"
    ]), "inspect original image");
    assert.match(originalInspect, new RegExp(`^${originalImageId.replace(":", "\\:")} ${sourceSha} validated$`));

    const postgresVolumeBefore = mustT013(runT013("docker", [
      "inspect", "--format", "{{range .Mounts}}{{if eq .Destination \"/var/lib/postgresql/data\"}}{{.Name}}{{end}}{{end}}",
      `${project}-crm-postgres-1`
    ]), "inspect original PostgreSQL volume");
    assert.ok(postgresVolumeBefore);

    mustT013(runT013("docker", [
      "build", "--build-arg", `CRM_SOURCE_SHA=${sourceSha}`, "--build-arg", "CRM_IMAGE_VARIANT=upgrade-proof",
      "--label", `io.clariobase.source-sha=${sourceSha}`, "--label", "io.clariobase.image-variant=upgrade-proof",
      "-t", upgradeTag, "."
    ]), "build upgrade image");
    const upgradeImageId = mustT013(runT013("docker", ["image", "inspect", upgradeTag, "--format", "{{.Id}}"]), "inspect upgrade image");
    assert.match(upgradeImageId, /^sha256:[a-f0-9]{64}$/);
    assert.notEqual(upgradeImageId, originalImageId);

    mustT013(runCompose(upgradeImageId, ["up", "-d", "--no-deps", "--force-recreate", "--no-build", "--pull", "never", "crm-app"]), "upgrade application");
    await waitForT013Health(`${project}-crm-app-1`);
    const runningUpgrade = mustT013(runT013("docker", ["inspect", "--format", "{{.Image}}", `${project}-crm-app-1`]), "inspect running upgrade");
    assert.equal(runningUpgrade, upgradeImageId);

    const sessionFixture = path.join(repoRoot, "scripts/fixtures/e011/t013-verify-session.ts").replace(/\\/g, "/");
    mustT013(runCompose(upgradeImageId, [
      "run", "--rm", "-v", `${sessionFixture}:/proof/session.ts:ro`, "-e", "T013_USER_COOKIE",
      "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/session.ts"
    ], { T013_USER_COOKIE: process.env.T013_USER_COOKIE ?? "" }), "verify auth after upgrade");

    mustT013(runCompose(originalImageId, ["up", "-d", "--no-deps", "--force-recreate", "--no-build", "--pull", "never", "crm-app"]), "roll back application");
    await waitForT013Health(`${project}-crm-app-1`);
    const runningRollback = mustT013(runT013("docker", ["inspect", "--format", "{{.Image}}", `${project}-crm-app-1`]), "inspect rollback image");
    assert.equal(runningRollback, originalImageId);
    mustT013(runCompose(originalImageId, [
      "run", "--rm", "-v", `${sessionFixture}:/proof/session.ts:ro`, "-e", "T013_USER_COOKIE",
      "crm-app", "node", "./node_modules/tsx/dist/cli.mjs", "/proof/session.ts"
    ], { T013_USER_COOKIE: process.env.T013_USER_COOKIE ?? "" }), "verify auth after rollback");

    const postgresVolumeAfter = mustT013(runT013("docker", [
      "inspect", "--format", "{{range .Mounts}}{{if eq .Destination \"/var/lib/postgresql/data\"}}{{.Name}}{{end}}{{end}}",
      `${project}-crm-postgres-1`
    ]), "inspect rollback PostgreSQL volume");
    assert.equal(postgresVolumeAfter, postgresVolumeBefore);

    console.log(JSON.stringify({
      result: "PASS",
      sourceSha,
      originalImageId,
      upgradeImageId,
      rollbackImageId: runningRollback,
      postgresVolumePreserved: true,
      authAfterUpgrade: true,
      authAfterRollback: true,
      readinessAfterRollback: true,
      repositoryDigest: "not applicable for local unpushed image"
    }));
  } catch (error) {
    mainError = error;
  }

  const cleanupReport = cleanup.cleanup(mainError ? "failed T013 rollback proof" : "successful T013 rollback proof");
  if (mainError) throw mainError;
  if (cleanupReport.failures.length > 0) throw new Error("T013 rollback image cleanup failed");
}

async function main() {
  await t013ImmutableRollbackMain();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
