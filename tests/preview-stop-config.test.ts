import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(__dirname, "..");
const stopEnvFilePath = path.join(repoRoot, ".env.compose.preview.stop.example");
const stopOnlyImageRef = "ghcr.io/lukexd09/clariobase-ai-crm@sha256:0000000000000000000000000000000000000000000000000000000000000000";

function hasDocker() {
  return spawnSync("docker", ["version"], { cwd: repoRoot, stdio: "ignore" }).status === 0;
}

test("Stop Preview declares a stop-only image placeholder", () => {
  const lines = fs.readFileSync(stopEnvFilePath, "utf8").split(/\r?\n/);
  assert.ok(lines.includes(`CRM_PREVIEW_IMAGE_REF=${stopOnlyImageRef}`));
  assert.ok(lines.includes("CRM_AUTH_RUNTIME_MODE=localhost-dev"));
  assert.ok(lines.includes("BETTER_AUTH_URL=http://127.0.0.1:3000"));
  assert.ok(lines.includes("BETTER_AUTH_SECRET=unused-for-stop-only-compose-interpolation"));
});

test("Stop Preview compose config resolves without an inherited image ref", { skip: !hasDocker() }, () => {
  const env = { ...process.env };
  delete env.CRM_PREVIEW_IMAGE_REF;

  const result = spawnSync(
    "docker",
    [
      "compose",
      "--project-name",
      "clariobase-crm-preview",
      "--env-file",
      stopEnvFilePath,
      "-f",
      "compose.yaml",
      "-f",
      "compose.preview.yaml",
      "config",
      "--format",
      "json"
    ],
    { cwd: repoRoot, encoding: "utf8", env }
  );

  assert.equal(result.status, 0, `Stop Preview compose interpolation should pass: ${result.stderr}`);

  const config = JSON.parse(result.stdout) as {
    services: Record<string, { image?: string; build?: unknown; pull_policy?: string }>;
    networks: Record<string, { name?: string }>;
    volumes: Record<string, { name?: string }>;
  };

  assert.equal(config.services["crm-app"].image, stopOnlyImageRef);
  assert.equal(Object.prototype.hasOwnProperty.call(config.services["crm-app"], "build"), false);
  assert.equal(config.services["crm-app"].pull_policy, "never");
  assert.equal(config.networks.default.name, "clariobase-crm-preview-network");
  assert.equal(config.volumes["crm-postgres-data"].name, "clariobase-crm-preview-postgres-data");
});
