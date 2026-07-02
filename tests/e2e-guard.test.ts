import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { assertNoProductionTargetInRepo, assertSafePlaywrightTarget, getSupportedAreas, resolveE2ERuntimeContract, resolveSelectedArea } from "../scripts/e2e-guard";

test("playwright guard accepts localhost and rejects protected production targets", () => {
  assert.equal(assertSafePlaywrightTarget("http://127.0.0.1:3011"), "http://127.0.0.1:3011/");
  assert.equal(assertSafePlaywrightTarget("http://localhost:3011"), "http://localhost:3011/");
  assert.equal(assertSafePlaywrightTarget("http://127.0.0.1:3011/"), "http://127.0.0.1:3011/");
  assert.equal(assertSafePlaywrightTarget("http://localhost:3011/"), "http://localhost:3011/");
  for (const target of [
    "http://Serwer:3000",
    "http://Serwer:3001",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
  ]) {
    assert.throws(() => assertSafePlaywrightTarget(target), /port 3011|protected port|localhost or 127\.0\.0\.1|http:/i);
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
  assert.equal(getSupportedAreas().join(","), "dashboard");
  assert.throws(() => resolveSelectedArea(undefined), /area selection is required/i);
  assert.throws(() => resolveSelectedArea("unknown"), /Unknown E2E area/i);
  assert.equal(resolveSelectedArea("dashboard"), "dashboard");
  assert.equal(resolveSelectedArea(" Dashboard "), "dashboard");
});

test("playwright target guard rejects every protected loopback variant", () => {
  for (const target of [
    "http://Serwer:3000",
    "http://Serwer:3001",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
  ]) {
    assert.throws(() => assertSafePlaywrightTarget(target), /port 3011|protected port|localhost or 127\.0\.0\.1/i);
  }
});

test("e2e runtime contract requires the approved marker and synthetic database identity", () => {
  const safeEnv = {
    CLARIOBASE_E2E_RUNTIME: "local-proof",
    CLARIOBASE_E2E_DATABASE_URL: "postgresql://127.0.0.1:65535/clariobase_e2e_proof?schema=public"
  } as const;

  assert.equal(resolveE2ERuntimeContract(safeEnv).databaseUrl, safeEnv.CLARIOBASE_E2E_DATABASE_URL);
  assert.throws(() => resolveE2ERuntimeContract({} as NodeJS.ProcessEnv), /CLARIOBASE_E2E_RUNTIME must be local-proof/i);
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "wrong", CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL } as NodeJS.ProcessEnv),
    /CLARIOBASE_E2E_RUNTIME must be local-proof/i
  );
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "local-proof" } as NodeJS.ProcessEnv),
    /CLARIOBASE_E2E_DATABASE_URL is required/i
  );
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "local-proof", CLARIOBASE_E2E_DATABASE_URL: "postgresql://localhost:5432/clariobase_crm?schema=public" } as NodeJS.ProcessEnv),
    /E2E database name must be clariobase_e2e_proof/i
  );
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "local-proof", CLARIOBASE_E2E_DATABASE_URL: "postgresql://example.com:5432/clariobase_e2e_proof?schema=public" } as NodeJS.ProcessEnv),
    /E2E database host must be loopback/i
  );
});
