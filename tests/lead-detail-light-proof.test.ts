import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("lead detail workspace uses the approved ClarioBase UI foundation", () => {
  const page = read("src/app/leads/[id]/page.tsx");
  const leadUpdateForm = read("src/components/lead-update-form.tsx");
  const activityForm = read("src/components/activity-form.tsx");
  const miniAuditForm = read("src/components/mini-audit-draft-form.tsx");
  const outreachForm = read("src/components/outreach-draft-form.tsx");
  const offerForm = read("src/components/offer-draft-form.tsx");
  const slice = [page, leadUpdateForm, activityForm, miniAuditForm, outreachForm, offerForm].join("\n");

  assert.match(page, /bg-\[var\(--clariobase-background\)\] text-\[var\(--clariobase-text-primary\)\]/);
  assert.match(page, /xl:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(320px,400px\)\]/);
  assert.match(slice, /var\(--clariobase-primary\)/);
  assert.match(slice, /var\(--clariobase-surface\)/);
  assert.match(slice, /var\(--clariobase-surface-subtle\)/);
  assert.match(slice, /var\(--clariobase-border\)/);
  assert.match(slice, /var\(--clariobase-text-primary\)/);
  assert.match(slice, /var\(--clariobase-text-secondary\)/);
  assert.match(page, /Lead workspace/);
  assert.match(page, /StatusPill value=\{lead\.leadStatus\} appearance="light"/);
  assert.match(page, /StatusPill value=\{lead\.priority\} appearance="light"/);
  assert.match(page, /StatusPill value=\{lead\.packageFit\} appearance="light"/);
  assert.match(page, /Lead score/);
  assert.match(page, /Next action/);
  assert.match(page, /Customer/);
  assert.match(page, /Business context/);
  assert.match(page, /Mini-audit/);
  assert.match(page, /Outreach sequence/);
  assert.match(page, /Offer generation/);
  assert.match(page, /"#lead-controls"/);
  assert.match(page, /"#activity"/);
  assert.match(page, /"#mini-audit"/);
  assert.match(page, /"#outreach"/);
  assert.match(page, /"#offer"/);
  assert.match(page, /id="lead-controls"/);
  assert.match(page, /id="activity"/);
  assert.match(page, /Lead controls/);
  assert.match(page, /Activity log/);
  assert.match(page, /aria-label="Lead workspace sections"/);
  assert.match(page, /Show technical details/);
  assert.match(page, /Technical metadata/);
  assert.match(page, /Customer ID/);
  assert.match(page, /Source record ID/);
  assert.doesNotMatch(page, /LeadDetailSidebar/);
  assert.doesNotMatch(page, /aria-label="Lead workspace routes"/);
  assert.doesNotMatch(page, /Operator sidebar|Workspace routes/);
  assert.doesNotMatch(page, /No updates yet/);
  assert.match(page, /focus-visible:ring-2/);
  assert.doesNotMatch(page, /bg-sky-|text-sky-|border-sky-/);
  assert.doesNotMatch(page, /bg-slate-50|text-slate-900|border-slate-200/);
  assert.doesNotMatch(slice, /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})/);
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
  assert.match(leadUpdateForm, /var\(--clariobase-primary\)/);
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
  assert.match(activityForm, /var\(--clariobase-primary\)/);
  assert.match(activityForm, /focus-visible:ring-2/);

  assert.match(miniAuditForm, /saveMiniAuditDraftAction/);
  assert.match(miniAuditForm, /Create mini-audit draft/);
  assert.match(miniAuditForm, /Save mini-audit draft/);
  assert.match(miniAuditForm, /New draft/);
  assert.doesNotMatch(miniAuditForm, /StatusPill value=\{\(draft\?\.status \?\? "DRAFT"\) as MiniAuditStatusValue\} appearance="light"/);
  assert.match(miniAuditForm, /var\(--clariobase-primary\)/);
  assert.match(miniAuditForm, /focus-visible:ring-2/);

  assert.match(outreachForm, /saveOutreachDraftAction/);
  assert.match(outreachForm, /Create outreach draft/);
  assert.match(outreachForm, /Save outreach draft/);
  assert.match(outreachForm, /New draft/);
  assert.match(outreachForm, /Linked mini-audit/);
  assert.doesNotMatch(outreachForm, /StatusPill value=\{\(draft\?\.status \?\? "DRAFT"\) as OutreachDraftStatusValue\} appearance="light"/);
  assert.match(outreachForm, /var\(--clariobase-primary\)/);
  assert.match(outreachForm, /focus-visible:ring-2/);

  assert.match(offerForm, /saveOfferDraftAction/);
  assert.match(offerForm, /Create offer draft/);
  assert.match(offerForm, /Save offer draft/);
  assert.match(offerForm, /New draft/);
  assert.match(offerForm, /Price net/);
  assert.match(offerForm, /Valid until/);
  assert.doesNotMatch(offerForm, /StatusPill value=\{\(draft\?\.status \?\? "DRAFT"\) as OfferDraftStatusValue\} appearance="light"/);
  assert.match(offerForm, /var\(--clariobase-primary\)/);
  assert.match(offerForm, /focus-visible:ring-2/);
});
