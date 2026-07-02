import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("T006 routes stay on the project-owned boundary and keep explicit semantic presentation", () => {
  const importsPage = read("src/app/imports/page.tsx");
  const importDetailPage = read("src/app/imports/[id]/page.tsx");
  const duplicatesPage = read("src/app/duplicates/page.tsx");
  const duplicateDetailPage = read("src/app/duplicates/[id]/page.tsx");
  const dataQualityPrimitives = read("src/components/data-quality-primitives.tsx");

  for (const source of [importsPage, importDetailPage, duplicatesPage, duplicateDetailPage, dataQualityPrimitives]) {
    assert.match(source, /@\/components\/clariobase-ui/);
    assert.doesNotMatch(source, /<main className="min-h-screen/);
    assert.doesNotMatch(source, /--cb-ui-/);
    assert.doesNotMatch(source, /bg-(slate|sky|cyan|emerald|rose|amber)-/);
    assert.doesNotMatch(source, /text-(slate|sky|cyan|emerald|rose|amber)-/);
    assert.doesNotMatch(source, /border-(slate|sky|cyan|emerald|rose|amber)-/);
    assert.doesNotMatch(source, /shadboard\/src|starter-kit\/src/);
  }

  for (const source of [importsPage, importDetailPage, duplicatesPage, duplicateDetailPage]) {
    assert.doesNotMatch(source, /import {[^}]*StatusPill/);
    assert.doesNotMatch(source, /<StatusPill/);
  }

  assert.doesNotMatch(importsPage, /IMPORT_BATCH_STATUS_LABELS\[batch\.status\]\}<\/div>\s*<DataQualityStatusBadge/);
  assert.doesNotMatch(importDetailPage, /IMPORT_BATCH_STATUS_LABELS\[batch\.status\]\}<\/div>\s*<DataQualityStatusBadge/);
  assert.doesNotMatch(importDetailPage, /IMPORT_ROW_STATUS_LABELS\[row\.status\]\}<\/div>\s*<DataQualityStatusBadge/);
  assert.doesNotMatch(duplicateDetailPage, /DUPLICATE_STATUS_LABELS\[candidate\.status\]\}<\/span>\s*<DataQualityStatusBadge/);

  assert.match(importsPage, /No import batches yet\./);
  assert.match(importDetailPage, /No row results available for this batch\./);
  assert.match(duplicatesPage, /No duplicate candidates yet\./);

  assert.match(importsPage, /DataQualityStatusBadge/);
  assert.match(importDetailPage, /DataQualityStatusBadge/);
  assert.match(duplicatesPage, /DataQualityStatusBadge/);
  assert.match(duplicateDetailPage, /DataQualityStatusBadge/);
  assert.match(dataQualityPrimitives, /export function DataQualityStatusBadge/);
  assert.match(importsPage, /<Table className="min-w-\[1050px\]">/);
  assert.match(duplicatesPage, /<Table className="min-w-\[1100px\]">/);
  assert.doesNotMatch(dataQualityPrimitives, /min-w-\[1050px\]|min-w-\[1100px\]/);

  assert.match(dataQualityPrimitives, /<dt className="text-xs font-medium uppercase tracking-\[0\.18em\]/);
  assert.match(dataQualityPrimitives, /<Badge tone=\{tone\}>{label}<\/Badge>/);
  assert.match(dataQualityPrimitives, /<dd className="mt-2 text-2xl font-semibold tabular-nums/);
  assert.doesNotMatch(dataQualityPrimitives, /<p className="text-xs font-medium uppercase tracking-\[0\.18em\]/);
  assert.doesNotMatch(dataQualityPrimitives, /<span className="text-2xl font-semibold tabular-nums/);
  assert.doesNotMatch(dataQualityPrimitives, /label.*label|value.*value/);

  assert.match(importsPage, /DataQualityStatusBadge\s*\n?\s*label=\{IMPORT_BATCH_STATUS_LABELS\[batch\.status\]\}/);
  assert.match(importDetailPage, /DataQualityStatusBadge\s*\n?\s*label=\{IMPORT_BATCH_STATUS_LABELS\[batch\.status\]\}/);
  assert.match(importDetailPage, /DataQualityStatusBadge\s*\n?\s*label=\{IMPORT_ROW_STATUS_LABELS\[row\.status\]\}/);
  assert.match(duplicatesPage, /DataQualityStatusBadge\s*\n?\s*label=\{DUPLICATE_STATUS_LABELS\[candidate\.status\]\}/);
  assert.match(duplicateDetailPage, /DataQualityStatusBadge\s*\n?\s*label=\{DUPLICATE_STATUS_LABELS\[candidate\.status\]\}/);

  assert.match(importsPage, /tone=\{batch\.status === "RUNNING" \? "information"/);
  assert.match(importDetailPage, /tone=\{batch\.status === "RUNNING" \? "information"/);
  assert.match(importDetailPage, /tone=\{row\.status === "CREATED" \? "success"/);
  assert.match(duplicatesPage, /tone=\{candidate\.status === "OPEN" \? "information"/);
  assert.match(duplicateDetailPage, /tone=\{candidate\.status === "OPEN" \? "information"/);

  assert.match(duplicateDetailPage, /import { Button, ButtonLink/);
  assert.match(duplicateDetailPage, /<Button type="submit" variant="secondary">/);
  assert.match(duplicateDetailPage, /<Button type="submit" variant="primary">/);
  assert.doesNotMatch(duplicateDetailPage, /<button type="submit" className=/);

  assert.match(importsPage, /<TableCell colSpan=\{6\} className="py-10 text-left sm:text-center/);
  assert.match(importDetailPage, /<TableCell colSpan=\{5\} className="py-10 text-left sm:text-center/);
  assert.match(duplicatesPage, /<TableCell colSpan=\{6\} className="py-10 text-left sm:text-center/);
  assert.doesNotMatch(importDetailPage, /<TableCell className="text-left sm:text-center text-\[color:var\(--cb-muted-foreground\)\]">\{row\.rowNumber\}<\/TableCell>/);
  assert.match(importsPage, /scope="col"/);
  assert.match(importDetailPage, /scope="col"/);
  assert.match(duplicatesPage, /scope="col"/);
  assert.match(duplicateDetailPage, /scope="col"/);
});

test("T006 route contracts keep the exact business mappings and semantics", () => {
  const importsPage = read("src/app/imports/page.tsx");
  const importDetailPage = read("src/app/imports/[id]/page.tsx");
  const duplicatesPage = read("src/app/duplicates/page.tsx");
  const duplicateDetailPage = read("src/app/duplicates/[id]/page.tsx");
  const dataQualityPrimitives = read("src/components/data-quality-primitives.tsx");

  assert.match(importsPage, /LOCAL_JSON: "Local file"/);
  assert.match(importsPage, /HARVESTER_EXPORT: "Harvester export"/);
  assert.match(importsPage, /MANUAL_AI_PREPARED_FILE: "Prepared AI file"/);
  assert.match(importsPage, /RUNNING: "In progress"/);
  assert.match(importsPage, /COMPLETED: "Completed successfully"/);
  assert.match(importsPage, /COMPLETED_WITH_ERRORS: "Completed with issues"/);
  assert.match(importsPage, /FAILED: "Failed"/);
  assert.match(importsPage, /DataQualityStatusBadge[\s\S]*IMPORT_BATCH_STATUS_LABELS\[batch\.status\][\s\S]*tone=\{batch\.status === "RUNNING" \? "information"/);

  assert.match(importDetailPage, /CREATED: "Lead created"/);
  assert.match(importDetailPage, /UPDATED: "Lead updated"/);
  assert.match(importDetailPage, /REJECTED: "Needs correction"/);
  assert.match(importDetailPage, /SKIPPED: "Skipped"/);
  assert.match(importDetailPage, /getRowOutcomeMessage/);
  assert.match(importDetailPage, /DataQualityStatusBadge[\s\S]*IMPORT_BATCH_STATUS_LABELS\[batch\.status\][\s\S]*tone=\{batch\.status === "RUNNING" \? "information"/);
  assert.match(importDetailPage, /DataQualityStatusBadge[\s\S]*IMPORT_ROW_STATUS_LABELS\[row\.status\][\s\S]*tone=\{row\.status === "CREATED" \? "success"/);

  assert.match(duplicatesPage, /OPEN: "Open review"/);
  assert.match(duplicatesPage, /NEEDS_REVIEW: "Needs closer review"/);
  assert.match(duplicatesPage, /DISMISSED: "Keep records separate"/);
  assert.match(duplicatesPage, /RESOLVED: "Review complete"/);
  assert.match(duplicatesPage, /score >= 95/);
  assert.match(duplicatesPage, /score >= 85/);
  assert.match(duplicatesPage, /slice\(0, 2\)/);

  assert.match(duplicateDetailPage, /updateDuplicateCandidateAction\.bind\(null, candidate\.id, DuplicateCandidateStatus\.DISMISSED\)/);
  assert.match(duplicateDetailPage, /updateDuplicateCandidateAction\.bind\(null, candidate\.id, DuplicateCandidateStatus\.NEEDS_REVIEW\)/);
  assert.match(duplicateDetailPage, /updateDuplicateCandidateAction\.bind\(null, candidate\.id, DuplicateCandidateStatus\.RESOLVED\)/);
  assert.match(duplicateDetailPage, /DataQualityStatusBadge[\s\S]*DUPLICATE_STATUS_LABELS\[candidate\.status\][\s\S]*tone=\{candidate\.status === "OPEN" \? "information"/);
  assert.match(duplicateDetailPage, /Customer ID/);
  assert.match(duplicateDetailPage, /Google Place ID/);
  assert.match(duplicateDetailPage, /Source record ID/);
  assert.match(duplicateDetailPage, /Decision note:/);
  assert.match(duplicateDetailPage, /target="_blank"/);
  assert.match(duplicateDetailPage, /rel="noreferrer"/);
  assert.match(duplicateDetailPage, /Matching field/);
  assert.match(duplicateDetailPage, /Different field/);
  assert.match(duplicateDetailPage, /Missing on both records/);

  assert.match(dataQualityPrimitives, /tone:\s*"neutral" \| "success" \| "warning" \| "danger" \| "information"/);
});
