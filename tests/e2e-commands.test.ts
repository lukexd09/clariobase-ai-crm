import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function select(command: string, args: string[]) {
  if (command === "smoke") return ["test", "--grep", "@smoke"];
  if (command === "full") return ["test"];
  if (command === "area") {
    assert.ok(args[0], "area selection requires a known area");
    assert.ok(!args[1], "area selection accepts exactly one area argument");
    return ["test", "--grep", `@area:${args[0]}`];
  }
  throw new Error("unsupported command");
}

function hasExactTag(text: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`).test(text);
}

test("e2e command selection maps smoke, area, and full correctly", () => {
  assert.deepEqual(select("smoke", []), ["test", "--grep", "@smoke"]);
  assert.deepEqual(select("area", ["dashboard"]), ["test", "--grep", "@area:dashboard"]);
  assert.deepEqual(select("area", ["leads"]), ["test", "--grep", "@area:leads"]);
  assert.deepEqual(select("full", []), ["test"]);
  assert.throws(() => select("area", []), /area selection requires a known area/);
  assert.throws(() => select("area", ["dashboard", "extra"]), /accepts exactly one area argument/);
  assert.throws(() => select("unknown", []), /unsupported command/);
});

test("e2e command and tag semantics stay exact", () => {
  assert.equal(hasExactTag("@smoke home page exposes the operator dashboard heading", "@smoke"), true);
  assert.equal(hasExactTag("@smoke-extra", "@smoke"), false);
  assert.equal(hasExactTag("@area:leads @smoke synthetic lead is visible on /leads", "@area:leads"), true);
  assert.equal(hasExactTag("@area:leads @smoke synthetic lead is visible on /leads", "@area"), false);
});

