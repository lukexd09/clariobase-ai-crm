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
  assert.match(salesReportPage, /tabular-nums/);
  assert.match(salesReportPage, /scope="col"/);
  assert.match(salesReportPage, /caption className="sr-only"/);

  assert.match(leadFilters, /fieldset/);
  assert.match(leadFilters, /legend className="sr-only">Filter leads<\/legend>/);
  assert.match(leadFilters, /h-10/);
  assert.match(leadFilters, /text-sm font-medium text-slate-700/);
  assert.match(leadFilters, /xl:grid-cols-\[repeat\(4,minmax\(150px,1fr\)\)\]/);
  assert.match(leadFilters, /focus-visible:ring-2/);
  assert.match(leadFilters, /resultSummary/);
  assert.match(leadFilters, /Clear filters/);
  assert.doesNotMatch(leadFilters, /Apply filters/);

  assert.match(leadTable, /scope="col"/);
  assert.match(leadTable, /caption className="sr-only"/);
  assert.match(leadTable, /focus-visible:ring-2/);
  assert.match(leadTable, /font-semibold text-slate-900 transition hover:text-sky-700 hover:underline/);
  assert.match(leadTable, /tabular-nums/);

  assert.match(workPage, /grid-cols-2/);
  assert.match(workPage, /xl:grid-cols-4/);
  assert.match(workPage, /getWorkIndicatorStyles\(key: WorkBucketKey, count: number\)/);
  assert.match(workPage, /if \(count === 0\) \{/);
  assert.match(workPage, /return workIndicatorToneMap\[key\];/);
  assert.match(workPage, /border-rose-200 bg-rose-50/);
  assert.match(workPage, /border-amber-200 bg-amber-50/);
  assert.match(workPage, /border-sky-200 bg-sky-50/);
  assert.match(workPage, /border-violet-200 bg-violet-50/);
  assert.match(workPage, /min-h-16 items-center justify-between gap-4 rounded-2xl border px-4 py-3/);
  assert.match(workPage, /flex min-w-0 items-center gap-2/);
  assert.match(workPage, /min-w-0 text-xs font-semibold uppercase tracking-\[0\.12em\]/);
  assert.match(workPage, /shrink-0 text-right text-2xl font-semibold leading-none tabular-nums text-slate-950/);
  assert.match(workPage, /h-2\.5 w-2\.5 shrink-0 rounded-full/);
  assert.match(workPage, /inline-flex min-h-9 whitespace-nowrap items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium/);
  assert.match(workPage, /tabular-nums/);
  assert.match(workPage, /scope="col"/);
  assert.match(workPage, /caption className="sr-only"/);
  assert.doesNotMatch(
    workPage,
    /Open the day here, see which leads need attention first, and jump straight into the existing quick update form on each lead\./
  );

  assert.match(homepage, /focus-visible:ring-2/);
  assert.match(homepage, /text-xs font-semibold uppercase tracking-\[0\.24em\]/);
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
  assert.match(leadFilters, /min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700/);
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
  assert.match(salesReportPage, /text-xs font-semibold uppercase tracking-\[0\.3em\] text-sky-700/);
  assert.match(salesReportPage, /tone="overdue"/);
  assert.match(salesReportPage, /tone="dueToday"/);
  assert.match(salesReportPage, /value > 0/);
  assert.match(salesReportPage, /border-rose-200 bg-rose-50/);
  assert.match(salesReportPage, /border-amber-200 bg-amber-50/);
  assert.match(salesReportPage, /border-slate-200 bg-white/);
  assert.match(salesReportPage, /tabular-nums/);
  assert.doesNotMatch(salesReportPage, /Updated just now|freshness|new Date\(/);
});
