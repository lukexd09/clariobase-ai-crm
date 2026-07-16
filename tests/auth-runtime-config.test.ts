import assert from "node:assert/strict";
import test from "node:test";

import { hasAcceptedAuthProxyHeaders } from "@/lib/auth-proxy-contract";
import { parseAuthRuntimeConfig } from "@/lib/auth-runtime-config";

const secret = "t013-private-proof-secret-with-more-than-32-characters";
const privateEnv = {
  CRM_AUTH_RUNTIME_MODE: "private-https",
  CRM_PRIVATE_HOSTNAME: "crm-proof.home.arpa",
  CRM_PRIVATE_HTTPS_PORT: "8443",
  CRM_AUTH_TRUSTED_ORIGINS: "https://crm-proof.home.arpa:8443",
  BETTER_AUTH_URL: "https://crm-proof.home.arpa:8443",
  BETTER_AUTH_SECRET: secret,
  NODE_ENV: "production"
};

test("private HTTPS auth config is canonical, bounded, and secure", () => {
  const config = parseAuthRuntimeConfig(privateEnv);
  assert.equal(config.mode, "private-https");
  assert.equal(config.secureCookies, true);
  assert.deepEqual(config.trustedOrigins, ["https://crm-proof.home.arpa:8443"]);
  assert.equal(config.expectedForwardedHost, "crm-proof.home.arpa:8443");
});

test("private HTTPS auth config rejects unsafe URLs, origins, and secrets without echoing them", () => {
  const cases: Array<[Record<string, string | undefined>, RegExp]> = [
    [{ ...privateEnv, BETTER_AUTH_URL: "http://crm-proof.home.arpa:8443" }, /must use HTTPS/],
    [{ ...privateEnv, BETTER_AUTH_URL: "https://wrong.home.arpa:8443" }, /hostname must equal/],
    [{ ...privateEnv, BETTER_AUTH_URL: "https://crm-proof.home.arpa:9443" }, /port must equal/],
    [{ ...privateEnv, BETTER_AUTH_URL: "https://user:pass@crm-proof.home.arpa:8443" }, /without credentials/],
    [{ ...privateEnv, BETTER_AUTH_URL: "https://crm-proof.home.arpa:8443/path" }, /without credentials/],
    [{ ...privateEnv, CRM_AUTH_TRUSTED_ORIGINS: "" }, /is required/],
    [{ ...privateEnv, CRM_AUTH_TRUSTED_ORIGINS: "https://evil.home.arpa:8443" }, /must equal/],
    [{ ...privateEnv, CRM_AUTH_TRUSTED_ORIGINS: "https://*.home.arpa:8443" }, /must not contain wildcard/],
    [{ ...privateEnv, BETTER_AUTH_SECRET: "short" }, /at least 32/],
    [{ ...privateEnv, BETTER_AUTH_SECRET: "replace-with-a-long-placeholder-secret-value" }, /placeholder/],
    [{ ...privateEnv, BETTER_AUTH_SECRETS: "unexpected-secret-set" }, /not accepted/],
    [{ ...privateEnv, BETTER_AUTH_TRUSTED_ORIGINS: "https:\/\/evil.test" }, /not accepted/],
    [{ ...privateEnv, BETTER_AUTH_TELEMETRY: "1" }, /not accepted/],
    [{ ...privateEnv, BETTER_AUTH_TELEMETRY_ENDPOINT: "https:\/\/telemetry.test" }, /not accepted/]
  ];

  for (const [env, expected] of cases) {
    let error: Error | null = null;
    try {
      parseAuthRuntimeConfig(env);
    } catch (candidate) {
      error = candidate instanceof Error ? candidate : new Error(String(candidate));
    }
    assert(error);
    assert.match(error.message, expected);
    assert.doesNotMatch(error.message, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(error.message, /unexpected-secret-set/);
  }
});

test("localhost development and disposable test exceptions stay loopback-only", () => {
  assert.equal(parseAuthRuntimeConfig({
    CRM_AUTH_RUNTIME_MODE: "localhost-dev",
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: secret
  }).secureCookies, false);

  assert.equal(parseAuthRuntimeConfig({
    CRM_AUTH_RUNTIME_MODE: "disposable-test",
    CRM_ALLOW_INSECURE_AUTH_TESTS: "1",
    BETTER_AUTH_URL: "http://127.0.0.1:3011",
    BETTER_AUTH_SECRET: secret
  }).mode, "disposable-test");

  assert.throws(() => parseAuthRuntimeConfig({
    CRM_AUTH_RUNTIME_MODE: "disposable-test",
    BETTER_AUTH_URL: "http://127.0.0.1:3011",
    BETTER_AUTH_SECRET: secret
  }), /CRM_ALLOW_INSECURE_AUTH_TESTS=1/);
  assert.throws(() => parseAuthRuntimeConfig({
    CRM_AUTH_RUNTIME_MODE: "localhost-dev",
    BETTER_AUTH_URL: "http://192.0.2.10:3000",
    BETTER_AUTH_SECRET: secret
  }), /HTTP loopback/);
});

test("private proxy contract accepts only the single ingress-owned header tuple", () => {
  const config = parseAuthRuntimeConfig(privateEnv);
  const accepted = new Request("http://crm-app:3000/api/auth/sign-in/email", {
    headers: {
      host: "crm-proof.home.arpa:8443",
      "x-forwarded-host": "crm-proof.home.arpa:8443",
      "x-forwarded-proto": "https"
    }
  });
  assert.equal(hasAcceptedAuthProxyHeaders(accepted, config), true);

  for (const headers of [
    { host: "crm-proof.home.arpa:8443", "x-forwarded-host": "crm-proof.home.arpa:8443", "x-forwarded-proto": "http" },
    { host: "crm-proof.home.arpa:8443", "x-forwarded-host": "evil.home.arpa:8443", "x-forwarded-proto": "https" },
    { host: "crm-proof.home.arpa:8443", "x-forwarded-host": "crm-proof.home.arpa:8443", "x-forwarded-proto": "https,http" },
    { host: "crm-proof.home.arpa:8443", "x-forwarded-host": "crm-proof.home.arpa:8443", "x-forwarded-proto": "https", forwarded: "proto=https" },
    { host: "crm-proof.home.arpa:8443", "x-forwarded-proto": "https" }
  ]) {
    const normalizedHeaders = new Headers(
      Object.entries(headers).filter((entry): entry is [string, string] => typeof entry[1] === "string")
    );
    assert.equal(hasAcceptedAuthProxyHeaders(new Request(accepted.url, { headers: normalizedHeaders }), config), false);
  }
});
