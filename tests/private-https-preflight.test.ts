import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("private HTTPS preflight command owns immutable image and compose topology checks", () => {
  const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  const script = read("scripts/private-https-preflight.ts");
  const runbook = read("docs/operations/private-https-auth-recovery.md");

  assert.equal(packageJson.scripts["private-https:preflight"], "tsx scripts/private-https-preflight.ts");
  assert.match(runbook, /corepack pnpm private-https:preflight -- --env-file .*\.env\.compose\.private-https\.local --expected-source-sha <exact source sha>/);
  assert.match(script, /parseAuthRuntimeConfig/);
  assert.match(script, /--expected-source-sha/);
  assert.match(script, /CRM_PRIVATE_APP_IMAGE/);
  assert.match(script, /CRM_PRIVATE_INGRESS_IMAGE/);
  assert.match(script, /CRM_POSTGRES_IMAGE/);
  assert.match(script, /io\.clariobase\.source-sha/);
  assert.match(script, /io\.clariobase\.image-variant/);
  assert.match(script, /validateComposeModel/);
  assert.match(script, /Docker socket/);
  assert.match(script, /privileged mode/);
  assert.match(script, /host networking/);
  assert.match(script, /Private HTTPS compose model must not publish any host ports for crm-app/);
  assert.match(script, /Private HTTPS ingress must target container port 443/);
  assert.match(script, /explicit loopback or RFC1918/);
});
