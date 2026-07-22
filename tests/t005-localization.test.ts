import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createTranslator } from "../src/i18n/translate";
import { DUPLICATE_NOTICE_KEYS, getDuplicateNoticeTranslationKey } from "../src/lib/duplicate-notices";
import { getDuplicateSignalLabelTranslationKey } from "../src/lib/duplicate-reasons";

const repoRoot = path.resolve(__dirname, "..");
const read = (filePath: string) => fs.readFileSync(path.join(repoRoot, filePath), "utf8");

test("remaining operational routes use typed translations and shared formatting", () => {
  const localizedFiles = ["src/app/imports/page.tsx", "src/app/imports/[id]/page.tsx", "src/app/duplicates/page.tsx", "src/app/duplicates/[id]/page.tsx", "src/app/reports/sales/page.tsx", "src/app/admin/users/page.tsx", "src/app/health/page.tsx", "src/app/not-found.tsx"];
  for (const file of localizedFiles) {
    const source = read(file);
    assert.match(source, /\bt\(/, `${file} must use translations`);
    assert.doesNotMatch(source, /en-GB|toLocale(?:Date|Time|String)/, `${file} must use shared formatters`);
  }
  assert.match(read("src/app/imports/[id]/page.tsx"), /\{row\.rejectionReason\}/);
  assert.match(read("src/app/duplicates/[id]/page.tsx"), /candidate\.decisionNote/);
  assert.match(read("src/app/admin/users/page.tsx"), /session\.ipAddress/);
});

test("duplicate mutations expose stable localized notice codes", () => {
  const en = createTranslator("en-US");
  const pl = createTranslator("pl-PL");
  for (const key of Object.values(DUPLICATE_NOTICE_KEYS)) {
    assert.ok(en(key));
    assert.ok(pl(key));
  }
  assert.equal(pl(getDuplicateNoticeTranslationKey("review_updated")), "Zaktualizowano weryfikację duplikatu.");
  assert.equal(en(getDuplicateNoticeTranslationKey("unknown")), "The duplicate review could not be updated.");
  assert.match(read("src/app/duplicates/actions.ts"), /noticeCode=review_updated/);
  assert.match(read("src/app/duplicates/actions.ts"), /noticeCode=update_failed/);
});

test("known duplicate signals localize while unknown stored labels stay available", () => {
  const pl = createTranslator("pl-PL");
  const known = getDuplicateSignalLabelTranslationKey("phone");
  assert.ok(known);
  assert.equal(pl(known), "Ten sam numer telefonu");
  assert.equal(getDuplicateSignalLabelTranslationKey("custom-imported-signal"), null);
  assert.match(read("src/app/duplicates/page.tsx"), /key \? t\(key\) : reason\.label/);
  assert.match(read("src/app/duplicates/[id]/page.tsx"), /signalLabelKey \? t\(signalLabelKey\) : entry\.label/);
});

test("health keeps machine values while localizing presentation", () => {
  const health = read("src/app/health/page.tsx");
  assert.match(health, /getRuntimeReadiness\(\)/);
  assert.match(health, /\{body\.service\}/);
  assert.match(health, /\{body\.status\}/);
  assert.match(health, /formatDateTime\(body\.timestamp\)/);
  assert.match(health, /TechnicalDisclosure/);
  assert.match(health, /t\("health\.title"\)/);
  assert.match(health, /noStore\(\)/);
});

test("Polish and English route copy is available with English fallback semantics", () => {
  const en = createTranslator("en-US");
  const pl = createTranslator("pl-PL");
  assert.equal(pl("imports.title"), "Partie importu");
  assert.equal(en("imports.title"), "Import batches");
  assert.equal(pl("duplicates.title"), "Kandydaci na duplikaty");
  assert.equal(en("sales.title"), "Operational pipeline report");
  assert.equal(createTranslator("pl-PL", {})("notFound.back"), "Back to Dashboard");
});
