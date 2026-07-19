import assert from "node:assert/strict";
import test from "node:test";

import {
  assertImmutableImageReference,
  classifyBindAddress,
  validateComposeModel,
  validateImageLabels,
  validatePrivateHttpsPreflight,
  type ComposeConfig,
  type PrivateHttpsEnv
} from "../scripts/private-https-preflight";

const localImageId = "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const registryDigest = "ghcr.io/lukexd09/clariobase-ai-crm@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const postgresDigest = "postgres:16@sha256:fe03a7605299a34ddf5e4f285dff78c3d7190a576b3c6b46f2fcff69f4bffd54";
const ingressDigest = "caddy@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d";
const sourceSha = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function baseEnv(overrides: Partial<PrivateHttpsEnv> = {}): PrivateHttpsEnv {
  return {
    CRM_PRIVATE_BIND_ADDRESS: "127.0.0.1",
    CRM_PRIVATE_HOSTNAME: "clariobase-crm-preview.home.arpa",
    CRM_PRIVATE_HTTPS_PORT: "3001",
    CRM_AUTH_RUNTIME_MODE: "private-https",
    CRM_AUTH_TRUSTED_ORIGINS: "https://clariobase-crm-preview.home.arpa:3001",
    BETTER_AUTH_URL: "https://clariobase-crm-preview.home.arpa:3001",
    BETTER_AUTH_SECRET: "preview-better-auth-secret-preview-better-auth-secret-preview",
    AI_EXCHANGE_HOST_PATH: "./data/ai-exchange-preview",
    CRM_POSTGRES_DB: "clariobase_crm_preview",
    CRM_POSTGRES_USER: "clariobase_crm_preview_user",
    CRM_POSTGRES_PASSWORD: "preview-password",
    CRM_DATABASE_URL: "postgresql://clariobase_crm_preview_user:preview-password@crm-postgres:5432/clariobase_crm_preview?schema=public",
    CRM_PRIVATE_APP_IMAGE: localImageId,
    CRM_PRIVATE_INGRESS_IMAGE: ingressDigest,
    CRM_POSTGRES_IMAGE: postgresDigest,
    ...overrides
  };
}

function baseCompose(overrides: Partial<ComposeConfig> = {}): ComposeConfig {
  return {
    services: {
      "crm-app": {
        image: localImageId,
        pull_policy: "never",
        ports: []
      },
      "crm-postgres": {
        image: postgresDigest,
        ports: []
      },
      "crm-private-ingress": {
        image: ingressDigest,
        ports: [{ published: "3001", target: 443, host_ip: "127.0.0.1" }]
      }
    },
    ...overrides
  };
}

test("private HTTPS bind address validation accepts explicit loopback and RFC1918 addresses", () => {
  assert.throws(() => classifyBindAddress("0.0.0.0"), /must not use a wildcard bind address/);
  assert.throws(() => classifyBindAddress("::"), /must not use a wildcard bind address/);
  assert.throws(() => classifyBindAddress("not-an-address"), /must be a valid loopback or RFC1918 IP address/);
  assert.equal(classifyBindAddress("127.0.0.1"), "loopback");
  assert.equal(classifyBindAddress("10.12.34.56"), "rfc1918");
});

test("private HTTPS image references require immutable refs", () => {
  assert.doesNotThrow(() => assertImmutableImageReference(localImageId, "CRM_PRIVATE_APP_IMAGE"));
  assert.doesNotThrow(() => assertImmutableImageReference(registryDigest, "CRM_PRIVATE_APP_IMAGE"));
  assert.throws(() => assertImmutableImageReference("ghcr.io/lukexd09/clariobase-ai-crm:latest", "CRM_PRIVATE_APP_IMAGE"), /must use an immutable image reference or full image ID/);
  assert.throws(() => assertImmutableImageReference("caddy:latest", "CRM_PRIVATE_INGRESS_IMAGE"), /must use an immutable image reference or full image ID/);
  assert.throws(() => assertImmutableImageReference("postgres:16", "CRM_POSTGRES_IMAGE"), /must use an immutable image reference or full image ID/);
});

