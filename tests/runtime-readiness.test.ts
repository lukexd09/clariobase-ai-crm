import test from "node:test";
import assert from "node:assert/strict";

import { getRuntimeReadiness } from "../src/lib/runtime-readiness";

const privateHttpsEnv = {
  CRM_AUTH_RUNTIME_MODE: "private-https",
  CRM_PRIVATE_BIND_ADDRESS: "0.0.0.0",
  CRM_PRIVATE_HOSTNAME: "clariobase-crm-preview.home.arpa",
  CRM_PRIVATE_HTTPS_PORT: "3001",
  CRM_AUTH_TRUSTED_ORIGINS: "https://clariobase-crm-preview.home.arpa:3001",
  BETTER_AUTH_URL: "https://clariobase-crm-preview.home.arpa:3001",
  BETTER_AUTH_SECRET: "test-only-readiness-secret-test-only-readiness-secret"
};

test("runtime readiness returns HTTP 200 when the database and auth probes succeed", async () => {
  const result = await getRuntimeReadiness(
    async () => undefined,
    async () => undefined,
    () => "2026-06-14T00:00:00.000Z"
  );

  assert.equal(result.httpStatus, 200);
  assert.deepEqual(result.body, {
    service: "clariobase-ai-crm",
    status: "ready",
    timestamp: "2026-06-14T00:00:00.000Z",
    checks: {
      database: "ok",
      authentication: "ok"
    }
  });
});

test("runtime readiness returns HTTP 503 when auth configuration is invalid", async () => {
  const result = await getRuntimeReadiness(
    async () => undefined,
    async () => {
      throw new Error("authentication runtime failed for secret-value");
    },
    () => "2026-06-14T00:00:00.000Z"
  );

  assert.equal(result.httpStatus, 503);
  assert.deepEqual(result.body, {
    service: "clariobase-ai-crm",
    status: "not_ready",
    timestamp: "2026-06-14T00:00:00.000Z",
    checks: {
      database: "ok",
      authentication: "misconfigured"
    }
  });

  const serialized = JSON.stringify(result.body);
  assert.doesNotMatch(serialized, /secret-value/i);
});

test("runtime readiness returns HTTP 503 without leaking sensitive details when the database probe fails", async () => {
  const result = await getRuntimeReadiness(
    async () => {
      throw new Error("database refused connection for postgresql://user:password@example");
    },
    async () => undefined,
    () => "2026-06-14T00:00:00.000Z"
  );

  assert.equal(result.httpStatus, 503);
  assert.deepEqual(result.body, {
    service: "clariobase-ai-crm",
    status: "not_ready",
    timestamp: "2026-06-14T00:00:00.000Z",
    checks: {
      database: "unavailable",
      authentication: "ok"
    }
  });

  const serialized = JSON.stringify(result.body);
  assert.doesNotMatch(serialized, /password/i);
  assert.doesNotMatch(serialized, /postgres(?:ql)?:\/\//i);
  assert.doesNotMatch(serialized, /DATABASE_URL/i);
});

test("runtime readiness can validate the repository-owned auth parser in production-like private HTTPS mode", async () => {
  const previousValues = new Map(
    Object.keys(privateHttpsEnv).map((key) => [key, process.env[key]])
  );

  try {
    Object.assign(process.env, privateHttpsEnv);

    const result = await getRuntimeReadiness(
      async () => undefined,
      async () => undefined,
      () => "2026-06-14T00:00:00.000Z"
    );

    assert.equal(result.httpStatus, 200);
    assert.equal(result.body.checks.authentication, "ok");
  } finally {
    for (const [key, previousValue] of previousValues.entries()) {
      if (previousValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousValue;
      }
    }
  }
});
