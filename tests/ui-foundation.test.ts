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

  assert.match(doc, /background: '#F7F4EF'/);
  assert.match(doc, /Light mode only for the current product scope\./);
  assert.match(doc, /Import project-owned primitives from `src\/components\/clariobase-ui\/`/);
  assert.match(doc, /ButtonLink/);
  assert.match(doc, /EmptyState/);
  assert.match(doc, /Geist only for the current product scope/);
  assert.match(doc, /clamp\(212px, 14vw, 236px\)/);
  assert.match(doc, /minimum 44 px height/);

  assert.match(tokens, /background: "#F7F4EF"/);
  assert.match(tokens, /accentHover: "#9E5270"/);
  assert.match(tokens, /disabledOpacity: "0\.56"/);
  assert.doesNotMatch(tokens, /darkMode/);
  assert.doesNotMatch(tokens, /#004870/);
});

test("global foundation keeps light-first production styling", () => {
  const globalsCss = read("src/app/globals.css");
  const primitives = [
    read("src/components/clariobase-ui/button.tsx"),
    read("src/components/clariobase-ui/surface.tsx"),
    read("src/components/clariobase-ui/status.tsx"),
    read("src/components/clariobase-ui/field.tsx"),
    read("src/components/clariobase-ui/table.tsx"),
    read("src/components/clariobase-ui/feedback.tsx")
  ].join("\n");

  assert.match(globalsCss, /color-scheme:\s*light;/);
  assert.match(globalsCss, /font-family:\s*var\(--cb-font-family\)/);
  assert.match(globalsCss, /--clariobase-background:\s*#f7f4ef;/);
  assert.match(globalsCss, /--clariobase-accent:\s*#b36a86;/);
  assert.match(globalsCss, /--cb-focus-ring:\s*var\(--clariobase-focus-ring\)/);
  assert.match(globalsCss, /background:\s*var\(--clariobase-background\);/);
  assert.match(globalsCss, /radial-gradient\(circle at top left/);
  assert.doesNotMatch(globalsCss, /color-scheme:\s*dark;/);
  assert.doesNotMatch(globalsCss, /#004870/);
  assert.doesNotMatch(globalsCss, /#0284C7/);

  assert.match(primitives, /focus-visible:ring-\[color:var\(--cb-focus-ring\)\]/);
  assert.match(primitives, /disabled:pointer-events-none disabled:opacity-\[var\(--cb-disabled-opacity\)\]/);
  assert.match(primitives, /aria-hidden="true"/);
  assert.match(primitives, /role="status"/);
  assert.match(primitives, /Pagination/);
});
