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
  assert.match(page, /lead\.detail\.status/);
  assert.match(page, /lead\.detail\.activityLog/);
  assert.match(page, /lead\.detail\.review/);
  assert.match(page, /lead\.detail\.messagePlan/);
  assert.match(page, /lead\.detail\.draftPreparation/);
  assert.match(page, /lead\.detail\.showTechnical/);
  assert.match(page, /lead\.detail\.technicalMetadata/);
  assert.match(page, /lead\.detail\.noContactPerson/);
  assert.match(page, /lead\.detail\.draftNotStarted/);
  assert.match(page, /StatusPill value=\{lead\.leadStatus\} appearance="light"/);
  assert.match(page, /StatusPill value=\{lead\.priority\} appearance="light"/);
  assert.doesNotMatch(page, /StatusPill value=\{lead\.packageFit\} appearance="light"/);
  assert.match(page, /lead\.detail\.sections/);
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
  assert.match(leadUpdateForm, /lead\.update\.save/);
  assert.match(leadUpdateForm, /lead\.update\.status/);
  assert.match(leadUpdateForm, /lead\.update\.priority/);
  assert.doesNotMatch(leadUpdateForm, /Match/);
  assert.match(leadUpdateForm, /name="packageFit" value=\{packageFit\}/);
  assert.match(leadUpdateForm, /lead\.update\.nextTask/);
  assert.match(leadUpdateForm, /role=\{state\.ok \? "status" : "alert"\}/);

  assert.match(activityForm, /createLeadActivityAction/);
  assert.match(activityForm, /activity\.add/);
  assert.match(activityForm, /activity\.timeline/);
  assert.match(activityForm, /activity\.type/);
  assert.match(activityForm, /activity\.title/);
  assert.match(activityForm, /activity\.occurredAt/);
  assert.match(activityForm, /activity\.body/);
  assert.match(activityForm, /StatusPill value=\{"NOTE" as ActivityTypeValue\} appearance="light"/);

  assert.match(miniAuditForm, /saveMiniAuditDraftAction/);
  assert.match(miniAuditForm, /miniAudit\.create/);
  assert.match(miniAuditForm, /miniAudit\.save/);
  assert.match(miniAuditForm, /draft\.new/);
  assert.match(miniAuditForm, /StatusPill value=\{draft\.status as MiniAuditStatusValue\} appearance="light"/);
  assert.doesNotMatch(miniAuditForm, /Suggested match/);
  assert.match(miniAuditForm, /name="suggestedPackage" value=\{draft\?\.suggestedPackage \?\? "UNKNOWN"\}/);
  assert.match(miniAuditForm, /miniAudit\.finding1/);

  assert.match(outreachForm, /saveOutreachDraftAction/);
  assert.match(outreachForm, /outreach\.create/);
  assert.match(outreachForm, /outreach\.save/);
  assert.match(outreachForm, /draft\.new/);
  assert.match(outreachForm, /outreach\.linkedReview/);
  assert.match(outreachForm, /StatusPill value=\{draft\.status as OutreachDraftStatusValue\} appearance="light"/);
  assert.match(outreachForm, /StatusPill value=\{draft\.channel as OutreachChannelValue\} appearance="light"/);
  assert.match(outreachForm, /outreach\.openingLine/);
  assert.match(outreachForm, /outreach\.nextStep/);

  assert.match(offerForm, /saveOfferDraftAction/);
  assert.match(offerForm, /offer\.create/);
  assert.match(offerForm, /offer\.save/);
  assert.match(offerForm, /draft\.new/);
  assert.match(offerForm, /offer\.price/);
  assert.match(offerForm, /offer\.expires/);
  assert.match(offerForm, /StatusPill value=\{draft\.status as OfferDraftStatusValue\} appearance="light"/);
  assert.doesNotMatch(offerForm, /StatusPill value=\{draft\.packageFit as PackageFitValue\} appearance="light"/);
  assert.match(offerForm, /name="packageFit" value=\{draft\?\.packageFit \?\? "UNKNOWN"\}/);
  assert.doesNotMatch(offerForm, /Create draft preparation/);
});
