import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { buildDashboardData } from "@/lib/dashboard";
import { SALES_STATUS_METADATA } from "@/lib/sales-status";
import { getWorkBuckets, type WorkLead } from "@/lib/work-view";

const now = new Date("2026-07-22T10:00:00.000Z");

function lead(overrides: Partial<WorkLead> & Pick<WorkLead, "id" | "businessName">): WorkLead {
  return {
    city: "Warszawa",
    category: "Services",
    leadStatus: "NEW",
    priority: "MEDIUM",
    packageFit: "BASE",
    scoreTotal: 50,
    scoreLabel: null,
    nextActionAt: null,
    updatedAt: new Date("2026-07-20T10:00:00.000Z"),
    lastImportedAt: null,
    ...overrides
  };
}

test("dashboard metrics and priorities reuse work bucket semantics and Warsaw day", () => {
  const leads = [
    lead({ id: "late-b", businessName: "Late B", nextActionAt: new Date("2026-07-21T20:00:00.000Z") }),
    lead({ id: "late-a", businessName: "Late A", nextActionAt: new Date("2026-07-20T20:00:00.000Z") }),
    lead({ id: "today", businessName: "Today", leadStatus: "AUDITED", nextActionAt: new Date("2026-07-22T12:00:00.000Z") }),
    lead({ id: "next", businessName: "Next", leadStatus: "CONTACTED", nextActionAt: new Date("2026-07-23T08:00:00.000Z") }),
    lead({ id: "idle", businessName: "Idle", priority: "URGENT" })
  ];
  const buckets = getWorkBuckets(leads, now);
  const dashboard = buildDashboardData(leads, 2, now);

  assert.deepEqual(dashboard.metrics, buckets.map((bucket) => ({ key: bucket.key, count: bucket.leads.length })));
  assert.deepEqual(dashboard.priorities.map((item) => item.id), ["late-a", "late-b", "today", "next"]);
  assert.equal(dashboard.operationalDate, "2026-07-21T22:00:00.000Z");
  assert.equal(dashboard.priorities[2]?.nextActionKey, SALES_STATUS_METADATA.AUDITED.nextActionKey);
  assert.equal(dashboard.priorities[3]?.href, "/leads/next");
});

test("dashboard pipeline groups only the five approved active stages", () => {
  const statuses = Object.keys(SALES_STATUS_METADATA) as Array<keyof typeof SALES_STATUS_METADATA>;
  const leads = statuses.map((status, index) => lead({ id: String(index), businessName: status, leadStatus: status }));
  const dashboard = buildDashboardData(leads, 0, now);

  assert.deepEqual(dashboard.pipeline.map((stage) => stage.value), [2, 2, 3, 1, 1]);
  assert.equal(dashboard.pipeline.reduce((sum, stage) => sum + stage.value, 0), 9);
});

test("empty dashboard stays empty", () => {
  const dashboard = buildDashboardData([], 0, now);

  assert.deepEqual(dashboard.metrics.map((metric) => metric.count), [0, 0, 0, 0]);
  assert.deepEqual(dashboard.priorities, []);
  assert.deepEqual(dashboard.pipeline.map((stage) => stage.value), [0, 0, 0, 0, 0]);
});

test("active duplicate count includes only OPEN and NEEDS_REVIEW", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../src/lib/duplicates.ts"), "utf8");
  const activeStatuses = source.match(/ACTIVE_DUPLICATE_CANDIDATE_STATUSES = \[([\s\S]*?)\] as const/)?.[1] ?? "";

  assert.match(activeStatuses, /DuplicateCandidateStatus\.OPEN/);
  assert.match(activeStatuses, /DuplicateCandidateStatus\.NEEDS_REVIEW/);
  assert.doesNotMatch(activeStatuses, /DISMISSED|RESOLVED/);
  assert.match(source, /status:\s*\{\s*in: \[\.\.\.ACTIVE_DUPLICATE_CANDIDATE_STATUSES\]/);
});
