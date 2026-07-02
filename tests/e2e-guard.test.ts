import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { assertNoProductionTargetInRepo, assertSafePlaywrightTarget } from "../scripts/e2e-guard";

test("playwright guard accepts localhost and rejects protected production targets", () => {
  assert.equal(assertSafePlaywrightTarget("http://127.0.0.1:3011"), "http://127.0.0.1:3011/");
  assert.equal(assertSafePlaywrightTarget("http://localhost:3011"), "http://localhost:3011/");
  assert.throws(() => assertSafePlaywrightTarget("http://Serwer:3000"), /localhost or 127\.0\.0\.1|protected production or preview port/i);
  assert.throws(() => assertSafePlaywrightTarget("http://Serwer:3001"), /localhost or 127\.0\.0\.1|protected production or preview port/i);
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
