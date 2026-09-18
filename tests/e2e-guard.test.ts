import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { assertNoProductionTargetInRepo, assertSafePlaywrightTarget, buildE2EChildEnv, getSupportedAreas, resolveE2ERuntimeContract, resolveSelectedArea } from "../scripts/e2e-guard";

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
  assert.equal(getSupportedAreas().join(","), "dashboard,i18n");
  assert.throws(() => resolveSelectedArea(undefined), /area selection is required/i);
  assert.throws(() => resolveSelectedArea("unknown"), /Unknown E2E area/i);
  assert.equal(resolveSelectedArea("dashboard"), "dashboard");
  assert.equal(resolveSelectedArea(" Dashboard "), "dashboard");
  assert.equal(resolveSelectedArea("i18n"), "i18n");
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
    CLARIOBASE_E2E_DATABASE_URL: "postgresql://postgres:0123456789abcdef0123456789abcdef0123456789abcdef@127.0.0.1:65535/clariobase_e2e_ab12cd34?schema=public",
    DATABASE_URL: "postgresql://postgres:0123456789abcdef0123456789abcdef0123456789abcdef@127.0.0.1:65535/clariobase_e2e_ab12cd34?schema=public",
    BETTER_AUTH_URL: "http://127.0.0.1:3011",
    BETTER_AUTH_SECRET: "local-proof-better-auth-secret-local-proof-better-auth-secret"
  } as const;

  assert.equal(resolveE2ERuntimeContract(safeEnv).databaseUrl, safeEnv.CLARIOBASE_E2E_DATABASE_URL);
  assert.equal(
    buildE2EChildEnv({
      DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      CLARIOBASE_E2E_RUNTIME: "local-proof",
      BETTER_AUTH_URL: safeEnv.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: safeEnv.BETTER_AUTH_SECRET
    }).DATABASE_URL,
    safeEnv.CLARIOBASE_E2E_DATABASE_URL
  );
  assert.equal(
    buildE2EChildEnv({
      DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      CLARIOBASE_E2E_RUNTIME: "local-proof",
      BETTER_AUTH_URL: safeEnv.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: safeEnv.BETTER_AUTH_SECRET
    }).CRM_DEPLOYMENT_ENV,
    "preview"
  );
  assert.equal(
    buildE2EChildEnv({
      DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      CLARIOBASE_E2E_RUNTIME: "local-proof",
      BETTER_AUTH_URL: safeEnv.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: safeEnv.BETTER_AUTH_SECRET,
      PLAYWRIGHT_STORAGE_STATE: "C:/Serwer/Projekty/Clariobase/worktrees/e011-main-reconcile/.codex-tmp/clariobase-e014-runtime-e2e-123-storage-state.json"
    }).PLAYWRIGHT_STORAGE_STATE,
    "C:/Serwer/Projekty/Clariobase/worktrees/e011-main-reconcile/.codex-tmp/clariobase-e014-runtime-e2e-123-storage-state.json"
  );
  assert.throws(() => resolveE2ERuntimeContract({} as NodeJS.ProcessEnv), /CLARIOBASE_E2E_RUNTIME must be local-proof/i);
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "wrong", CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL, DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL } as NodeJS.ProcessEnv),
    /CLARIOBASE_E2E_RUNTIME must be local-proof/i
  );
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "local-proof", CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL } as NodeJS.ProcessEnv),
    /DATABASE_URL is required/i
  );
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "local-proof", CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL, DATABASE_URL: "postgresql://127.0.0.1:5432/clariobase_e2e_ab12cd34?schema=public" } as NodeJS.ProcessEnv),
    /must match exactly/i
  );
  assert.throws(
    () => resolveE2ERuntimeContract({ CLARIOBASE_E2E_RUNTIME: "local-proof", CLARIOBASE_E2E_DATABASE_URL: "postgresql://localhost:5432/clariobase_e2e_ab12cd34?schema=public", DATABASE_URL: "postgresql://localhost:5432/clariobase_e2e_ab12cd34?schema=public" } as NodeJS.ProcessEnv),
    /must use 127\.0\.0\.1/i
  );
  for (const invalid of [
    "postgresql://localhost:65535/clariobase_e2e_ab12cd34?schema=public",
    "postgresql://crm-postgres:5432/clariobase_e2e_ab12cd34?schema=public",
    "http://127.0.0.1:65535/clariobase_e2e_ab12cd34?schema=public",
    "postgresql://127.0.0.1:5432/clariobase_e2e_ab12cd34?schema=public",
    "postgresql://127.0.0.1:65535/clariobase_crm?schema=public",
    "postgresql://127.0.0.1:65535/clariobase_e2e_ab12cd34",
    "postgresql://127.0.0.1:65535/clariobase_e2e_ab12cd34?schema=test",
    "postgresql://127.0.0.1:65535/clariobase_e2e_ab12cd34?schema=public&extra=1",
    "postgresql://user:password@127.0.0.1:65535/clariobase_e2e_ab12cd34?schema=public",
    "postgresql://postgres:short@127.0.0.1:65535/clariobase_e2e_ab12cd34?schema=public",
    "postgresql://127.0.0.1:65535/clariobase_e2e_ab12cd34?schema=public#unsafe"
  ]) {
    assert.throws(
      () => resolveE2ERuntimeContract({
        CLARIOBASE_E2E_RUNTIME: "local-proof",
        CLARIOBASE_E2E_DATABASE_URL: invalid,
        DATABASE_URL: invalid
      } as NodeJS.ProcessEnv),
      /must use|must target schema=public only|generated hexadecimal password/i
    );
  }
  assert.throws(
    () => buildE2EChildEnv({
      CLARIOBASE_E2E_RUNTIME: "local-proof",
      CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      BETTER_AUTH_URL: "http://localhost:3011",
      BETTER_AUTH_SECRET: safeEnv.BETTER_AUTH_SECRET
    }),
    /BETTER_AUTH_URL must use 127\.0\.0\.1/i
  );
  assert.throws(
    () => buildE2EChildEnv({
      CLARIOBASE_E2E_RUNTIME: "local-proof",
      CLARIOBASE_E2E_DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      DATABASE_URL: safeEnv.CLARIOBASE_E2E_DATABASE_URL,
      BETTER_AUTH_URL: safeEnv.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: "short"
    }),
    /BETTER_AUTH_SECRET must be at least 32 characters long/i
  );
});
