import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("health and remaining light baseline screens keep the shell contract", () => {
  const healthPage = read("src/app/health/page.tsx");

  assert.match(healthPage, /System status/);
  assert.doesNotMatch(healthPage, /Minimal runtime probe for deployment and uptime checks\./);
  assert.match(healthPage, /Health check/);
  assert.match(healthPage, /break-all/);
});
