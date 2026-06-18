import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("lead detail light proof preserves dense operator workflow structure", () => {
  const page = read("src/app/leads/[id]/page.tsx");

  assert.match(page, /min-h-screen bg-slate-50 text-slate-900/);
  assert.match(page, /mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8/);
  assert.match(page, /"#lead-controls"/);
  assert.match(page, /"#activity"/);
  assert.match(page, /id="lead-controls"/);
  assert.match(page, /id="activity"/);
  assert.match(page, /Lead controls/);
  assert.match(page, /Activity log/);
  assert.match(page, /Lead workspace/);
  assert.match(page, /nav aria-label="Lead sections"/);
  assert.match(page, /Jump to technical details/);
  assert.doesNotMatch(page, /LeadDetailSidebar/);
  assert.doesNotMatch(page, /aria-label="Lead workspace routes"/);
  assert.doesNotMatch(page, /Operator sidebar|Workspace routes/);
  assert.match(page, /No next action set/);
  assert.match(page, /focus-visible:ring-2/);
  assert.match(page, /StatusPill value=\{lead\.leadStatus\} appearance="light"/);
  assert.match(page, /StatusPill value=\{lead\.priority\} appearance="light"/);
  assert.match(page, /StatusPill value=\{lead\.packageFit\} appearance="light"/);
  assert.match(page, /bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700/);
  assert.doesNotMatch(page, /bg-\[#0A0C10\]|bg-\[#11141D\]|text-\[#F0F4F9\]|text-\[#94A3B8\]/);
  assert.doesNotMatch(page, /bg-\[#0A0C10\]|bg-\[#11141D\]|text-\[#F0F4F9\]|text-\[#94A3B8\]/);
});

test("lead detail proof preserves actions, forms, and status affordances", () => {
  const leadUpdateForm = read("src/components/lead-update-form.tsx");
  const activityForm = read("src/components/activity-form.tsx");
  const miniAuditForm = read("src/components/mini-audit-draft-form.tsx");
  const outreachForm = read("src/components/outreach-draft-form.tsx");
  const offerForm = read("src/components/offer-draft-form.tsx");

  assert.match(leadUpdateForm, /updateLeadAction/);
  assert.match(leadUpdateForm, /Save updates/);
  assert.match(leadUpdateForm, /Lead status/);
  assert.match(leadUpdateForm, /Priority/);
  assert.match(leadUpdateForm, /Package fit/);
  assert.match(leadUpdateForm, /Next action/);
  assert.match(leadUpdateForm, /grid gap-4 md:grid-cols-2/);
  assert.match(leadUpdateForm, /Current schedule:/);
  assert.match(leadUpdateForm, /role=\{state\.ok \? "status" : "alert"\}/);
  assert.doesNotMatch(leadUpdateForm, /StatusPill value=\{leadStatus\} appearance="light"/);
  assert.match(leadUpdateForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(leadUpdateForm, /focus-visible:ring-2/);

  assert.match(activityForm, /createLeadActivityAction/);
  assert.match(activityForm, /Add activity/);
  assert.match(activityForm, /Activity timeline/);
  assert.match(activityForm, /Type/);
  assert.match(activityForm, /Title/);
  assert.match(activityForm, /Occurred at/);
  assert.match(activityForm, /Body/);
  assert.match(activityForm, /grid gap-4 md:grid-cols-2/);
  assert.match(activityForm, /className="md:col-span-2"/);
  assert.match(activityForm, /StatusPill value=\{activity\.type\} appearance="light"/);
  assert.match(activityForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(activityForm, /focus-visible:ring-2/);

  assert.match(miniAuditForm, /saveMiniAuditDraftAction/);
  assert.match(miniAuditForm, /Create mini-audit draft/);
  assert.match(miniAuditForm, /Save mini-audit draft/);
  assert.match(miniAuditForm, /New draft/);
  assert.doesNotMatch(miniAuditForm, /StatusPill value=\{\(draft\?\.status \?\? "DRAFT"\) as MiniAuditStatusValue\} appearance="light"/);
  assert.match(miniAuditForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(miniAuditForm, /focus-visible:ring-2/);

  assert.match(outreachForm, /saveOutreachDraftAction/);
  assert.match(outreachForm, /Create outreach draft/);
  assert.match(outreachForm, /Save outreach draft/);
  assert.match(outreachForm, /New draft/);
  assert.match(outreachForm, /Linked mini-audit/);
  assert.doesNotMatch(outreachForm, /StatusPill value=\{\(draft\?\.status \?\? "DRAFT"\) as OutreachDraftStatusValue\} appearance="light"/);
  assert.match(outreachForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(outreachForm, /focus-visible:ring-2/);

  assert.match(offerForm, /saveOfferDraftAction/);
  assert.match(offerForm, /Create offer draft/);
  assert.match(offerForm, /Save offer draft/);
  assert.match(offerForm, /New draft/);
  assert.match(offerForm, /Price net/);
  assert.match(offerForm, /Valid until/);
  assert.doesNotMatch(offerForm, /StatusPill value=\{\(draft\?\.status \?\? "DRAFT"\) as OfferDraftStatusValue\} appearance="light"/);
  assert.match(offerForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(offerForm, /focus-visible:ring-2/);
});
