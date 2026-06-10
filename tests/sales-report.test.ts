import test from "node:test";
import assert from "node:assert/strict";
import { LEAD_STATUS_VALUES } from "../src/lib/lead-values";
import { SALES_STATUS_METADATA } from "../src/lib/sales-status";
import { getWorkbenchBucketCounts, toCountMap } from "../src/lib/sales-report-utils";
import { type WorkLead } from "../src/lib/work-view";

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
