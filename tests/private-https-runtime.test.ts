import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("private HTTPS overlay exposes only one digest-pinned ingress", () => {
  const overlay = read("compose.private-https.yaml");
  const caddy = read("config/private-https/Caddyfile");
  assert.match(overlay, /ports: !reset \[\]/);
  assert.match(overlay, /build: !reset null/);
  assert.match(overlay, /CRM_PRIVATE_APP_IMAGE:\?Set_CRM_PRIVATE_APP_IMAGE/);
  assert.match(overlay, /pull_policy: never/);
  assert.match(overlay, /CRM_PRIVATE_INGRESS_IMAGE:-caddy@sha256:[a-f0-9]{64}/);
  assert.match(overlay, /CRM_PRIVATE_BIND_ADDRESS:\?Set_CRM_PRIVATE_BIND_ADDRESS/);
  assert.match(overlay, /CRM_PRIVATE_HTTPS_PORT:\?Set_CRM_PRIVATE_HTTPS_PORT/);
  assert.match(overlay, /internal: true/g);
  assert.match(overlay, /crm-bind:/);
  assert.match(overlay, /crm-private-ingress:[\s\S]*networks:[\s\S]*crm-bind:/);
  assert.doesNotMatch(overlay.split("  crm-private-ingress:")[0], /crm-bind:/);
  assert.doesNotMatch(overlay, /docker\.sock|privileged:|network_mode:\s*host/);
  assert.match(caddy, /tls internal/);
  assert.match(caddy, /header_up X-Forwarded-Proto https/);
  assert.match(caddy, /header_up -Forwarded/);
  assert.match(caddy, /header_up X-Forwarded-For \{http\.request\.remote\.host\}/);
});

test("base Compose authentication secret and URL fail closed", () => {
  const compose = read("compose.yaml");
  assert.match(compose, /BETTER_AUTH_SECRET: \$\{BETTER_AUTH_SECRET:\?Set_BETTER_AUTH_SECRET\}/);
  assert.match(compose, /BETTER_AUTH_URL: \$\{BETTER_AUTH_URL:\?Set_BETTER_AUTH_URL\}/);
  assert.doesNotMatch(compose, /BETTER_AUTH_SECRET=\$\{BETTER_AUTH_SECRET:-/);
  assert.doesNotMatch(compose, /clariobase-local-better-auth-secret/);
});

test("T013 proof owns exact-image identity, real auth restart, revocation, and cleanup", () => {
  const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  const proof = read("scripts/e011-t013-private-https-proof.ts");
  assert.equal(packageJson.scripts["e011:t013:proof"], "tsx scripts/e011-t013-private-https-proof.ts");
  assert.match(proof, /createCleanupController\("e011:t013:proof"\)/);
  assert.match(proof, /cleanup\.installProcessHandlers\(\)/);
  assert.match(proof, /cleanup\.registerDockerProject\(project\)/);
  assert.match(proof, /cleanup\.registerDockerImage\(imageTag\)/);
  assert.match(proof, /cleanup\.registerTempPath\(tmpRoot\)/);
  assert.match(proof, /CRM_SOURCE_SHA/);
  assert.match(proof, /bootstrap disposable administrator through controlled path/);
  assert.match(proof, /create disposable user through admin gateway/);
  assert.match(proof, /restart application/);
  assert.match(proof, /restart HTTPS ingress/);
  assert.match(proof, /restart PostgreSQL cleanly/);
  assert.match(proof, /revoke disposable user sessions through admin gateway/);
  assert.match(proof, /observe blocked external runtime connectivity/);
  assert.match(proof, /e011-t013-security-scan\.ts/);
  assert.match(proof, /scripts\/e011-immutable-image\.ts/);
  assert.match(proof, /prove exact-image upgrade and rollback/);
  const renderedRouteProof = read("tests/light-density-route-contracts.test.ts");
  assert.match(renderedRouteProof, /CRM_AUTH_RUNTIME_MODE: "disposable-test"/g);
  assert.match(renderedRouteProof, /CRM_ALLOW_INSECURE_AUTH_TESTS: "1"/g);
  const offlineBundle = read("scripts/e011-offline-bundle.ts");
  const offlineRestore = read("scripts/e011-offline-restore.ts");
  assert.match(offlineBundle, /pnpm-store\.tar\.gz/);
  assert.match(offlineBundle, /pnpm fetch --frozen-lockfile --store-dir \/store/);
  assert.match(offlineRestore, /extract verified dependency store without network/);
  assert.match(offlineRestore, /--network", "none/);
  assert.match(offlineRestore, /storeVolume}:+\/store:ro/);
  const offlineOverlay = read("compose.private-https.offline-proof.yaml");
  assert.match(offlineOverlay, /ports: !reset \[\]/);
  assert.match(offlineOverlay, /pull_policy: never/g);
  assert.match(offlineOverlay, /networks: !override/);
  assert.doesNotMatch(offlineOverlay, /crm-bind/);
});
