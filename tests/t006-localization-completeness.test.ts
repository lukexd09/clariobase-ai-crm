import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { enUS } from "../src/i18n/dictionaries/en-US";
import { createTranslator } from "../src/i18n/translate";
import { runLocalizationAudit, HARDCODED_COPY_EXCEPTIONS, TECHNICAL_FORMAT_EXCEPTIONS } from "../scripts/verify-localization";

const repoRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");

test("repository-owned localization audit has no unexplained findings", () => {
  const result = runLocalizationAudit(repoRoot);
  assert.equal(result.dictionaries.englishCount, result.dictionaries.polishCount);
  assert.ok(result.dictionaries.englishCount > 600);
  assert.deepEqual(result.dictionaries.duplicateEnglish, []);
  assert.deepEqual(result.dictionaries.duplicatePolish, []);
  assert.deepEqual(result.dictionaries.missingPolish, []);
  assert.deepEqual(result.dictionaries.extraPolish, []);
  assert.deepEqual(result.dictionaries.placeholderMismatches, []);
  assert.deepEqual(result.dictionaries.literalKeyFindings, []);
  assert.deepEqual(result.copy.findings, []);
  assert.deepEqual(result.copy.unusedExceptions, []);
  assert.deepEqual(result.formatting.findings, []);
});

test("canonical English fallback returns copy and never the raw key", () => {
  const fallback = createTranslator("pl-PL", {});
  for (const key of Object.keys(enUS) as Array<keyof typeof enUS>) {
    const placeholders = [...enUS[key].matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].reduce<Record<string, string>>((values, match) => ({ ...values, [match[1]]: "proof" }), {});
    const rendered = fallback(key, placeholders);
    assert.notEqual(rendered, key, key);
    assert.equal(rendered, createTranslator("en-US")(key, placeholders), key);
  }
});

test("approved literal and technical-format exceptions are narrow and documented", () => {
  assert.ok(HARDCODED_COPY_EXCEPTIONS.length > 0);
  assert.ok(TECHNICAL_FORMAT_EXCEPTIONS.length > 0);
  for (const entry of [...HARDCODED_COPY_EXCEPTIONS, ...TECHNICAL_FORMAT_EXCEPTIONS]) {
    assert.ok(entry.file.startsWith("src/"));
    assert.ok(entry.value.length > 0);
    assert.ok(entry.reason.endsWith("."));
  }
  const report = read("docs/verification/e010-localization-completeness.md");
  for (const entry of HARDCODED_COPY_EXCEPTIONS) {
    assert.match(report, new RegExp(entry.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const entry of TECHNICAL_FORMAT_EXCEPTIONS) assert.match(report, new RegExp(entry.value));
});

test("canonical docs describe extension and deferred preference contracts", () => {
  const architecture = read("docs/architecture/localization.md");
  const inventory = read("docs/verification/e010-active-copy-inventory.md");
  const report = read("docs/verification/e010-localization-completeness.md");
  assert.match(architecture, /Adding new UI copy/);
  assert.match(architecture, /Adding a future language/);
  assert.match(architecture, /Deferred manual and persistent selection/);
  assert.match(inventory, /Unassigned active surfaces:\s*none/i);
  assert.match(report, /Hardcoded-copy audit/);
  assert.match(report, /Browser context matrix/);
});
