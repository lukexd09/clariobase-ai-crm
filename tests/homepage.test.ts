import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const repoRoot = path.resolve(__dirname, "..");

test("homepage no longer uses the technical skeleton message", () => {
  const pageSource = fs.readFileSync(path.join(repoRoot, "src", "app", "page.tsx"), "utf8");

  assert.doesNotMatch(pageSource, /Technical skeleton is ready/);
  assert.doesNotMatch(pageSource, /Light CRM visual foundation/);
  assert.doesNotMatch(pageSource, /Route/);
  assert.match(pageSource, /Open leads/);
  assert.match(pageSource, /prefetch=\{false\}/);
});

test("homepage exposes a compact operational snapshot", () => {
  const homepageSource = fs.readFileSync(path.join(repoRoot, "src", "lib", "homepage.ts"), "utf8");

  assert.match(homepageSource, /Overdue work/);
  assert.match(homepageSource, /Due today/);
  assert.match(homepageSource, /Waiting for audit/);
  assert.match(homepageSource, /Open duplicate reviews/);
  assert.match(homepageSource, /Latest import/);
});

test("visual direction doc exists and forbids cyber/admin styling", () => {
  const doc = fs.readFileSync(
    path.join(repoRoot, "docs", "design", "light-crm-visual-direction.md"),
    "utf8"
  );

  assert.match(doc, /light-first interface/);
  assert.match(doc, /dark cyber or cyberpunk styling/i);
  assert.match(doc, /design guidance, not as runtime code/i);
});
