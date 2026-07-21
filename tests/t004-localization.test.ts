import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createTranslator } from "../src/i18n/translate";
import { getLeadNoticeTranslationKey, LEAD_NOTICE_KEYS } from "../src/lib/lead-notices";
import { leadUpdateSchema } from "../src/lib/lead-form";
import { activityCreateSchema } from "../src/lib/activity-form";
import { parseFormDateTime } from "../src/lib/form-date-time";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("core workflow notices use stable codes with Polish and English UI copy", () => {
  const en = createTranslator("en-US");
  const pl = createTranslator("pl-PL");

  for (const [code, key] of Object.entries(LEAD_NOTICE_KEYS)) {
    assert.ok(en(key), `missing English notice for ${code}`);
    assert.ok(pl(key), `missing Polish notice for ${code}`);
  }

  assert.equal(pl(getLeadNoticeTranslationKey("lead_updated")), "Zaktualizowano leada");
  assert.equal(en(getLeadNoticeTranslationKey("unknown_code")), "Operation failed");

  const invalidLead = leadUpdateSchema.safeParse({
    leadStatus: "NEW",
    priority: "LOW",
    packageFit: "UNKNOWN",
    nextActionAt: "not-a-date"
  });
  assert.equal(invalidLead.success, false);
  if (!invalidLead.success) {
    assert.equal(invalidLead.error.issues[0]?.message, "validation.lead.next_action_invalid");
  }

  const invalidActivity = activityCreateSchema.safeParse({
    type: "NOTE",
    title: "",
    body: "",
    occurredAt: "2026-07-21T10:00:00Z"
  });
  assert.equal(invalidActivity.success, false);
  if (!invalidActivity.success) {
    assert.equal(invalidActivity.error.issues[0]?.message, "validation.activity.title_required");
  }
});

test("datetime-local values round-trip through the fixed Warsaw presentation zone", () => {
  assert.equal((parseFormDateTime("2026-01-15T13:00") as Date).toISOString(), "2026-01-15T12:00:00.000Z");
  assert.equal((parseFormDateTime("2026-07-15T14:00") as Date).toISOString(), "2026-07-15T12:00:00.000Z");
  assert.equal((parseFormDateTime("2026-10-25T02:30") as Date).toISOString(), "2026-10-25T00:30:00.000Z");
  assert.equal(Number.isNaN((parseFormDateTime("2026-03-29T02:30") as Date).getTime()), true);
});

test("core workflow localizes application copy without translating stored content", () => {
  const actionFiles = [
    "src/app/leads/actions.ts",
    "src/app/leads/activity-actions.ts",
    "src/app/leads/mini-audit-actions.ts",
    "src/app/leads/outreach-draft-actions.ts",
    "src/app/leads/offer-draft-actions.ts"
  ];
  for (const file of actionFiles) {
    assert.match(read(file), /code:/, `${file} must return a stable notice code`);
  }

  const localizedFiles = [
    "src/components/dashboard-page.tsx",
    "src/app/work/page.tsx",
    "src/app/leads/page.tsx",
    "src/app/leads/[id]/page.tsx",
    "src/components/activity-form.tsx",
    "src/components/mini-audit-draft-form.tsx",
    "src/components/outreach-draft-form.tsx",
    "src/components/offer-draft-form.tsx"
  ];
  for (const file of localizedFiles) {
    const source = read(file);
    assert.match(source, /\bt\(/, `${file} must use typed translations`);
    assert.doesNotMatch(source, /en-GB|toLocale(?:Date|Time|String)/, `${file} must use shared formatters`);
  }

  const detail = read("src/app/leads/[id]/page.tsx");
  const activity = read("src/components/activity-form.tsx");
  const outreach = read("src/components/outreach-draft-form.tsx");
  const offer = read("src/components/offer-draft-form.tsx");
  assert.match(detail, /\{lead\.businessName\}/);
  assert.match(detail, /latest\.recommendation \?\? latest\.problem1/);
  assert.match(activity, /\{activity\.title\}/);
  assert.match(activity, /\{activity\.body \?\? "-"\}/);
  assert.match(outreach, /defaultValue=\{draft\?\.message \?\? ""\}/);
  assert.match(offer, /defaultValue=\{draft\?\.scopeSummary \?\? ""\}/);
});
