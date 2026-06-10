import test from "node:test";
import assert from "node:assert/strict";
import { getWorkBuckets, isActionableLead, type WorkLead } from "../src/lib/work-view";

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

test("bucket classification separates overdue, due today, upcoming and no action", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");
  const buckets = getWorkBuckets(
    [
      lead({ businessName: "Overdue", nextActionAt: new Date("2026-06-09T09:00:00.000Z") }),
      lead({ businessName: "Today", nextActionAt: new Date("2026-06-10T09:30:00.000Z") }),
      lead({ businessName: "Upcoming", nextActionAt: new Date("2026-06-11T09:00:00.000Z") }),
      lead({ businessName: "No action", nextActionAt: null }),
      lead({ businessName: "Won", leadStatus: "WON", nextActionAt: null })
    ],
    now
  );

  assert.equal(buckets.find((bucket) => bucket.key === "overdue")?.leads[0]?.businessName, "Overdue");
  assert.equal(buckets.find((bucket) => bucket.key === "dueToday")?.leads[0]?.businessName, "Today");
  assert.equal(buckets.find((bucket) => bucket.key === "upcoming")?.leads[0]?.businessName, "Upcoming");
  assert.equal(buckets.find((bucket) => bucket.key === "noAction")?.leads[0]?.businessName, "No action");
  assert.equal(buckets.flatMap((bucket) => bucket.leads).some((item) => item.businessName === "Won"), false);
});

test("priority sorting prefers URGENT before HIGH, MEDIUM and LOW", () => {
  const buckets = getWorkBuckets(
    [
      lead({ businessName: "Low", priority: "LOW" }),
      lead({ businessName: "Urgent", priority: "URGENT" }),
      lead({ businessName: "High", priority: "HIGH" }),
      lead({ businessName: "Medium", priority: "MEDIUM" })
    ],
    new Date("2026-06-10T12:00:00.000Z")
  );

  const noAction = buckets.find((bucket) => bucket.key === "noAction")?.leads ?? [];
  assert.deepEqual(
    noAction.map((item) => item.businessName),
    ["Urgent", "High", "Medium", "Low"]
  );
});

test("excluded statuses are not actionable", () => {
  assert.equal(isActionableLead({ leadStatus: "NEW" }), true);
  assert.equal(isActionableLead({ leadStatus: "WON" }), false);
  assert.equal(isActionableLead({ leadStatus: "LOST" }), false);
  assert.equal(isActionableLead({ leadStatus: "ARCHIVED" }), false);
  assert.equal(isActionableLead({ leadStatus: "DO_NOT_CONTACT" }), false);
});
