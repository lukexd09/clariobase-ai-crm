import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NAVIGATION_SECTIONS, isNavigationItemActive } from "../src/lib/navigation";

const repoRoot = path.resolve(__dirname, "..");

test("navigation config keeps business routes separate from system routes", () => {
  const mainRoutes = NAVIGATION_SECTIONS.filter((section) => section.key !== "system").flatMap(
    (section) => section.items
  );
  const systemRoutes = NAVIGATION_SECTIONS.find((section) => section.key === "system")?.items ?? [];

  assert.deepEqual(
    mainRoutes.map((item) => item.href),
    ["/", "/work", "/leads", "/reports/sales", "/imports", "/duplicates"]
  );
  assert.deepEqual(systemRoutes.map((item) => item.href), ["/health"]);
  assert.ok(mainRoutes.every((item) => item.priority === "primary"));
  assert.ok(systemRoutes.every((item) => item.priority === "secondary"));
});

test("navigation activity helper handles nested routes", () => {
  assert.equal(isNavigationItemActive("/", "/"), true);
  assert.equal(isNavigationItemActive("/", "/work"), false);
  assert.equal(isNavigationItemActive("/work", "/work"), true);
  assert.equal(isNavigationItemActive("/work", "/work/123"), true);
  assert.equal(isNavigationItemActive("/work", "/leads"), false);
});

test("app shell source uses semantic navigation and focus-visible styles", () => {
  const shellSource = fs.readFileSync(path.join(repoRoot, "src", "components", "app-shell.tsx"), "utf8");

  assert.match(shellSource, /nav aria-label="Main navigation"/);
  assert.match(shellSource, /details className="group mt-4 rounded-2xl/);
  assert.match(shellSource, /focus-visible:outline-none/);
  assert.match(shellSource, /aria-current=\{active \? "page" : undefined\}/);
  assert.doesNotMatch(shellSource, /pathname === "\/"\)\s*\{\s*return <>\{children\}<\/>;/s);
  assert.match(shellSource, /prefetch=\{false\}/);
});