test("private HTTPS compose model validation rejects unsafe topology", () => {
  const env = baseEnv();

  assert.doesNotThrow(() => validateComposeModel(baseCompose(), env));
  assert.throws(
    () => validateComposeModel(baseCompose({ services: { ...baseCompose().services, "crm-app": { image: localImageId, pull_policy: "never", ports: [{ published: "3001", target: 3000 }] } } }), env),
    /must not publish any host ports for crm-app/
  );
  assert.throws(
    () => validateComposeModel(baseCompose({ services: { ...baseCompose().services, "crm-postgres": { image: postgresDigest, ports: [{ published: "5432", target: 5432 }] } } }), env),
    /must not publish any host ports for crm-postgres/
  );
  assert.throws(
    () => validateComposeModel({ services: { "crm-app": { image: localImageId, pull_policy: "never", ports: [] }, "crm-postgres": { image: postgresDigest, ports: [] } } }, env),
    /must define crm-private-ingress/
  );
  assert.throws(
    () => validateComposeModel(baseCompose({ services: { ...baseCompose().services, "crm-private-ingress": { image: ingressDigest, ports: [{ published: "3001", target: 8443, host_ip: "127.0.0.1" }] } } }), env),
    /must target container port 443/
  );
  assert.throws(
    () => validateComposeModel(baseCompose({ services: { ...baseCompose().services, "crm-private-ingress": { image: ingressDigest, ports: [{ published: "3001", target: 443, host_ip: "127.0.0.1" }], privileged: true } } }), env),
    /must not enable privileged mode/
  );
  assert.throws(
    () => validateComposeModel(baseCompose({ services: { ...baseCompose().services, "crm-private-ingress": { image: ingressDigest, ports: [{ published: "3001", target: 443, host_ip: "127.0.0.1" }], network_mode: "host" } } }), env),
    /must not use host networking/
  );
  assert.throws(
    () => validateComposeModel(baseCompose({ services: { ...baseCompose().services, "crm-app": { image: localImageId, pull_policy: "never", ports: [], volumes: ["/var/run/docker.sock:/var/run/docker.sock:ro"] } } }), env),
    /must not mount the Docker socket in crm-app/
  );
});

test("private HTTPS image label validation enforces source SHA and variant", () => {
  assert.deepEqual(validateImageLabels({ "io.clariobase.source-sha": sourceSha, "io.clariobase.image-variant": "validated" }, sourceSha), {
    sourceSha,
    imageVariant: "validated"
  });
  assert.throws(() => validateImageLabels({ "io.clariobase.image-variant": "validated" }, sourceSha), /label must be present/);
  assert.throws(() => validateImageLabels({ "io.clariobase.source-sha": "not-a-sha", "io.clariobase.image-variant": "validated" }, sourceSha), /full 40-character Git commit SHA/);
  assert.throws(() => validateImageLabels({ "io.clariobase.source-sha": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "io.clariobase.image-variant": "validated" }, sourceSha), /must equal the explicit expected source SHA/);
  assert.throws(() => validateImageLabels({ "io.clariobase.source-sha": sourceSha }, sourceSha), /image-variant label must be present/);
  assert.throws(() => validateImageLabels({ "io.clariobase.source-sha": sourceSha, "io.clariobase.image-variant": "upgrade-proof" }, sourceSha), /must equal validated/);
});

test("private HTTPS preflight accepts exact local image IDs and redacts secrets on failure", () => {
  const env = baseEnv({
    BETTER_AUTH_SECRET: "super-secret-better-auth-secret-super-secret-better-auth-secret",
    CRM_POSTGRES_PASSWORD: "super-secret-postgres-password"
  });
  const composeJson = JSON.stringify(baseCompose());

  assert.doesNotThrow(() => validatePrivateHttpsPreflight({
    env,
    composeConfigJson: composeJson,
    imageLabels: { "io.clariobase.source-sha": sourceSha, "io.clariobase.image-variant": "validated" },
    expectedSourceSha: sourceSha
  }));

  assert.throws(
    () => validatePrivateHttpsPreflight({
      env,
      composeConfigJson: JSON.stringify({
        services: {
          "crm-app": { image: localImageId, pull_policy: "never", ports: [{ published: "3001", target: 3000 }] },
          "crm-postgres": { image: postgresDigest, ports: [] },
          "crm-private-ingress": { image: ingressDigest, ports: [{ published: "3001", target: 443, host_ip: "127.0.0.1" }] }
        }
      }),
      imageLabels: { "io.clariobase.source-sha": sourceSha, "io.clariobase.image-variant": "validated" },
      expectedSourceSha: sourceSha
    }),
    (error: unknown) => {
      assert.match(String((error as Error).message), /must not publish any host ports for crm-app/);
      assert.doesNotMatch(String((error as Error).message), /super-secret-better-auth-secret|super-secret-postgres-password/);
      return true;
    }
  );
});
