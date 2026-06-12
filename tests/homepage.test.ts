import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  HOME_POSITIONING,
  HOME_PRIMARY_ACTION_CARDS,
  HOME_SYSTEM_LINK,
  HOME_STATUS_ITEMS
} from "../src/lib/homepage";

const repoRoot = path.resolve(__dirname, "..");

test("homepage no longer uses the technical skeleton message", () => {
  const pageSource = fs.readFileSync(path.join(repoRoot, "src", "app", "page.tsx"), "utf8");

  assert.doesNotMatch(pageSource, /Technical skeleton is ready/);
  assert.doesNotMatch(pageSource, /Light CRM visual foundation/);
  assert.doesNotMatch(pageSource, /Route/);
  assert.match(pageSource, /Open leads/);
  assert.match(pageSource, /prefetch=\{false\}/);
});

test("homepage exposes the core CRM navigation actions", () => {
  assert.equal(HOME_POSITIONING.includes("review leads"), true);
  assert.deepEqual(
    HOME_PRIMARY_ACTION_CARDS.map((card) => card.href),
    ["/leads", "/work", "/reports/sales", "/imports", "/duplicates"]
  );
  assert.deepEqual(
    HOME_PRIMARY_ACTION_CARDS.map((card) => card.title),
    ["Leads", "Workbench", "Sales report", "Imports", "Duplicates"]
  );
  assert.deepEqual(
    HOME_PRIMARY_ACTION_CARDS.map((card) => card.label),
    ["Pipeline", "Daily work", "Reporting", "Data intake", "Data quality"]
  );
  assert.equal(HOME_SYSTEM_LINK.href, "/health");
  assert.equal(HOME_SYSTEM_LINK.title, "Health check");
  assert.deepEqual(HOME_STATUS_ITEMS, [
    "Lead work stays organized in one CRM workspace.",
    "AI-assisted files stay under your control.",
    "Daily sales work is ready to use."
  ]);
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
