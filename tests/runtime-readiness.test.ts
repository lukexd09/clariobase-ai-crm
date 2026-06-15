import test from "node:test";
import assert from "node:assert/strict";

import { getRuntimeReadiness } from "../src/lib/runtime-readiness";

test("runtime readiness returns HTTP 200 when the CRM database probe succeeds", async () => {
  const result = await getRuntimeReadiness(
    async () => undefined,
    () => "2026-06-14T00:00:00.000Z"
  );

  assert.equal(result.httpStatus, 200);
  assert.deepEqual(result.body, {
    service: "clariobase-ai-crm",
    status: "ready",
    timestamp: "2026-06-14T00:00:00.000Z",
    checks: {
      database: "ok"
    }
  });
});

test("runtime readiness returns HTTP 503 without leaking sensitive details when the database probe fails", async () => {
  const result = await getRuntimeReadiness(
    async () => {
      throw new Error("database refused connection for postgresql://user:password@example");
    },
    () => "2026-06-14T00:00:00.000Z"
  );

  assert.equal(result.httpStatus, 503);
  assert.deepEqual(result.body, {
    service: "clariobase-ai-crm",
    status: "not_ready",
    timestamp: "2026-06-14T00:00:00.000Z",
    checks: {
      database: "unavailable"
    }
  });

  const serialized = JSON.stringify(result.body);
  assert.doesNotMatch(serialized, /password/i);
  assert.doesNotMatch(serialized, /postgres(?:ql)?:\/\//i);
  assert.doesNotMatch(serialized, /DATABASE_URL/i);
});
