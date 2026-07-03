import test from "node:test";
import assert from "node:assert/strict";

function select(command: string, args: string[]) {
  if (command === "smoke") return ["test", "--grep", "@smoke"];
  if (command === "full") return ["test"];
  if (command === "area") {
    assert.ok(args[0], "area selection requires a known area");
    return ["test", "--grep", `@area:${args[0]}`];
  }
  throw new Error("unsupported command");
}

test("e2e command selection maps smoke, area, and full correctly", () => {
  assert.deepEqual(select("smoke", []), ["test", "--grep", "@smoke"]);
  assert.deepEqual(select("area", ["dashboard"]), ["test", "--grep", "@area:dashboard"]);
  assert.deepEqual(select("area", ["leads"]), ["test", "--grep", "@area:leads"]);
  assert.deepEqual(select("full", []), ["test"]);
  assert.throws(() => select("area", []), /area selection requires a known area/);
  assert.throws(() => select("unknown", []), /unsupported command/);
});

