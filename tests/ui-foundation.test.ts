import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

test("globals.css uses a light-first baseline", () => {
  const globalsCss = fs.readFileSync(path.join(repoRoot, "src", "app", "globals.css"), "utf8");

  assert.match(globalsCss, /color-scheme:\s*light;/);
  assert.doesNotMatch(globalsCss, /color-scheme:\s*dark;/);
  assert.match(globalsCss, /background:\s*#f8fafc;/);
  assert.doesNotMatch(globalsCss, /background:\s*#020617;/);
});

test("global foundation keeps readable default text color", () => {
  const globalsCss = fs.readFileSync(path.join(repoRoot, "src", "app", "globals.css"), "utf8");

  assert.match(globalsCss, /color:\s*#0f172a;/);
});
