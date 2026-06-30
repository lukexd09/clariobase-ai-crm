import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import DashboardPage from "@/app/page";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function count(markup: string, tag: string) {
  return (markup.match(new RegExp(`<${tag}\\b`, "g")) ?? []).length;
}

test("dashboard renders the exact business contract", () => {
  const markup = renderToStaticMarkup(React.createElement(DashboardPage));

  assert.equal(count(markup, "h1"), 1);
  assert.match(markup, /Dashboard/);
  assert.match(markup, /Your priorities for 21 June 2026/);
  assert.doesNotMatch(markup, /Operational snapshot/);
  assert.match(markup, /aria-label="Dashboard metrics"/);
  assert.equal((markup.match(/aria-label="Dashboard metrics"/g) ?? []).length, 1);
  assert.equal((markup.match(/<dt\b/g) ?? []).length, 9);
  assert.equal((markup.match(/<dd\b/g) ?? []).length, 9);
  assert.match(markup, /Overdue/);
  assert.match(markup, /Due today/);
  assert.match(markup, /Upcoming/);
  assert.match(markup, /No next action/);
  assert.match(markup, /Today(?:&#x27;|&apos;|')s priorities/);
  assert.equal((markup.match(/<ol\b/g) ?? []).length, 1);
  assert.equal((markup.match(/<li\b/g) ?? []).length, 4);
  assert.equal((markup.match(/<article\b/g) ?? []).length, 4);
  assert.match(markup, /Lumina PMU Studio/);
  assert.match(markup, /Aurora Nail Studio/);
  assert.match(markup, /Sienna Dental Care/);
  assert.match(markup, /Velvet Brows &amp; Lashes/);
  assert.match(markup, /Send revised proposal/);
  assert.match(markup, /Confirm booking flow/);
  assert.match(markup, /Send mini-audit summary/);
  assert.match(markup, /Schedule the next follow-up/);
  assert.match(markup, /aria-label="Open Lumina PMU Studio"/);
  assert.match(markup, /aria-label="Open Aurora Nail Studio"/);
  assert.match(markup, /aria-label="Open Sienna Dental Care"/);
  assert.match(markup, /aria-label="Open Velvet Brows &amp; Lashes"/);
  assert.match(markup, /Deadline:/);
  assert.match(markup, /href="\/leads"/);
  assert.match(markup, /Pipeline snapshot/);
  assert.equal((markup.match(/<dt[^>]*>New<\/dt>/g) ?? []).length, 1);
  assert.equal((markup.match(/<dd[^>]*>18<\/dd>/g) ?? []).length, 1);
  assert.equal((markup.match(/<dt[^>]*>Contacted<\/dt>/g) ?? []).length, 1);
  assert.equal((markup.match(/<dd[^>]*>12<\/dd>/g) ?? []).length, 1);
  assert.equal((markup.match(/<dt[^>]*>Qualified<\/dt>/g) ?? []).length, 1);
  assert.equal((markup.match(/<dd[^>]*>7<\/dd>/g) ?? []).length, 1);
  assert.equal((markup.match(/<dt[^>]*>Proposal sent<\/dt>/g) ?? []).length, 1);
  assert.equal((markup.match(/<dd[^>]*>5<\/dd>/g) ?? []).length, 1);
  assert.match(markup, /<dt[^>]*>Won<\/dt><dd[^>]*>2<\/dd>/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /Data quality warning/);
  assert.match(markup, /3 possible duplicates need review/);
  assert.match(markup, /href="\/duplicates"/);
});

test("dashboard source only uses approved primitives and canonical tokens", () => {
  const page = read("src/app/page.tsx");
  const primitives = read("src/components/dashboard-primitives.tsx");
  const globalsCss = read("src/app/globals.css");
  const packageJson = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };

  assert.match(page, /from "@\/components\/dashboard-primitives"/);
  assert.match(page, /from "@\/components\/clariobase-ui"/);
  assert.match(primitives, /from "@\/components\/clariobase-ui"/);
  assert.match(primitives, /DashboardDataQualityAlert/);
  assert.doesNotMatch(primitives, /export function PageHeader|export function Alert|export function StatusBadge/);
  assert.match(primitives, /Badge/);
  assert.match(primitives, /ButtonLink/);
  assert.match(primitives, /SurfaceHeader/);
  assert.match(primitives, /SurfaceTitle/);
  assert.match(primitives, /SurfaceContent/);
  assert.match(primitives, /SurfaceDescription/);
  assert.match(primitives, /aria-label={`Open \$\{company\}`}/);
  assert.doesNotMatch(page, /shadboard|starter-kit|demo/i);
  assert.doesNotMatch(primitives, /shadboard|starter-kit|demo/i);
  assert.doesNotMatch(page, /#[0-9A-Fa-f]{3,6}/);
  assert.doesNotMatch(primitives, /#[0-9A-Fa-f]{3,6}/);
  assert.doesNotMatch(page, /--cb-ui-/);
  assert.doesNotMatch(primitives, /--cb-ui-/);
  assert.doesNotMatch(page, /bg-slate-|text-slate-|border-slate-|focus-visible:ring-\[#/);
  assert.doesNotMatch(primitives, /bg-slate-|text-slate-|border-slate-|focus-visible:ring-\[#/);
  assert.doesNotMatch(primitives, /@radix-ui|lucide-react|class-variance-authority|tailwind-merge|from "clsx"|from 'clsx'/);
  assert.match(primitives, /<dt className="text-xs font-semibold uppercase tracking-\[0\.16em\] text-\[color:var\(--cb-muted-foreground\)\]">/);
  assert.match(primitives, /<dd className="font-semibold tabular-nums text-\[color:var\(--cb-foreground\)\]">/);
  assert.equal(packageJson.dependencies["@radix-ui/react-dialog"], "1.1.3");
  assert.equal(packageJson.dependencies["lucide-react"], "0.446.0");

  const referencedTokens = [...page.matchAll(/var\((--cb-[^)]+)\)/g), ...primitives.matchAll(/var\((--cb-[^)]+)\)/g)].map((match) => match[1]);
  const declaredTokens = new Set([...globalsCss.matchAll(/(--cb-[A-Za-z0-9-]+):/g)].map((match) => match[1]));

  assert.ok(referencedTokens.length > 0);
  for (const token of referencedTokens) {
    assert.ok(declaredTokens.has(token), `Missing token declaration for ${token}`);
  }
});

test("dashboard accessibility contract remains semantic", () => {
  const markup = renderToStaticMarkup(React.createElement(DashboardPage));

  assert.equal(count(markup, "h2"), 3);
  assert.match(markup, /<dl/);
  assert.match(markup, /<dt\b/);
  assert.match(markup, /<dd\b/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /focus-visible:ring/);
  assert.match(markup, /Open<\/a>/);
  assert.match(markup, /Review<\/a>/);
  assert.doesNotMatch(markup, /icon-only/i);
});
