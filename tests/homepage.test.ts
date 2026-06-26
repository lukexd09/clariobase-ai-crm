import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

test("dashboard page exposes the production priorities and pipeline snapshot", () => {
  const pageSource = fs.readFileSync(path.join(repoRoot, "src", "app", "page.tsx"), "utf8");

  assert.match(pageSource, /PageHeader title="Dashboard"/);
  assert.match(pageSource, /Your priorities for 21 June 2026/);
  assert.match(pageSource, /Lumina PMU Studio/);
  assert.match(pageSource, /Aurora Nail Studio/);
  assert.match(pageSource, /Sienna Dental Care/);
  assert.match(pageSource, /Velvet Brows & Lashes/);
  assert.match(pageSource, /3 possible duplicates need review/);
  assert.match(pageSource, /actionLabel="Review"/);
  assert.match(pageSource, /tone="warning"/);
  assert.doesNotMatch(pageSource, /Focus on Conversion/);
  assert.doesNotMatch(pageSource, /motivational quote/i);
  assert.doesNotMatch(pageSource, /stock image/i);
  assert.doesNotMatch(pageSource, /StatusBadge>.*deadline/i);
  assert.doesNotMatch(pageSource, /4 active tasks/);
});
