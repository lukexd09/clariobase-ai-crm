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
  assert.ok(lines.includes("CRM_AUTH_RUNTIME_MODE=private-https"));
  assert.ok(lines.includes("CRM_PRIVATE_HOSTNAME=clariobase-crm-preview.home.arpa"));
  assert.ok(lines.includes("CRM_PRIVATE_HTTPS_PORT=3001"));
  assert.ok(lines.includes("CRM_AUTH_TRUSTED_ORIGINS=https://clariobase-crm-preview.home.arpa:3001"));
  assert.ok(lines.includes("BETTER_AUTH_URL=https://clariobase-crm-preview.home.arpa:3001"));
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
      "-f",
      "compose.preview.private-https.yaml",
      "config",
      "--format",
      "json"
    ],
    { cwd: repoRoot, encoding: "utf8", env }
  );

  assert.equal(result.status, 0, `Stop Preview compose interpolation should pass: ${result.stderr}`);

  const config = JSON.parse(result.stdout) as {
    services: Record<string, {
      image?: string;
      build?: unknown;
      pull_policy?: string;
      ports?: Array<{ published?: string; target?: number }>;
      environment?: Record<string, string>;
    }>;
    networks: Record<string, { name?: string }>;
    volumes: Record<string, { name?: string }>;
  };

  assert.equal(config.services["crm-app"].image, stopOnlyImageRef);
  assert.equal(Object.prototype.hasOwnProperty.call(config.services["crm-app"], "build"), false);
  assert.equal(config.services["crm-app"].pull_policy, "never");
  assert.equal(config.services["crm-app"].environment?.CRM_AUTH_RUNTIME_MODE, "private-https");
  assert.equal(config.services["crm-app"].environment?.CRM_PRIVATE_HOSTNAME, "clariobase-crm-preview.home.arpa");
  assert.equal(config.services["crm-app"].environment?.CRM_PRIVATE_HTTPS_PORT, "3001");
  assert.equal(config.services["crm-app"].environment?.BETTER_AUTH_URL, "https://clariobase-crm-preview.home.arpa:3001");
  assert.equal((config.services["crm-app"].ports ?? []).length, 0);
  assert.equal(config.services["crm-private-ingress"].ports?.[0]?.published, "3001");
  assert.equal(config.services["crm-private-ingress"].ports?.[0]?.target, 443);
  assert.equal(config.networks.default.name, "clariobase-crm-preview-network");
  assert.equal(config.volumes["crm-postgres-data"].name, "clariobase-crm-preview-postgres-data");
  assert.equal(config.volumes["crm-private-caddy-data"].name, "clariobase-crm-preview-private-caddy-data");
  assert.equal(config.volumes["crm-private-caddy-config"].name, "clariobase-crm-preview-private-caddy-config");
});
