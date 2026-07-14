import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LEAD_STATUS_VALUES } from "../src/lib/lead-values";
import { SALES_STATUS_METADATA } from "../src/lib/sales-status";
import { getWorkbenchBucketCounts, toCountMap } from "../src/lib/sales-report-utils";
import { type WorkLead } from "../src/lib/work-view";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function lead(overrides: Partial<WorkLead>): WorkLead {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    businessName: overrides.businessName ?? "Test Lead",
    city: overrides.city ?? "Katowice",
    category: overrides.category ?? "Beauty",
    leadStatus: overrides.leadStatus ?? "NEW",
    priority: overrides.priority ?? "MEDIUM",
    packageFit: overrides.packageFit ?? "BASE",
    scoreTotal: overrides.scoreTotal ?? 50,
    scoreLabel: overrides.scoreLabel ?? null,
    nextActionAt: overrides.nextActionAt ?? null,
    updatedAt: overrides.updatedAt ?? new Date("2026-06-10T12:00:00.000Z"),
    lastImportedAt: overrides.lastImportedAt ?? null
  };
}

test("sales status metadata covers every lead status", () => {
  assert.deepEqual(Object.keys(SALES_STATUS_METADATA).sort(), [...LEAD_STATUS_VALUES].sort());
});

test("sales report lower sections keep their source order and compact wide composition", () => {
  const salesReportPage = read("src/app/reports/sales/page.tsx");

  assert.match(salesReportPage, /Priority summary/);
  assert.match(salesReportPage, /Package fit summary/);
  assert.match(salesReportPage, /Workbench health/);
  assert.match(salesReportPage, /Draft readiness/);
  assert.match(salesReportPage, /Activity summary/);
  assert.match(
    salesReportPage,
    /Priority summary[\s\S]*Package fit summary[\s\S]*Workbench health[\s\S]*Draft readiness[\s\S]*Activity summary/
  );
  assert.match(salesReportPage, /space-y-4 xl:columns-2 xl:gap-4 xl:\[column-fill:balance\]/);
  assert.match(salesReportPage, /xl:break-inside-avoid xl:mb-4/);
  assert.doesNotMatch(salesReportPage, /grid gap-4 xl:grid-cols-2/);
  assert.doesNotMatch(salesReportPage, /<ReportSection title="Priority summary" description="Count of leads by operational priority\."[\s\S]*<ReportSection title="Package fit summary" description="Count of leads by recommended package fit\."[\s\S]*<ReportSection title="Workbench health" description="The same actionable-bucket logic used by \/work\."[\s\S]*<ReportSection title="Draft readiness" description="How many drafts exist and how many leads already have at least one draft artifact\."[\s\S]*<ReportSection title="Activity summary" description="Manual activity logging still provides lightweight pipeline history\."[\s\S]*grid gap-4 xl:grid-cols-2/);
});

test("toCountMap fills missing keys with zeros", () => {
  const counts = toCountMap(["NEW", "WON", "ARCHIVED"] as const, [
    { key: "NEW", count: 3 },
    { key: "WON", count: 1 }
  ]);

  assert.deepEqual(counts, {
    NEW: 3,
    WON: 1,
    ARCHIVED: 0
  });
});

test("workbench bucket counts follow the bucket helper", () => {
  const counts = getWorkbenchBucketCounts(
    [
      lead({ businessName: "Overdue", nextActionAt: new Date("2026-06-09T09:00:00.000Z") }),
      lead({ businessName: "Today", nextActionAt: new Date("2026-06-10T09:30:00.000Z") }),
      lead({ businessName: "Upcoming", nextActionAt: new Date("2026-06-11T09:00:00.000Z") }),
      lead({ businessName: "No action", nextActionAt: null }),
      lead({ businessName: "Won", leadStatus: "WON", nextActionAt: null })
    ],
    new Date("2026-06-10T12:00:00.000Z")
  );

  assert.deepEqual(counts, {
    overdue: 1,
    dueToday: 1,
    upcoming: 1,
    noAction: 1
  });
});
