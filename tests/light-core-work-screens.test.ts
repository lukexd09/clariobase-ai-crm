import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("core CRM work screens use the light shell baseline", () => {
  const homepage = read("src/app/page.tsx");
  const appShell = read("src/components/app-shell.tsx");
  const workPage = read("src/app/work/page.tsx");
  const leadsPage = read("src/app/leads/page.tsx");
  const salesReportPage = read("src/app/reports/sales/page.tsx");

  assert.doesNotMatch(homepage, /radial-gradient/);
  assert.match(homepage, /bg-slate-50/);
  assert.match(homepage, /focus-visible:ring-2/);
  assert.doesNotMatch(homepage, /text-\[0\.68rem\]/);
  assert.match(appShell, /lg:w-72/);

  for (const source of [workPage, leadsPage, salesReportPage]) {
    assert.match(source, /bg-slate-50/);
    assert.doesNotMatch(source, /max-w-7xl/);
  }
});

test("core CRM work screens keep semantic light status pills and accessible tables", () => {
  const homepage = read("src/app/page.tsx");
  const workPage = read("src/app/work/page.tsx");
  const leadsPage = read("src/app/leads/page.tsx");
  const salesReportPage = read("src/app/reports/sales/page.tsx");
  const leadFilters = read("src/components/lead-filters.tsx");
  const leadTable = read("src/components/lead-table.tsx");
  const statusPill = read("src/components/lead-status-pill.tsx");

  assert.match(statusPill, /const lightVariants: Record<string, string> = \{/);
  assert.match(statusPill, /appearance === "light" \? lightVariants\[value\] \?\? lightVariants\.UNKNOWN : variants\[value\]/);
  assert.match(statusPill, /UNKNOWN: "bg-white text-slate-700 border-slate-200 shadow-sm"/);
  assert.match(statusPill, /NEW: "bg-sky-50 text-sky-700 border-sky-200"/);
  assert.match(statusPill, /URGENT: "bg-red-50 text-red-700 border-red-200"/);
  assert.match(statusPill, /CLARITY: "bg-cyan-50 text-cyan-700 border-cyan-200"/);
  assert.match(statusPill, /MOMENTUM: "bg-emerald-50 text-emerald-700 border-emerald-200"/);
  assert.match(statusPill, /NOT_FIT: "bg-rose-50 text-rose-700 border-rose-200"/);

  assert.doesNotMatch(salesReportPage, /\bHome\b/);
  assert.doesNotMatch(salesReportPage, /Open workbench/);
  assert.doesNotMatch(salesReportPage, /Open leads/);
  assert.match(salesReportPage, /md:grid-cols-2 lg:grid-cols-3/);
  assert.match(salesReportPage, /scope="col"/);
  assert.match(salesReportPage, /caption className="sr-only"/);

  assert.match(leadFilters, /bg-sky-600/);
  assert.match(leadFilters, /text-white/);
  assert.match(leadFilters, /xl:grid-cols-\[repeat\(4,minmax\(0,1fr\)\)_auto\]/);
  assert.match(leadFilters, /focus-visible:ring-2/);

  assert.match(leadTable, /scope="col"/);
  assert.match(leadTable, /caption className="sr-only"/);
  assert.match(leadTable, /focus-visible:ring-2/);

  assert.match(workPage, /grid-cols-2/);
  assert.match(workPage, /xl:grid-cols-4/);
  assert.match(workPage, /scope="col"/);
  assert.match(workPage, /caption className="sr-only"/);

  assert.match(homepage, /focus-visible:ring-2/);
});
