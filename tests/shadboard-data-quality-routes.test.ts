import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("T006 routes consume the project-owned ui boundary and keep presentation-only behavior", () => {
  const importsPage = read("src/app/imports/page.tsx");
  const importDetailPage = read("src/app/imports/[id]/page.tsx");
  const duplicatesPage = read("src/app/duplicates/page.tsx");
  const duplicateDetailPage = read("src/app/duplicates/[id]/page.tsx");

  for (const source of [importsPage, importDetailPage, duplicatesPage, duplicateDetailPage]) {
    assert.match(source, /@\/components\/clariobase-ui/);
    assert.match(source, /@\/components\/data-quality-primitives/);
    assert.doesNotMatch(source, /<main className="min-h-screen/);
    assert.doesNotMatch(source, /--cb-ui-/);
    assert.doesNotMatch(source, /bg-(slate|sky|cyan|emerald|rose|amber)-/);
    assert.doesNotMatch(source, /text-(slate|sky|cyan|emerald|rose|amber)-/);
    assert.doesNotMatch(source, /border-(slate|sky|cyan|emerald|rose|amber)-/);
    assert.doesNotMatch(source, /shadboard\/src|starter-kit\/src/);
  }

  assert.match(importsPage, /Local file/);
  assert.match(importsPage, /Harvester export/);
  assert.match(importsPage, /Prepared AI file/);
  assert.match(importsPage, /In progress/);
  assert.match(importsPage, /Completed successfully/);
  assert.match(importsPage, /Completed with issues/);
  assert.match(importsPage, /Failed/);
  assert.match(importsPage, /Total/);
  assert.match(importsPage, /Created/);
  assert.match(importsPage, /Updated/);
  assert.match(importsPage, /Rejected/);
  assert.match(importsPage, /Skipped/);
  assert.match(importsPage, /caption className="sr-only">Import batches and their processing results\./);
  assert.match(importsPage, /scope="col"/);
  assert.match(importsPage, /aria-label={`Open results for \$\{getBatchLabel\(batch\)\}`}/);
  assert.match(importsPage, /No import batches yet\./);

  assert.match(importDetailPage, /Total rows/);
  assert.match(importDetailPage, /Created/);
  assert.match(importDetailPage, /Updated/);
  assert.match(importDetailPage, /Rejected/);
  assert.match(importDetailPage, /Skipped/);
  assert.match(importDetailPage, /Row/);
  assert.match(importDetailPage, /Status/);
  assert.match(importDetailPage, /Business context/);
  assert.match(importDetailPage, /Source context/);
  assert.match(importDetailPage, /Result/);
  assert.match(importDetailPage, /Lead created/);
  assert.match(importDetailPage, /Lead updated/);
  assert.match(importDetailPage, /Needs correction/);
  assert.match(importDetailPage, /No row results available for this batch\./);
  assert.match(importDetailPage, /Technical validation details/);
  assert.match(importDetailPage, /whitespace-pre-wrap/);
  assert.match(importDetailPage, /break-words/);
  assert.match(importDetailPage, /aria-label={`Open lead for row/);
  assert.match(importDetailPage, /appearance="foundation"/);

  assert.match(duplicatesPage, /Very high confidence/);
  assert.match(duplicatesPage, /High confidence/);
  assert.match(duplicatesPage, /Needs closer review/);
  assert.match(duplicatesPage, /Open review/);
  assert.match(duplicatesPage, /versus/);
  assert.match(duplicatesPage, /slice\(0, 2\)/);
  assert.match(duplicatesPage, /Open duplicate review for/);
  assert.match(duplicatesPage, /No duplicate candidates yet\./);
  assert.match(duplicatesPage, /appearance="foundation"/);

  assert.match(duplicateDetailPage, /getComparisonState/);
  assert.match(duplicateDetailPage, /if \(!normalizedLeft && !normalizedRight\)/);
  assert.match(duplicateDetailPage, /match/);
  assert.match(duplicateDetailPage, /difference/);
  assert.match(duplicateDetailPage, /missing/);
  assert.match(duplicateDetailPage, /Business name/);
  assert.match(duplicateDetailPage, /City/);
  assert.match(duplicateDetailPage, /Category/);
  assert.match(duplicateDetailPage, /Phone/);
  assert.match(duplicateDetailPage, /Email/);
  assert.match(duplicateDetailPage, /Website/);
  assert.match(duplicateDetailPage, /Instagram/);
  assert.match(duplicateDetailPage, /Facebook/);
  assert.match(duplicateDetailPage, /Matching field/);
  assert.match(duplicateDetailPage, /Different field/);
  assert.match(duplicateDetailPage, /Missing on both records/);
  assert.match(duplicateDetailPage, /target="_blank"/);
  assert.match(duplicateDetailPage, /rel="noreferrer"/);
  assert.match(duplicateDetailPage, /updateDuplicateCandidateAction\.bind\(null, candidate\.id, DuplicateCandidateStatus\.DISMISSED\)/);
  assert.match(duplicateDetailPage, /updateDuplicateCandidateAction\.bind\(null, candidate\.id, DuplicateCandidateStatus\.NEEDS_REVIEW\)/);
  assert.match(duplicateDetailPage, /updateDuplicateCandidateAction\.bind\(null, candidate\.id, DuplicateCandidateStatus\.RESOLVED\)/);
  assert.match(duplicateDetailPage, /Keep both records separate/);
  assert.match(duplicateDetailPage, /Flag for closer review/);
  assert.match(duplicateDetailPage, /Mark review complete/);
  assert.doesNotMatch(duplicateDetailPage, /merge action|merging|merged records|Merge/i);
  assert.match(duplicateDetailPage, /Candidate status/);
  assert.match(duplicateDetailPage, /Reviewed at/);
  assert.match(duplicateDetailPage, /Updated at/);
  assert.match(duplicateDetailPage, /Decision note:/);
  assert.match(duplicateDetailPage, /appearance="foundation"/);
});
