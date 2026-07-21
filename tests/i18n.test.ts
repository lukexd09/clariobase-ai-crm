import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { enUS } from "../src/i18n/dictionaries/en-US";
import { plPL } from "../src/i18n/dictionaries/pl-PL";
import { formatCurrency, formatDate, formatDateTime, formatDateTimeLocalInput, formatNumber, formatPercent } from "../src/i18n/format";
import { I18nProvider, useI18n } from "../src/i18n/provider";
import { resolveRequestLocale } from "../src/i18n/resolve-request-locale";
import { createTranslator, getPlaceholders } from "../src/i18n/translate";

const repoRoot = path.resolve(import.meta.dirname, "..");

test("resolves supported browser language ranges and regional variants", () => {
  for (const value of ["pl", "pl-PL", "pl-Latn-PL", "PL-pl"]) assert.equal(resolveRequestLocale(value), "pl-PL");
  for (const value of ["en", "en-US", "en-GB", "EN-us"]) assert.equal(resolveRequestLocale(value), "en-US");
});

test("uses weights, source order, exclusions, and supported ranges deterministically", () => {
  assert.equal(resolveRequestLocale("pl-PL;q=0.8,en-US;q=0.9"), "en-US");
  assert.equal(resolveRequestLocale("en-US;q=0.8,pl-PL;q=0.9"), "pl-PL");
  assert.equal(resolveRequestLocale("pl;q=0.8,en;q=0.8"), "pl-PL");
  assert.equal(resolveRequestLocale("de-DE;q=1,pl;q=0.7"), "pl-PL");
  assert.equal(resolveRequestLocale("pl;q=0,en;q=0.5"), "en-US");
  assert.equal(resolveRequestLocale("en;q=0,pl;q=0"), "en-US");
});

test("falls back to English for missing, unsupported, wildcard-only, or malformed headers", () => {
  for (const value of [undefined, null, "", "   ", "de-DE", "*", "*;q=0.8", "en;q=bad,pl;q=1", "pl;q=1.2", "pl;;q=1", ",pl", "pl;q=1;foo=bar"]) {
    assert.equal(resolveRequestLocale(value), "en-US");
  }
});

test("dictionaries keep key and placeholder parity", () => {
  assert.deepEqual(Object.keys(plPL).sort(), Object.keys(enUS).sort());
  for (const key of Object.keys(enUS) as Array<keyof typeof enUS>) {
    assert.deepEqual(getPlaceholders(plPL[key]).sort(), getPlaceholders(enUS[key]).sort(), key);
  }
});

test("Polish can fall back to English but missing English fails", () => {
  const polish = createTranslator("pl-PL", { "metadata.title": "ClarioBase AI CRM" });
  assert.equal(polish("common.loading"), "Loading...");
  const withoutEnglish = createTranslator("en-US", {}, {});
  assert.throws(() => withoutEnglish("common.loading"), /Missing English translation/);
});

test("interpolation is named and requires every value", () => {
  const t = createTranslator("pl-PL");
  assert.equal(t("common.results", { count: 12 }), "12 wyników");
  assert.throws(() => t("common.results"), /Missing interpolation value: count/);
});

test("formatters use locale conventions and deterministic Warsaw time", () => {
  const instant = "2026-01-15T12:30:00.000Z";
  assert.notEqual(formatDateTime("pl-PL", instant), formatDateTime("en-US", instant));
  assert.match(formatDate("pl-PL", "2026-01-15"), /15/);
  assert.notEqual(formatNumber("pl-PL", 1234.5), formatNumber("en-US", 1234.5));
  assert.notEqual(
    formatPercent("pl-PL", 0.255, { maximumFractionDigits: 1 }),
    formatPercent("en-US", 0.255, { maximumFractionDigits: 1 })
  );
  assert.match(formatCurrency("pl-PL", 1234.5, "PLN"), /1[\s\u00a0]?234,50/);
  assert.equal(formatCurrency("pl-PL", 1234.5, "123"), "Niedostępne");
  assert.equal(formatDateTimeLocalInput(new Date("2026-01-15T12:00:00.000Z")), "2026-01-15T13:00");
  assert.equal(formatDateTimeLocalInput(new Date("2026-07-15T12:00:00.000Z")), "2026-07-15T14:00");
  assert.equal(formatDate("pl-PL", "invalid"), "Niedostępne");
  assert.equal(formatDate("en-US", "2026-02-31"), "Unavailable");
  assert.equal(formatDate("en-US", "01/02/2026"), "Unavailable");
  assert.match(formatDateTime("en-US", "2026-03-29T00:30:00.000Z"), /1:30 AM$/);
  assert.match(formatDateTime("en-US", "2026-03-29T01:30:00.000Z"), /3:30 AM$/);
});

test("provider renders from server-selected state without an independent browser resolver", () => {
  function Proof() {
    const { locale, t } = useI18n();
    return React.createElement("p", { lang: locale }, t("common.results", { count: 2 }));
  }
  const tree = React.createElement(I18nProvider, { locale: "pl-PL", messages: plPL }, React.createElement(Proof));
  const first = renderToStaticMarkup(tree);
  const second = renderToStaticMarkup(tree);
  assert.equal(first, second);
  assert.match(first, /lang="pl-PL"/);
  assert.doesNotMatch(fs.readFileSync(path.join(repoRoot, "src/i18n/provider.tsx"), "utf8"), /navigator\.language/);
});

test("root layout uses request locale for html, metadata, and provider hydration state", () => {
  const source = fs.readFileSync(path.join(repoRoot, "src/app/layout.tsx"), "utf8");
  assert.match(source, /<html lang=\{locale\}>/);
  assert.match(source, /<I18nProvider locale=\{locale\} messages=\{messages\}>/);
  assert.match(source, /generateMetadata/);
  assert.doesNotMatch(source, /lang="en"/);
});
