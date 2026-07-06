import test from "node:test";
import assert from "node:assert/strict";
import { buildPlaywrightGrepForMode, resolveE2EArea, resolveE2EMode } from "../scripts/e2e-command";

function hasExactTag(text: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`).test(text);
}

test("e2e command selection maps smoke, area, and full correctly", () => {
  assert.equal(resolveE2EMode("smoke"), "smoke");
  assert.equal(resolveE2EMode("area"), "area");
  assert.equal(resolveE2EMode("full"), "full");
  assert.throws(() => resolveE2EMode(undefined), /Unknown E2E mode/);
  assert.throws(() => resolveE2EMode("unknown"), /Unknown E2E mode/);

  assert.equal(resolveE2EArea("dashboard"), "dashboard");
  assert.equal(resolveE2EArea(" leads "), "leads");
  assert.throws(() => resolveE2EArea(undefined), /required/);
  assert.throws(() => resolveE2EArea("unknown"), /Unknown E2E area/);

  assert.equal(buildPlaywrightGrepForMode("smoke"), String.raw`(?<![A-Za-z0-9_-])@smoke(?![A-Za-z0-9_-])`);
  assert.equal(buildPlaywrightGrepForMode("area", "dashboard"), String.raw`(?<![A-Za-z0-9_-])@area:dashboard(?![A-Za-z0-9_-])`);
  assert.equal(buildPlaywrightGrepForMode("area", "leads"), String.raw`(?<![A-Za-z0-9_-])@area:leads(?![A-Za-z0-9_-])`);
  assert.equal(buildPlaywrightGrepForMode("full"), "");
});

test("e2e command and tag semantics stay exact", () => {
  assert.equal(hasExactTag("@smoke home page exposes the operator dashboard heading", "@smoke"), true);
  assert.equal(hasExactTag("@smoke-extra", "@smoke"), false);
  assert.equal(hasExactTag("@area:leads @smoke synthetic lead is visible on /leads", "@area:leads"), true);
  assert.equal(hasExactTag("@area:leads @smoke synthetic lead is visible on /leads", "@area"), false);
});

