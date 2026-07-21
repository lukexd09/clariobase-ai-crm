import test from "node:test";
import assert from "node:assert/strict";
import { getWorkBuckets, isActionableLead, type WorkLead } from "../src/lib/work-view";
import { getPresentationDayBounds } from "../src/lib/presentation-day";

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

test("bucket classification uses Warsaw day boundaries in summer regardless of host time zone", () => {
  const classify = () => bucketLeadNames(new Date("2026-07-21T22:30:00.000Z"), [
    lead({ businessName: "Before Warsaw midnight", nextActionAt: new Date("2026-07-21T21:59:59.999Z") }),
    lead({ businessName: "At Warsaw midnight", nextActionAt: new Date("2026-07-21T22:00:00.000Z") }),
    lead({ businessName: "Before next Warsaw midnight", nextActionAt: new Date("2026-07-22T21:59:59.999Z") }),
    lead({ businessName: "After next Warsaw midnight", nextActionAt: new Date("2026-07-22T22:00:00.000Z") })
  ]);

  assert.deepEqual(withProcessTimeZone("UTC", classify), {
    overdue: ["Before Warsaw midnight"],
    dueToday: ["At Warsaw midnight", "Before next Warsaw midnight"],
    upcoming: ["After next Warsaw midnight"],
    noAction: []
  });
  assert.deepEqual(withProcessTimeZone("America/New_York", classify), withProcessTimeZone("UTC", classify));
});

test("bucket classification uses Warsaw day boundaries in winter regardless of host time zone", () => {
  const classify = () => bucketLeadNames(new Date("2026-01-15T23:30:00.000Z"), [
    lead({ businessName: "Before Warsaw midnight", nextActionAt: new Date("2026-01-15T22:59:59.999Z") }),
    lead({ businessName: "At Warsaw midnight", nextActionAt: new Date("2026-01-15T23:00:00.000Z") }),
    lead({ businessName: "After next Warsaw midnight", nextActionAt: new Date("2026-01-16T23:00:00.000Z") })
  ]);

  assert.deepEqual(withProcessTimeZone("UTC", classify), {
    overdue: ["Before Warsaw midnight"],
    dueToday: ["At Warsaw midnight"],
    upcoming: ["After next Warsaw midnight"],
    noAction: []
  });
  assert.deepEqual(withProcessTimeZone("Pacific/Honolulu", classify), withProcessTimeZone("UTC", classify));
});

test("presentation day bounds preserve DST transition day lengths", () => {
  const spring = getPresentationDayBounds(new Date("2026-03-29T12:00:00.000Z"));
  const autumn = getPresentationDayBounds(new Date("2026-10-25T12:00:00.000Z"));

  assert.equal(spring.startOfPresentationDay.toISOString(), "2026-03-28T23:00:00.000Z");
  assert.equal(spring.startOfNextPresentationDay.toISOString(), "2026-03-29T22:00:00.000Z");
  assert.equal(spring.startOfNextPresentationDay.getTime() - spring.startOfPresentationDay.getTime(), 23 * 60 * 60 * 1000);
  assert.equal(autumn.startOfPresentationDay.toISOString(), "2026-10-24T22:00:00.000Z");
  assert.equal(autumn.startOfNextPresentationDay.toISOString(), "2026-10-25T23:00:00.000Z");
  assert.equal(autumn.startOfNextPresentationDay.getTime() - autumn.startOfPresentationDay.getTime(), 25 * 60 * 60 * 1000);
});

function bucketLeadNames(now: Date, leads: WorkLead[]) {
  return Object.fromEntries(
    getWorkBuckets(leads, now).map((bucket) => [bucket.key, bucket.leads.map((item) => item.businessName)])
  );
}

function withProcessTimeZone<T>(timeZone: string, callback: () => T) {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return callback();
  } finally {
    if (previous === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previous;
    }
  }
}
