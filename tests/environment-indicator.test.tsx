import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EnvironmentIndicator } from "@/components/environment-indicator";
import { createTranslator } from "@/i18n/translate";

function renderWithEnv(value: string | undefined | null, locale: "en-US" | "pl-PL" = "en-US") {
  const original = process.env.CRM_DEPLOYMENT_ENV;

  if (value === undefined || value === null) {
    delete process.env.CRM_DEPLOYMENT_ENV;
  } else {
    process.env.CRM_DEPLOYMENT_ENV = value;
  }

  const html = renderToStaticMarkup(<EnvironmentIndicator description={createTranslator(locale)("environment.testDescription")} />);

  if (original === undefined) {
    delete process.env.CRM_DEPLOYMENT_ENV;
  } else {
    process.env.CRM_DEPLOYMENT_ENV = original;
  }

  return html;
}

function countTestMarks(html: string) {
  return (html.match(/>TEST<\/span>/g) ?? []).length;
}

test("production hides the environment marker", () => {
  const html = renderWithEnv("production");
  assert.equal(html, "");
});

test("preview shows the repeated watermark marker", () => {
  const html = renderWithEnv("preview");
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /pointer-events-none/);
  assert.match(html, /select-none/);
  assert.match(html, /fixed inset-0/);
  assert.equal(countTestMarks(html) >= 4, true);
  assert.match(html, /Test environment\. Data may be reset or deleted\./);
  assert.match(renderWithEnv("preview", "pl-PL"), /Środowisko testowe\. Dane mogą zostać zresetowane lub usunięte\./);
});

test("invalid or missing values show the repeated watermark marker", () => {
  assert.equal(countTestMarks(renderWithEnv("invalid")) >= 4, true);
  assert.equal(countTestMarks(renderWithEnv("PRODUCTION")) >= 4, true);
  assert.equal(countTestMarks(renderWithEnv(" production ")) >= 4, true);
  assert.equal(countTestMarks(renderWithEnv(undefined)) >= 4, true);
  assert.equal(countTestMarks(renderWithEnv("")) >= 4, true);
  assert.equal(countTestMarks(renderWithEnv(null)) >= 4, true);
});
