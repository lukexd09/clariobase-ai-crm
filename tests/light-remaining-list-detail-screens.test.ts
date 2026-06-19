import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("remaining legacy list and detail screens use the light shell baseline", () => {
  const importsPage = read("src/app/imports/page.tsx");
  const importDetailPage = read("src/app/imports/[id]/page.tsx");
  const duplicatesPage = read("src/app/duplicates/page.tsx");
  const duplicateDetailPage = read("src/app/duplicates/[id]/page.tsx");
  const healthPage = read("src/app/health/page.tsx");

  for (const source of [importsPage, importDetailPage, duplicatesPage, duplicateDetailPage, healthPage]) {
    assert.match(source, /bg-slate-50/);
    assert.doesNotMatch(source, /bg-slate-950/);
    assert.doesNotMatch(source, /border-slate-800/);
  }

  assert.match(importsPage, /caption className="sr-only">Import batches and their processing results\./);
  assert.match(importsPage, /scope="col"/);
  assert.match(importsPage, /focus-visible:ring-2/);
  assert.match(importsPage, /Technical details/);
  assert.match(importsPage, /Imported from file/);
  assert.match(importsPage, /Finished cleanly|Finished with row issues|Processing|Stopped|Status not known/);
  assert.match(importsPage, /Open results/);

  assert.match(importDetailPage, /caption className="sr-only">Individual row results for the selected import batch\./);
  assert.match(importDetailPage, /StatusPill value=\{row\.status\} appearance="light"/);
  assert.match(importDetailPage, /focus-visible:ring-2/);
  assert.match(importDetailPage, /Open lead/);
  assert.match(importDetailPage, /Show technical validation note/);
  assert.match(importDetailPage, /aria-label=\{`Open lead detail for row/);

  assert.match(duplicatesPage, /caption className="sr-only">Duplicate candidates awaiting review\./);
  assert.match(duplicatesPage, /StatusPill value=\{candidate\.status\} appearance="light"/);
  assert.match(duplicatesPage, /focus-visible:ring-2/);
  assert.match(duplicatesPage, /Compare/);
  assert.match(duplicatesPage, /Match strength/);
  assert.match(duplicatesPage, /What matches/);

  assert.match(duplicateDetailPage, /updateDuplicateCandidateAction\.bind\(null, candidate\.id, DuplicateCandidateStatus\.DISMISSED\)/);
  assert.match(duplicateDetailPage, /DuplicateCandidateStatus\.RESOLVED/);
  assert.match(duplicateDetailPage, /StatusPill value=\{candidate\.status\} appearance="light"/);
  assert.match(duplicateDetailPage, /focus-visible:ring-2/);
  assert.match(duplicateDetailPage, /ExternalLink/);
  assert.match(duplicateDetailPage, /Compare records/);
  assert.match(duplicateDetailPage, /Keep both records separate/);
  assert.match(duplicateDetailPage, /Flag for closer review/);
  assert.match(duplicateDetailPage, /Confirm duplicate and close review/);
  assert.match(duplicateDetailPage, /Technical matching details/);

  assert.match(healthPage, /System status/);
  assert.match(healthPage, /Administrative readiness check for the deployed environment and database\./);
  assert.match(healthPage, /w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm/);
});
