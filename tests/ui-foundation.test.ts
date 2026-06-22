import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("canonical design token contract is documented and exposed", () => {
  const doc = read("docs/design/clariobase-ui-v1.md");
  const tokens = read("src/lib/design-tokens.ts");

  assert.match(doc, /primary: '#006194'/);
  assert.match(doc, /Geist only/);
  assert.match(doc, /clamp\(220px, 16vw, 260px\)/);
  assert.match(doc, /minimum 44 px height/);

  assert.match(tokens, /primary: "#006194"/);
  assert.match(tokens, /surfaceSubtle: "#F1F5F9"/);
  assert.doesNotMatch(tokens, /#004870/);
  assert.doesNotMatch(tokens, /#0284C7/);
});

test("global foundation keeps light-first production styling", () => {
  const globalsCss = read("src/app/globals.css");

  assert.match(globalsCss, /color-scheme:\s*light;/);
  assert.match(globalsCss, /font-family:\s*"Geist"/);
  assert.match(globalsCss, /--clariobase-primary:\s*#006194;/);
  assert.match(globalsCss, /background:\s*var\(--clariobase-background\);/);
  assert.doesNotMatch(globalsCss, /#004870/);
  assert.doesNotMatch(globalsCss, /#0284C7/);
});
