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
  assert.match(page, /lg:grid-cols-\[minmax\(0,1\.35fr\)_420px\]/);
  assert.match(page, /href="#lead-controls"/);
  assert.match(page, /href="#activity"/);
  assert.match(page, /id="lead-controls"/);
  assert.match(page, /id="activity"/);
  assert.match(page, /Lead controls/);
  assert.match(page, /Activity log/);
  assert.match(page, /Lead workspace/);
  assert.match(page, /LeadDetailSidebar/);
  assert.match(page, /aria-label="Lead workspace routes"/);
  assert.match(page, /focus-visible:ring-2/);
  assert.match(page, /StatusPill value=\{lead\.leadStatus\} appearance="light"/);
  assert.match(page, /StatusPill value=\{lead\.priority\} appearance="light"/);
  assert.match(page, /StatusPill value=\{lead\.packageFit\} appearance="light"/);
  assert.match(page, /bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800/);
  assert.doesNotMatch(page, /bg-sky-600|hover:bg-sky-500/);
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
  assert.match(leadUpdateForm, /Next action date/);
  assert.match(leadUpdateForm, /grid gap-4 md:grid-cols-2/);
  assert.match(leadUpdateForm, /StatusPill value=\{leadStatus\} appearance="light"/);
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
  assert.match(activityForm, /StatusPill value=\{activity\.type\} appearance="light"/);
  assert.match(activityForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(activityForm, /focus-visible:ring-2/);

  assert.match(miniAuditForm, /saveMiniAuditDraftAction/);
  assert.match(miniAuditForm, /Create mini-audit draft/);
  assert.match(miniAuditForm, /Save mini-audit draft/);
  assert.match(miniAuditForm, /StatusPill value=\{\(draft\?\.status \?\? "DRAFT"\) as MiniAuditStatusValue\} appearance="light"/);
  assert.match(miniAuditForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(miniAuditForm, /focus-visible:ring-2/);

  assert.match(outreachForm, /saveOutreachDraftAction/);
  assert.match(outreachForm, /Create outreach draft/);
  assert.match(outreachForm, /Save outreach draft/);
  assert.match(outreachForm, /Linked mini-audit/);
  assert.match(outreachForm, /StatusPill value=\{\(draft\?\.channel \?\? "EMAIL"\) as OutreachChannelValue\} appearance="light"/);
  assert.match(outreachForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(outreachForm, /focus-visible:ring-2/);

  assert.match(offerForm, /saveOfferDraftAction/);
  assert.match(offerForm, /Create offer draft/);
  assert.match(offerForm, /Save offer draft/);
  assert.match(offerForm, /Price net/);
  assert.match(offerForm, /Valid until/);
  assert.match(offerForm, /StatusPill value=\{\(draft\?\.packageFit \?\? "UNKNOWN"\) as PackageFitValue\} appearance="light"/);
  assert.match(offerForm, /bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800/);
  assert.match(offerForm, /focus-visible:ring-2/);
});
