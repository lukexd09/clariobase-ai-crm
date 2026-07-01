import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("t005 sources stay inside the project-owned ui boundary and avoid ui token drift", () => {
  const files = [
    "src/app/leads/page.tsx",
    "src/app/work/page.tsx",
    "src/app/reports/sales/page.tsx",
    "src/components/lead-filters.tsx",
    "src/components/lead-pagination.tsx",
    "src/components/lead-table.tsx",
    "src/components/core-work-primitives.tsx"
  ];

  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /--cb-ui-/);
    assert.doesNotMatch(source, /bg-(slate|rose|amber|sky|violet)-/);
    assert.doesNotMatch(source, /text-(slate|rose|amber|sky|violet)-/);
    assert.doesNotMatch(source, /border-(slate|rose|amber|sky|violet)-/);
  }

  assert.match(read("src/app/leads/page.tsx"), /PageSurface/);
  assert.match(read("src/app/work/page.tsx"), /SurfaceHeader/);
  assert.match(read("src/app/reports/sales/page.tsx"), /TableSurface/);
  assert.match(read("src/components/lead-filters.tsx"), /Select/);
  assert.match(read("src/components/lead-pagination.tsx"), /ButtonLink/);
  assert.match(read("src/components/lead-table.tsx"), /TableSurface/);
  assert.doesNotMatch(read("src/components/core-work-primitives.tsx"), /export \{/);
  assert.doesNotMatch(read("src/components/core-work-primitives.tsx"), /SummaryBadge/);
});

test("t005 routes keep the required operational behaviors", () => {
  const leadsPage = read("src/app/leads/page.tsx");
  const leadFilters = read("src/components/lead-filters.tsx");
  const leadPagination = read("src/components/lead-pagination.tsx");
  const leadTable = read("src/components/lead-table.tsx");
  const workPage = read("src/app/work/page.tsx");
  const salesReportPage = read("src/app/reports/sales/page.tsx");
  const globalsCss = read("src/app/globals.css");

  assert.match(leadsPage, /status: \["", \.\.\.filterOptions\.status\]/);
  assert.match(leadsPage, /priority: \["", \.\.\.filterOptions\.priority\]/);
  assert.match(leadsPage, /city: \["", \.\.\.filterOptions\.city\]/);
  assert.match(leadsPage, /packageFit: \["", \.\.\.filterOptions\.packageFit\]/);

  assert.match(leadFilters, /router\.replace\(/);
  assert.match(leadFilters, /Updating\.\.\./);
  assert.match(leadFilters, /Clear filters/);
  assert.match(leadFilters, /resultSummary/);
  assert.match(leadFilters, /filterLabels/);

  assert.match(leadPagination, /aria-label="Lead pagination"/);
  assert.match(leadPagination, /aria-current="page"/);
  assert.match(leadPagination, /aria-disabled="true"/);
  assert.match(leadPagination, /Previous/);
  assert.match(leadPagination, /Next/);

  assert.match(leadFilters, /htmlFor=\{selectId\}/);
  assert.match(leadFilters, /id=\{selectId\}/);
  assert.match(leadFilters, /const selectId = `lead-filter-\$\{name\}`;/);
  assert.match(leadFilters, /<div className="space-y-1\.5">[\s\S]*<Label htmlFor=\{selectId\}/);
  assert.doesNotMatch(leadFilters, /<label className="space-y-1\.5">[\s\S]*<Label htmlFor=/);

  assert.match(workPage, /overdue/);
  assert.match(workPage, /dueToday/);
  assert.match(workPage, /upcoming/);
  assert.match(workPage, /noAction/);
  assert.match(workPage, /Quick update/);
  assert.match(workPage, /\/leads\/\$\{lead\.id\}#quick-update/);
  assert.match(workPage, /scope="col"/);
  assert.match(workPage, /caption className="sr-only"/);
  assert.match(workPage, /<dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">[\s\S]*<div className=/);
  assert.doesNotMatch(workPage, /<p className="text-\[11px\] font-semibold uppercase tracking-\[0\.18em\]/);
  assert.doesNotMatch(workPage, /<dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">[\s\S]*<div key=/);
  assert.match(read("src/components/core-work-primitives.tsx"), /<dt className="text-\[11px\] font-semibold uppercase tracking-\[0\.18em\]/);
  assert.match(read("src/components/core-work-primitives.tsx"), /<dd className="mt-2 text-3xl font-semibold tabular-nums/);
  assert.match(globalsCss, /html\s*\{\s*scrollbar-gutter:\s*stable;\s*\}/s);
  assert.match(leadTable, /text-left sm:text-center/);
  assert.match(workPage, /text-left sm:text-center/);
  assert.match(leadTable, /No leads match the current filters\./);
  assert.match(workPage, /No leads in this bucket\./);
  assert.doesNotMatch(leadTable, /text-center[^\\S\r\n]*text-left/);

  assert.match(salesReportPage, /getSalesReport\(\)/);
  assert.match(salesReportPage, /getSalesStatusEntries\(\)/);
  assert.match(salesReportPage, /Lead status summary/);
  assert.match(salesReportPage, /Priority summary/);
  assert.match(salesReportPage, /Package fit summary/);
  assert.match(salesReportPage, /Workbench health/);
  assert.match(salesReportPage, /Draft readiness/);
  assert.match(salesReportPage, /Activity summary/);
  assert.match(salesReportPage, /activities in the last 7 days/i);
  assert.doesNotMatch(salesReportPage, /Track the same operational counts, draft states and workbench health used elsewhere in the CRM\./);
  assert.doesNotMatch(salesReportPage, /description="Track the same operational counts/);
});
