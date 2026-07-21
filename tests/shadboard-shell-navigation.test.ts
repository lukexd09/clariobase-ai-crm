import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger
} from "../src/components/clariobase-ui/sheet";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function extractCbReferences(source: string) {
  return Array.from(source.matchAll(/var\((--cb-[a-z0-9-]+)\)/g), (match) => match[1]);
}

function extractDeclaredTokens(source: string) {
  return Array.from(source.matchAll(/^\s*(--cb-[a-z0-9-]+)\s*:/gm), (match) => match[1]);
}

test("sheet primitive exposes the project-owned dialog boundary and accessible render contract", () => {
  const sheetSource = read("src/components/clariobase-ui/sheet.tsx");

  assert.match(sheetSource, /@radix-ui\/react-dialog/);
  assert.match(sheetSource, /data-slot="sheet-overlay"/);
  assert.match(sheetSource, /data-slot="sheet-content"/);
  assert.match(sheetSource, /data-slot="sheet-close"/);
  assert.match(sheetSource, /data-slot="sheet-trigger"/);
  assert.match(sheetSource, /data-slot="sheet-title"/);
  assert.match(sheetSource, /data-slot="sheet-description"/);
  assert.doesNotMatch(sheetSource, /animate-in/);
  assert.doesNotMatch(sheetSource, /animate-out/);
  assert.doesNotMatch(sheetSource, /--cb-ui-/);
  assert.doesNotMatch(sheetSource, /class-variance-authority/);
  assert.doesNotMatch(sheetSource, /tailwind-merge/);
  assert.doesNotMatch(sheetSource, /clsx/);
  assert.doesNotMatch(sheetSource, /@radix-ui\/react-slot/);
  assert.doesNotMatch(sheetSource, /<details>/);
  assert.doesNotMatch(sheetSource, /<summary>/);

  const markup = renderToStaticMarkup(
    React.createElement(
      Sheet,
      { open: true },
      React.createElement(
        SheetTrigger,
        { asChild: true },
        React.createElement("button", { type: "button" }, "Open")
      ),
      React.createElement(
        SheetContent,
        null,
        React.createElement(SheetTitle, null, "Creator workspace"),
        React.createElement(SheetDescription, null, "Warm, calm navigation."),
        React.createElement(SheetClose, { "aria-label": "Close navigation" }, "Close")
      )
    )
  );

  assert.match(markup, /Open/);
  assert.match(markup, /aria-haspopup="dialog"/);
  assert.match(markup, /aria-expanded="true"/);
  assert.match(markup, /aria-controls="radix-/);
});

test("shell contract keeps the shared shell and /leads integration minimal", () => {
  const shellSource = read("src/components/app-shell.tsx");
  const accountChip = read("src/components/auth/account-chip.tsx");
  const signOutButton = read("src/components/auth/sign-out-button.tsx");
  const leadsPage = read("src/app/leads/page.tsx");
  const notices = read("THIRD_PARTY_NOTICES.md");
  const decision = read("docs/architecture/shadboard-adoption-decision.md");
  const uiDoc = read("docs/design/clariobase-ui-v1.md");
  const packageJson = JSON.parse(read("package.json")) as {
    dependencies: Record<string, string>;
  };

  assert.match(shellSource, /min-\[1024px\]:grid-cols-\[240px_minmax\(0,1fr\)\]/);
  assert.match(shellSource, /min-h-0.*overflow-y-auto/);
  assert.match(shellSource, /SheetTrigger/);
  assert.match(shellSource, /SheetContent/);
  assert.match(shellSource, /SheetClose/);
  assert.match(shellSource, /AccountChip/);
  assert.match(shellSource, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(shellSource, /t\("shell\.workspace"\)/);
  assert.doesNotMatch(shellSource, /Łukasz Chmiel/);
  assert.doesNotMatch(shellSource, /Operator/);
  assert.doesNotMatch(shellSource, /pathname === "\/leads"/);
  assert.doesNotMatch(shellSource, /<details>/);
  assert.doesNotMatch(shellSource, /<summary>/);
  assert.doesNotMatch(shellSource, /ProofShell/);
  assert.doesNotMatch(shellSource, /Support|Settings|notifications|calendar|logout|account menu/i);
  assert.doesNotMatch(shellSource, /--cb-ui-/);
  assert.doesNotMatch(shellSource, /--cb-accentForeground/);
  assert.match(shellSource, /--cb-accent-foreground/);
  assert.equal((shellSource.match(/<main\b/g) ?? []).length, 1);

  const globalsSource = read("src/app/globals.css");
  const referencedTokens = new Set([
    ...extractCbReferences(shellSource),
    ...extractCbReferences(read("src/components/clariobase-ui/sheet.tsx"))
  ]);
  const declaredTokens = new Set(extractDeclaredTokens(globalsSource));
  const missingTokens = [...referencedTokens].filter((token) => !declaredTokens.has(token)).sort();

  assert.equal(
    missingTokens.length,
    0,
    `Missing declared CSS custom properties: ${missingTokens.length > 0 ? missingTokens.join(", ") : "(none)"}`
  );
  assert.match(globalsSource, /html\s*\{\s*scrollbar-gutter:\s*stable;\s*\}/s);

  assert.match(shellSource, /aria-hidden="true"/);
  assert.match(accountChip, /authClient\.useSession\(\)/);
  assert.match(accountChip, /SignOutButton/);
  assert.match(accountChip, /router\.push\("\/sign-in"\)/);
  assert.match(accountChip, /auth\.account\.signIn/);
  assert.match(signOutButton, /authClient\.signOut/);
  assert.match(signOutButton, /router\.push\("\/sign-in"\)/);

  assert.match(leadsPage, /getLeadPage/);
  assert.match(leadsPage, /getLeadFilterOptions/);
  assert.match(leadsPage, /normalizeLeadFilters/);
  assert.match(leadsPage, /LeadFilters/);
  assert.match(leadsPage, /LeadTable/);
  assert.match(leadsPage, /LeadPagination/);
  assert.doesNotMatch(leadsPage, /ProofShell/);
  assert.doesNotMatch(leadsPage, /<main className=/);
  assert.match(leadsPage, /PageSurface/);
  assert.match(leadsPage, /t\("leads\.eyebrow"\)/);
  assert.doesNotMatch(leadsPage, /<main className=/);

  assert.match(packageJson.dependencies["@radix-ui/react-dialog"], /1\.1\.3/);
  assert.match(packageJson.dependencies["lucide-react"], /0\.446\.0/);

  assert.match(notices, /@radix-ui\/react-dialog/);
  assert.match(notices, /lucide-react/);
  assert.match(notices, /starter-kit\/src\/components\/ui\/sheet\.tsx/);
  assert.match(notices, /src\/components\/clariobase-ui\/sheet\.tsx/);
  assert.match(notices, /classification: substantially adapted/);

  assert.match(decision, /starter-kit\/src\/components\/ui\/sheet\.tsx/);
  assert.match(decision, /src\/components\/clariobase-ui\/sheet\.tsx/);
  assert.match(decision, /starter-kit\/src\/components\/ui\/sidebar\.tsx/);
  assert.match(decision, /src\/components\/app-shell\.tsx/);
  assert.match(decision, /reference-only/);
  assert.match(decision, /substantially adapted/);
  assert.match(uiDoc, /Warm off-white background/);
  assert.match(uiDoc, /mobile horizontal padding: 16px/);
  assert.match(uiDoc, /desktop maximum content width: approximately 1600px/);
});
