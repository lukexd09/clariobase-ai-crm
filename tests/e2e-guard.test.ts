import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  assertNoProductionTargetInRepo,
  assertSafePlaywrightTarget,
  buildE2EChildEnv,
  createRuntimeManifest,
  getSupportedAreas,
  resolveE2ERuntimeContract,
  resolveSelectedArea,
  validateRuntimeManifest
} from "../scripts/e2e-guard";

test("playwright guard accepts localhost and rejects protected production targets", () => {
  assert.equal(assertSafePlaywrightTarget("http://127.0.0.1:3011"), "http://127.0.0.1:3011/");
  assert.equal(assertSafePlaywrightTarget("http://localhost:3011"), "http://localhost:3011/");
  for (const target of ["http://Serwer:3000", "http://Serwer:3001", "http://localhost:3000", "http://127.0.0.1:3000"]) {
    assert.throws(() => assertSafePlaywrightTarget(target));
  }
});

test("playwright guard rejects repository references to production targets", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "clariobase-e2e-guard-"));
  try {
    fs.writeFileSync(path.join(tmpRoot, "package.json"), "{\"name\":\"x\",\"scripts\":{}}", "utf8");
    fs.mkdirSync(path.join(tmpRoot, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, "scripts", "run-e2e.ts"), "const target = 'http://Serwer:3000';", "utf8");
    assert.throws(() => assertNoProductionTargetInRepo(tmpRoot), /production target references/i);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("playwright area selection requires an explicit known area", () => {
  assert.equal(getSupportedAreas().join(","), "dashboard,leads");
  assert.throws(() => resolveSelectedArea(undefined), /area selection is required/i);
  assert.throws(() => resolveSelectedArea("unknown"), /Unknown E2E area/i);
  assert.equal(resolveSelectedArea("dashboard"), "dashboard");
  assert.equal(resolveSelectedArea("leads"), "leads");
});

test("runtime manifest and database safety are validated", () => {
  const manifest = validateRuntimeManifest(createRuntimeManifest({
    runId: "e021-t002-abc123",
    containerName: "e021-t002-abc123-postgres",
    networkName: "e021-t002-abc123-network",
    hostPort: 54321,
    databaseName: "clariobase_e021_t002_abc123",
    appBaseUrl: "http://127.0.0.1:3011"
  }));

  assert.equal(manifest.runId, "e021-t002-abc123");
  assert.throws(() => createRuntimeManifest({
    runId: "bad run",
    containerName: "bad run-postgres",
    networkName: "bad run-network",
    hostPort: 1,
    databaseName: "clariobase_e021_t002_bad",
    appBaseUrl: "http://127.0.0.1:3011"
  }), /lowercase letters, digits and hyphens/);

  assert.equal(
    resolveE2ERuntimeContract({
      CLARIOBASE_E2E_RUNTIME: "local-proof",
      DATABASE_URL: "postgresql://127.0.0.1:54321/clariobase_e021_t002_abc123?schema=public"
    }).databaseUrl,
    "postgresql://127.0.0.1:54321/clariobase_e021_t002_abc123?schema=public"
  );

  assert.equal(
    buildE2EChildEnv({
      DATABASE_URL: "postgresql://localhost:5432/clariobase_crm?schema=public",
      CLARIOBASE_E2E_RUNTIME: "ignored"
    }, manifest, "postgresql://127.0.0.1:54321/clariobase_e021_t002_abc123?schema=public").DATABASE_URL,
    "postgresql://127.0.0.1:54321/clariobase_e021_t002_abc123?schema=public"
  );

  assert.throws(() => resolveE2ERuntimeContract({} as NodeJS.ProcessEnv), /must be local-proof/i);
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "local-proof", DATABASE_URL: "postgresql://localhost:5432/clariobase_crm?schema=public" } as NodeJS.ProcessEnv),
    /disposable local PostgreSQL run/i
  );
});
