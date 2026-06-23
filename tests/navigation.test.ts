import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NAVIGATION_GROUPS, isNavigationItemActive } from "../src/lib/navigation";

const repoRoot = path.resolve(__dirname, "..");

test("navigation config keeps canonical production groups", () => {
  assert.deepEqual(
    NAVIGATION_GROUPS.map((group) => group.title),
    ["Workspace", "Data quality", "System"]
  );
  assert.deepEqual(
    NAVIGATION_GROUPS.flatMap((group) => group.items).map((item) => item.href),
    ["/", "/work", "/leads", "/reports/sales", "/imports", "/duplicates", "/health"]
  );
  assert.ok(!NAVIGATION_GROUPS.flatMap((group) => group.items).some((item) => item.label === "Support"));
  assert.ok(!NAVIGATION_GROUPS.flatMap((group) => group.items).some((item) => item.label === "Settings"));
  assert.ok(!NAVIGATION_GROUPS.flatMap((group) => group.items).some((item) => item.href.startsWith("/ux-prototype")));
});

test("navigation activity helper handles dashboard and nested routes", () => {
  assert.equal(isNavigationItemActive("/", "/"), true);
  assert.equal(isNavigationItemActive("/", "/work"), false);
  assert.equal(isNavigationItemActive("/work", "/work"), true);
  assert.equal(isNavigationItemActive("/work", "/work/123"), true);
  assert.equal(isNavigationItemActive("/duplicates", "/duplicates/dup-1"), true);
});

test("app shell source uses semantic primary and compact navigation", () => {
  const shellSource = fs.readFileSync(path.join(repoRoot, "src", "components", "app-shell.tsx"), "utf8");

  assert.match(shellSource, /aria-label="Primary navigation"/);
  assert.match(shellSource, /aria-label="Compact navigation"/);
  assert.match(shellSource, /min-\[1100px\]:grid/);
  assert.match(shellSource, /min-\[1100px\]:flex/);
  assert.match(shellSource, /min-\[1100px\]:hidden/);
  assert.match(shellSource, /clamp\(212px,14vw,236px\)/);
  assert.match(shellSource, /ClarioBase/);
  assert.match(shellSource, /Menu/);
  assert.match(shellSource, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(shellSource, /focus-visible:ring-\[#006194\]/);
  assert.match(shellSource, /Łukasz Chmiel/);
  assert.match(shellSource, /Operator/);
  assert.doesNotMatch(shellSource, /Notifications/);
  assert.doesNotMatch(shellSource, /21 June 2026/);
  assert.doesNotMatch(shellSource, /Single Operator CRM/);
  assert.doesNotMatch(shellSource, /Current/);
  assert.doesNotMatch(shellSource, /Keep the app check handy\./);
  assert.doesNotMatch(shellSource, /Sign out/);
  assert.doesNotMatch(shellSource, /Account menu coming soon\./);
  assert.doesNotMatch(shellSource, /<details>/);
  assert.doesNotMatch(shellSource, /<summary>/);
  assert.doesNotMatch(shellSource, /▾/);
  assert.doesNotMatch(shellSource, /Support/);
  assert.doesNotMatch(shellSource, /Settings/);
  assert.doesNotMatch(shellSource, /Overview Dashboard/);
});
