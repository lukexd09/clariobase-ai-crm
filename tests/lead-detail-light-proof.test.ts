import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("lead detail route uses the approved ClarioBase UI boundary", () => {
  const page = read("src/app/leads/[id]/page.tsx");

  assert.match(page, /min-h-screen bg-\[color:var\(--cb-background\)\] text-\[color:var\(--cb-foreground\)\]/);
  assert.match(page, /rounded-\[var\(--cb-radius-xl\)\] border border-\[color:var\(--cb-border\)\]/);
  assert.match(page, /shadow-\[var\(--cb-shadow-surface\)\]/);
  assert.match(page, /focus-visible:ring-\[color:var\(--cb-focus-ring\)\]/);
  assert.match(page, /Status/);
  assert.match(page, /Activity log/);
  assert.match(page, /Review/);
  assert.match(page, /Message plan/);
  assert.match(page, /Draft preparation/);
  assert.match(page, /Show technical details/);
  assert.match(page, /Technical metadata/);
  assert.match(page, /StatusPill value=\{lead\.leadStatus\} appearance="light"/);
  assert.match(page, /StatusPill value=\{lead\.priority\} appearance="light"/);
  assert.doesNotMatch(page, /StatusPill value=\{lead\.packageFit\} appearance="light"/);
  assert.match(page, /Activity log/);
  assert.match(page, /Review/);
  assert.match(page, /Message plan/);
  assert.match(page, /Draft preparation/);
  assert.match(page, /Lead workspace sections/);
  assert.match(page, /"#lead-controls"/);
  assert.match(page, /"#activity"/);
  assert.match(page, /"#mini-audit"/);
  assert.match(page, /"#outreach"/);
  assert.match(page, /"#offer"/);
  assert.match(page, /"#technical-details"/);
  assert.doesNotMatch(page, /LeadDetailSidebar|Workspace routes|sidebar/i);
  assert.doesNotMatch(page, /tabs?|workflow split/i);
  assert.doesNotMatch(page, /bg-slate-50|text-slate-900|border-slate-200|text-sky-|bg-sky-/);
  assert.doesNotMatch(page, /bg-\[#|text-\[#|border-\[#|ring-\[#/);
  assert.doesNotMatch(page, /var\(--clariobase-/);
});

test("lead detail route keeps forms and actions wired to the existing persistence", () => {
  const leadUpdateForm = read("src/components/lead-update-form.tsx");
  const activityForm = read("src/components/activity-form.tsx");
  const miniAuditForm = read("src/components/mini-audit-draft-form.tsx");
  const outreachForm = read("src/components/outreach-draft-form.tsx");
  const offerForm = read("src/components/offer-draft-form.tsx");

  for (const content of [leadUpdateForm, activityForm, miniAuditForm, outreachForm, offerForm]) {
    assert.match(content, /var\(--cb-/);
    assert.doesNotMatch(content, /var\(--clariobase-/);
    assert.doesNotMatch(content, /bg-\[#|text-\[#|border-\[#|ring-\[#/);
  }

  assert.match(leadUpdateForm, /updateLeadAction/);
  assert.match(leadUpdateForm, /Save updates/);
  assert.match(leadUpdateForm, /Status/);
  assert.match(leadUpdateForm, /Priority/);
  assert.match(leadUpdateForm, /Match/);
  assert.match(leadUpdateForm, /Next task/);
  assert.match(leadUpdateForm, /role=\{state\.ok \? "status" : "alert"\}/);

  assert.match(activityForm, /createLeadActivityAction/);
  assert.match(activityForm, /Add activity/);
  assert.match(activityForm, /Activity timeline/);
  assert.match(activityForm, /Type/);
  assert.match(activityForm, /Title/);
  assert.match(activityForm, /Occurred at/);
  assert.match(activityForm, /Body/);
  assert.match(activityForm, /StatusPill value=\{"NOTE" as ActivityTypeValue\} appearance="light"/);

  assert.match(miniAuditForm, /saveMiniAuditDraftAction/);
  assert.match(miniAuditForm, /Create review draft/);
  assert.match(miniAuditForm, /Save review draft/);
  assert.match(miniAuditForm, /New draft/);
  assert.match(miniAuditForm, /StatusPill value=\{draft\.status as MiniAuditStatusValue\} appearance="light"/);
  assert.match(miniAuditForm, /StatusPill value=\{draft\.suggestedPackage as PackageFitValue\} appearance="light"/);
  assert.match(miniAuditForm, /Suggested match/);
  assert.match(miniAuditForm, /Finding 1/);

  assert.match(outreachForm, /saveOutreachDraftAction/);
  assert.match(outreachForm, /Create message draft/);
  assert.match(outreachForm, /Save message draft/);
  assert.match(outreachForm, /New draft/);
  assert.match(outreachForm, /Linked review/);
  assert.match(outreachForm, /StatusPill value=\{draft\.status as OutreachDraftStatusValue\} appearance="light"/);
  assert.match(outreachForm, /StatusPill value=\{draft\.channel as OutreachChannelValue\} appearance="light"/);
  assert.match(outreachForm, /Opening line/);
  assert.match(outreachForm, /Next step/);

  assert.match(offerForm, /saveOfferDraftAction/);
  assert.match(offerForm, /Create draft preparation/);
  assert.match(offerForm, /Save draft/);
  assert.match(offerForm, /New draft/);
  assert.match(offerForm, /Price/);
  assert.match(offerForm, /Expires/);
  assert.match(offerForm, /StatusPill value=\{draft\.status as OfferDraftStatusValue\} appearance="light"/);
  assert.match(offerForm, /StatusPill value=\{draft\.packageFit as PackageFitValue\} appearance="light"/);
});
