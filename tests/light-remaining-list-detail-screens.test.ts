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
  assert.match(importsPage, /StatusPill value=\{batch\.status\} appearance="light"/);
  assert.match(importsPage, /From /);
  assert.match(importsPage, /Open batch/);

  assert.match(importDetailPage, /caption className="sr-only">Individual row results for the selected import batch\./);
  assert.match(importDetailPage, /StatusPill value=\{row\.status\} appearance="light"/);
  assert.match(importDetailPage, /focus-visible:ring-2/);
  assert.match(importDetailPage, /Open lead/);
  assert.match(importDetailPage, /Show raw validation note/);
  assert.match(importDetailPage, /aria-label=\{`Open lead detail for row/);

  assert.match(duplicatesPage, /caption className="sr-only">Duplicate candidates awaiting review\./);
  assert.match(duplicatesPage, /StatusPill value=\{candidate\.status\} appearance="light"/);
  assert.match(duplicatesPage, /focus-visible:ring-2/);
  assert.match(duplicatesPage, /Open review/);
  assert.match(duplicatesPage, /Confidence/);
  assert.match(duplicatesPage, /Signals/);

  assert.match(duplicateDetailPage, /updateDuplicateCandidateAction\.bind\(null, candidate\.id, DuplicateCandidateStatus\.DISMISSED\)/);
  assert.match(duplicateDetailPage, /DuplicateCandidateStatus\.RESOLVED/);
  assert.match(duplicateDetailPage, /StatusPill value=\{candidate\.status\} appearance="light"/);
  assert.match(duplicateDetailPage, /focus-visible:ring-2/);
  assert.match(duplicateDetailPage, /ExternalLink/);
  assert.match(duplicateDetailPage, /Compare leads/);
  assert.match(duplicateDetailPage, /Mark dismissed/);
  assert.match(duplicateDetailPage, /Keep open for review/);
  assert.match(duplicateDetailPage, /Technical identifiers/);

  assert.match(healthPage, /System status/);
  assert.match(healthPage, /Minimal runtime probe for deployment and uptime checks\./);
  assert.match(healthPage, /rounded-3xl border border-slate-200 bg-white/);
});
