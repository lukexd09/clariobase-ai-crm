import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  HOME_POSITIONING,
  HOME_PRIMARY_ACTION_CARDS,
  HOME_SECONDARY_ACTIONS,
  HOME_SYSTEM_LINK,
  HOME_STATUS_ITEMS
} from "../src/lib/homepage";

const repoRoot = path.resolve(__dirname, "..");

test("homepage no longer uses the technical skeleton message", () => {
  const pageSource = fs.readFileSync(path.join(repoRoot, "src", "app", "page.tsx"), "utf8");

  assert.doesNotMatch(pageSource, /Technical skeleton is ready/);
  assert.doesNotMatch(pageSource, /Light CRM visual foundation/);
  assert.doesNotMatch(pageSource, /Route/);
  assert.match(pageSource, /HOME_PRIMARY_ACTION_CARDS\.map/);
  assert.match(pageSource, /HOME_SECONDARY_ACTIONS\.map/);
  assert.match(pageSource, /HOME_SYSTEM_LINK\.href/);
  assert.match(pageSource, /prefetch=\{false\}/);
  assert.match(pageSource, /bg-sky-700/);
  assert.match(pageSource, /hover:bg-sky-800/);
  assert.match(pageSource, /focus-visible:ring-2/);
});

test("homepage exposes the core CRM navigation actions", () => {
  assert.match(HOME_POSITIONING, /review leads/i);
  assert.deepEqual(
    HOME_PRIMARY_ACTION_CARDS.map((card) => card.href),
    ["/leads", "/work", "/reports/sales"]
  );
  assert.deepEqual(
    HOME_PRIMARY_ACTION_CARDS.map((card) => card.title),
    ["Leads", "Workbench", "Sales report"]
  );
  assert.deepEqual(
    HOME_PRIMARY_ACTION_CARDS.map((card) => card.label),
    ["Pipeline", "Daily work", "Reporting"]
  );
  assert.deepEqual(
    HOME_SECONDARY_ACTIONS.map((card) => card.href),
    ["/imports", "/duplicates"]
  );
  assert.equal(HOME_SYSTEM_LINK.href, "/health");
  assert.equal(HOME_SYSTEM_LINK.title, "Health check");
  assert.deepEqual(HOME_STATUS_ITEMS, [
    "Lead work stays visible without dashboard clutter.",
    "Imports and duplicate review stay available without taking over the page.",
    "System checks stay secondary but easy to reach."
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
