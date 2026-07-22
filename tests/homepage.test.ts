import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

test("dashboard route loads CRM data after authentication and passes a server-built view model", () => {
  const routeSource = fs.readFileSync(path.join(repoRoot, "src", "app", "page.tsx"), "utf8");
  const pageSource = fs.readFileSync(path.join(repoRoot, "src", "components", "dashboard-page.tsx"), "utf8");

  assert.match(routeSource, /from "@\/components\/dashboard-page"/);
  assert.match(routeSource, /SignInForm/);
  assert.match(routeSource, /getCurrentUser/);
  assert.match(pageSource, /<h1 className="text-\[2rem\]/);
  assert.match(pageSource, /t\("dashboard\.prioritiesFor"/);
  assert.match(pageSource, /aria-label=\{t\("dashboard\.metrics"\)\}/);
  assert.match(routeSource, /Promise\.all/);
  assert.match(routeSource, /getLeads\(\)/);
  assert.match(routeSource, /getActiveDuplicateCandidateCount\(\)/);
  assert.match(routeSource, /buildDashboardData\(leads, activeDuplicateCount, now\)/);
  assert.match(routeSource, /<DashboardPage data=\{dashboard\}/);
  assert.match(pageSource, /DashboardDataQualityAlert/);
  assert.match(pageSource, /data\.metrics\.map/);
  assert.match(pageSource, /data\.operationalDate/);
  assert.doesNotMatch(pageSource, /2026-06-21|Lumina PMU Studio|Aurora Nail Studio|Sienna Dental Care|Velvet Brows/);
  assert.doesNotMatch(pageSource, /Focus on Conversion/);
  assert.doesNotMatch(pageSource, /motivational quote/i);
  assert.doesNotMatch(pageSource, /stock image/i);
  assert.doesNotMatch(pageSource, /4 active tasks/);
});
