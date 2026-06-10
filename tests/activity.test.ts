import test from "node:test";
import assert from "node:assert/strict";
import { activityCreateSchema } from "../src/lib/activity-form";
import { buildLeadUpdateActivityBody } from "../src/lib/activity-utils";

test("activity schema accepts a valid manual activity", () => {
  const result = activityCreateSchema.safeParse({
    type: "NOTE",
    title: "Called back",
    body: "Left a voicemail.",
    occurredAt: "2026-06-10T10:00"
  });

  assert.equal(result.success, true);
});

test("activity schema rejects invalid timestamps", () => {
  const result = activityCreateSchema.safeParse({
    type: "CALL",
    title: "Call",
    body: "",
    occurredAt: "not-a-date"
  });

  assert.equal(result.success, false);
});

test("activity summary helper joins changed fields", () => {
  assert.equal(
    buildLeadUpdateActivityBody(["lead status", "priority"]),
    "Updated fields: lead status, priority"
  );
  assert.equal(buildLeadUpdateActivityBody([]), "Lead record updated");
});
