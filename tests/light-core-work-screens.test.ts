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
  const corePrimitives = read("src/components/core-work-primitives.tsx");

  assert.doesNotMatch(homepage, /radial-gradient/);
  assert.match(homepage, /DashboardDataQualityAlert/);
  assert.match(homepage, /aria-label="Dashboard metrics"/);
  assert.match(homepage, /PipelineSnapshot items=\{pipeline\}/);
  assert.doesNotMatch(homepage, /text-\[0\.68rem\]/);
  assert.match(appShell, /nav aria-label="Primary navigation"/);
  assert.match(appShell, /SheetTrigger/);
  assert.match(appShell, /SheetContent/);
  assert.match(appShell, /Menu/);
  assert.match(appShell, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(appShell, /min-h-0.*overflow-y-auto/);
  assert.doesNotMatch(appShell, /--cb-ui-/);
  assert.match(corePrimitives, /PageSurface/);
  assert.match(corePrimitives, /WorkIndicator/);
  assert.doesNotMatch(corePrimitives, /--cb-ui-/);

  for (const source of [workPage, salesReportPage, leadsPage]) {
    assert.doesNotMatch(source, /<main className="min-h-screen/);
    assert.doesNotMatch(source, /bg-slate-50/);
    assert.doesNotMatch(source, /max-w-7xl/);
  }
  assert.match(leadsPage, /Workspace/);
  assert.match(leadsPage, /PageSurface/);
  assert.match(leadsPage, /LeadTable/);
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
  assert.match(salesReportPage, /tabular-nums/);
  assert.match(salesReportPage, /scope="col"/);
  assert.match(salesReportPage, /caption className="sr-only"/);
  assert.match(salesReportPage, /SurfaceTitle/);
  assert.match(salesReportPage, /TableSurface/);

  assert.match(leadFilters, /fieldset/);
  assert.match(leadFilters, /legend className="sr-only">Filter leads<\/legend>/);
  assert.match(leadFilters, /Result summary/);
  assert.match(leadFilters, /Select/);
  assert.match(leadFilters, /xl:grid-cols-4/);
  assert.match(leadFilters, /resultSummary/);
  assert.match(leadFilters, /Clear filters/);
  assert.doesNotMatch(leadFilters, /Apply filters/);
  assert.match(leadFilters, /<Badge tone="neutral">/);

  assert.match(leadTable, /scope="col"/);
  assert.match(leadTable, /caption className="sr-only"/);
  assert.match(leadTable, /focus-visible:ring-2/);
  assert.match(leadTable, /TableSurface/);
  assert.match(leadTable, /appearance="foundation"/);
  assert.match(leadTable, /tabular-nums/);
  assert.match(leadTable, /text-left sm:text-center/);
  assert.match(leadTable, /No records match the current filters\./);

  assert.match(workPage, /dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"/);
  assert.match(workPage, /xl:grid-cols-4/);
  assert.match(workPage, /WorkIndicator/);
  assert.match(workPage, /SurfaceTitle/);
  assert.match(workPage, /ButtonLink/);
  assert.match(workPage, /tabular-nums/);
  assert.match(workPage, /scope="col"/);
  assert.match(workPage, /caption className="sr-only"/);
  assert.match(workPage, /Quick update/);
  assert.doesNotMatch(
    workPage,
    /Open the day here, see which leads need attention first, and jump straight into the existing quick update form on each lead\./
  );
  assert.match(workPage, /text-left sm:text-center/);
  assert.match(workPage, /No records in this bucket\./);

  assert.match(homepage, /Today's priorities|Today&apos;s priorities|Today&#x27;s priorities/);
  assert.match(homepage, /DashboardDataQualityAlert/);
});

test("leads screen keeps a compact operational header and active filter chips", () => {
  const leadsPage = read("src/app/leads/page.tsx");
  const leadFilters = read("src/components/lead-filters.tsx");

  assert.doesNotMatch(
    leadsPage,
    /Review leads, filter the daily queue, and open each record for operational updates\./
  );
  assert.doesNotMatch(leadsPage, /Current filter/);
  assert.doesNotMatch(leadsPage, /Visible rows/);
  assert.doesNotMatch(leadsPage, /leads\.length === 1 \? "lead" : "leads"/);
  assert.match(leadFilters, /aria-label="Active filters"/);
  assert.match(
    leadFilters,
    /<Badge tone="neutral">/
  );
  assert.match(leadFilters, /filterLabels: Record<keyof FilterOptions, string>/);
  assert.match(leadFilters, /formatFilterValue\(value: string\)/);
  assert.match(leadFilters, /router\.replace\(/);
  assert.match(leadFilters, /useTransition/);
});

test("sales report header stays compact and KPI emphasis is conditional", () => {
  const salesReportPage = read("src/app/reports/sales/page.tsx");

  assert.doesNotMatch(
    salesReportPage,
    /This is a lightweight operational report, not a BI dashboard\./
  );
  assert.match(salesReportPage, /tone="overdue"/);
  assert.match(salesReportPage, /tone="dueToday"/);
  assert.match(salesReportPage, /value > 0/);
  assert.match(salesReportPage, /border-\[color:var\(--cb-danger\)\]\/25/);
  assert.match(salesReportPage, /border-\[color:var\(--cb-warning\)\]\/25/);
  assert.match(salesReportPage, /border-\[color:var\(--cb-border\)\]/);
  assert.match(salesReportPage, /tabular-nums/);
  assert.doesNotMatch(
    salesReportPage,
    /Track the same operational counts, draft states and workbench health used elsewhere in the CRM\./
  );
  assert.doesNotMatch(salesReportPage, /Updated just now|freshness|new Date\(/);
});
