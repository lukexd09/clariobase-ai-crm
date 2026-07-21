import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NAVIGATION_GROUPS, isNavigationItemActive } from "../src/lib/navigation";
import { createTranslator } from "../src/i18n/translate";

const repoRoot = path.resolve(__dirname, "..");

test("navigation config keeps canonical production groups", () => {
  assert.deepEqual(
    NAVIGATION_GROUPS.map((group) => group.titleKey),
    ["navigation.group.workspace", "navigation.group.dataQuality", "navigation.group.system"]
  );
  assert.deepEqual(
    NAVIGATION_GROUPS.flatMap((group) => group.items).map((item) => item.href),
    ["/", "/work", "/leads", "/reports/sales", "/imports", "/duplicates", "/health"]
  );
  assert.deepEqual(
    NAVIGATION_GROUPS.flatMap((group) => group.items).map((item) => item.icon),
    ["dashboard", "work", "leads", "sales", "imports", "duplicates", "health"]
  );
  assert.deepEqual(
    NAVIGATION_GROUPS.flatMap((group) => group.items).map((item) => item.labelKey),
    ["navigation.dashboard", "navigation.work", "navigation.leads", "navigation.sales", "navigation.imports", "navigation.duplicates", "navigation.health"]
  );
  const english = createTranslator("en-US");
  const polish = createTranslator("pl-PL");
  assert.deepEqual(NAVIGATION_GROUPS.flatMap((group) => group.items).map((item) => english(item.labelKey)), ["Dashboard", "Daily work", "Leads", "Operations", "Imports", "Possible duplicates", "System status"]);
  assert.deepEqual(NAVIGATION_GROUPS.flatMap((group) => group.items).map((item) => polish(item.labelKey)), ["Pulpit", "Panel pracy", "Leady", "Operacje", "Importy", "Potencjalne duplikaty", "Stan systemu"]);
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
  const accountChip = fs.readFileSync(path.join(repoRoot, "src", "components", "auth", "account-chip.tsx"), "utf8");
  const signOutButton = fs.readFileSync(path.join(repoRoot, "src", "components", "auth", "sign-out-button.tsx"), "utf8");

  assert.match(shellSource, /min-\[1024px\]:grid-cols-\[240px_minmax\(0,1fr\)\]/);
  assert.match(shellSource, /min-\[1024px\]:flex/);
  assert.match(shellSource, /min-\[1024px\]:hidden/);
  assert.match(shellSource, /ClarioBase/);
  assert.match(shellSource, /useI18n/);
  assert.match(shellSource, /shell\.workspace/);
  assert.match(shellSource, /shell\.menu/);
  assert.match(shellSource, /SheetTrigger/);
  assert.match(shellSource, /SheetContent/);
  assert.match(shellSource, /SheetClose/);
  assert.match(shellSource, /AccountChip/);
  assert.match(shellSource, /shell\.closeNavigation/);
  assert.match(shellSource, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(shellSource, /aria-hidden="true"/);
  assert.match(shellSource, /bg-\[color:var\(--cb-accent\)\]/);
  assert.match(shellSource, /focus-visible:ring-\[color:var\(--cb-focus-ring\)\]/);
  assert.doesNotMatch(shellSource, /--cb-ui-/);
  assert.doesNotMatch(shellSource, /Łukasz Chmiel/);
  assert.doesNotMatch(shellSource, /Operator/);
  assert.doesNotMatch(shellSource, /Support/);
  assert.doesNotMatch(shellSource, /Settings/);
  assert.doesNotMatch(shellSource, /notifications/i);
  assert.doesNotMatch(shellSource, /calendar/i);
  assert.doesNotMatch(shellSource, /logout/i);
  assert.doesNotMatch(shellSource, /account menu/i);
  assert.doesNotMatch(shellSource, /<details>/);
  assert.doesNotMatch(shellSource, /<summary>/);
  assert.doesNotMatch(shellSource, /ProofShell/);
  assert.doesNotMatch(shellSource, /pathname === "\/leads"/);
  assert.doesNotMatch(shellSource, /<main className="min-h-screen/);
  assert.match(accountChip, /authClient\.useSession\(\)/);
  assert.match(accountChip, /SignOutButton/);
  assert.match(accountChip, /router\.push\("\/sign-in"\)/);
  assert.match(accountChip, /auth\.account\.signIn/);
  assert.match(signOutButton, /authClient\.signOut/);
  assert.match(signOutButton, /router\.push\("\/sign-in"\)/);
});
