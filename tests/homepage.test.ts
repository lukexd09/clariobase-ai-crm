import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { HOME_ACTION_CARDS, HOME_POSITIONING } from "../src/lib/homepage";

const repoRoot = path.resolve(__dirname, "..");

test("homepage no longer uses the technical skeleton message", () => {
  const pageSource = fs.readFileSync(path.join(repoRoot, "src", "app", "page.tsx"), "utf8");

  assert.doesNotMatch(pageSource, /Technical skeleton is ready/);
  assert.match(pageSource, /Light CRM visual foundation/);
  assert.match(pageSource, /Open leads/);
});

test("homepage exposes the core CRM navigation actions", () => {
  assert.equal(HOME_POSITIONING.includes("calm, light CRM entry point"), true);
  assert.deepEqual(
    HOME_ACTION_CARDS.map((card) => card.href),
    ["/leads", "/work", "/reports/sales", "/imports", "/duplicates", "/health"]
  );
  assert.deepEqual(
    HOME_ACTION_CARDS.map((card) => card.title),
    ["Leads", "Workbench", "Sales report", "Imports", "Duplicates", "Health check"]
  );
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
