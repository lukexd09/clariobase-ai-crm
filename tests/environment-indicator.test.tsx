import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EnvironmentIndicator } from "@/components/environment-indicator";

function renderWithEnv(value: string | undefined) {
  const original = process.env.CRM_DEPLOYMENT_ENV;

  if (value === undefined) {
    delete process.env.CRM_DEPLOYMENT_ENV;
  } else {
    process.env.CRM_DEPLOYMENT_ENV = value;
  }

  const html = renderToStaticMarkup(<EnvironmentIndicator />);

  if (original === undefined) {
    delete process.env.CRM_DEPLOYMENT_ENV;
  } else {
    process.env.CRM_DEPLOYMENT_ENV = original;
  }

  return html;
}

test("production hides the environment marker", () => {
  const html = renderWithEnv("production");
  assert.equal(html, "");
});

test("preview shows the environment marker", () => {
  const html = renderWithEnv("preview");
  assert.match(html, /TEST ENVIRONMENT — data in this environment may be reset or deleted\./);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, />TEST</);
});

test("invalid or missing values show the environment marker", () => {
  assert.match(renderWithEnv("invalid"), /TEST ENVIRONMENT — data in this environment may be reset or deleted\./);
  assert.match(renderWithEnv(undefined), /TEST ENVIRONMENT — data in this environment may be reset or deleted\./);
});
