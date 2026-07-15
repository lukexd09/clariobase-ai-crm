import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

test("dashboard page exposes the production priorities and pipeline snapshot", () => {
  const routeSource = fs.readFileSync(path.join(repoRoot, "src", "app", "page.tsx"), "utf8");
  const pageSource = fs.readFileSync(path.join(repoRoot, "src", "components", "dashboard-page.tsx"), "utf8");

  assert.match(routeSource, /from "@\/components\/dashboard-page"/);
  assert.match(routeSource, /SignInForm/);
  assert.match(routeSource, /getCurrentUser/);
  assert.match(pageSource, /<h1 className="text-\[2rem\]/);
  assert.match(pageSource, /Your priorities for 21 June 2026/);
  assert.match(pageSource, /aria-label="Dashboard metrics"/);
  assert.match(pageSource, /Lumina PMU Studio/);
  assert.match(pageSource, /Aurora Nail Studio/);
  assert.match(pageSource, /Sienna Dental Care/);
  assert.match(pageSource, /Velvet Brows & Lashes/);
  assert.match(pageSource, /DashboardDataQualityAlert/);
  assert.match(pageSource, /MetricCard label="Overdue" value="2" tone="danger"/);
  assert.match(pageSource, /aria-label="Dashboard metrics"/);
  assert.doesNotMatch(pageSource, /Focus on Conversion/);
  assert.doesNotMatch(pageSource, /motivational quote/i);
  assert.doesNotMatch(pageSource, /stock image/i);
  assert.doesNotMatch(pageSource, /4 active tasks/);
});
