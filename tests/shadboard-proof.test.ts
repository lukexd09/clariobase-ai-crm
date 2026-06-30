import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("shadboard adoption decision documents the provenance split", () => {
  const doc = read("docs/architecture/shadboard-adoption-decision.md");

  assert.match(doc, /Epic synchronization commit: `c800ca5e8cebc83a0fc71087e0c6bdc457640725`/);
  assert.match(doc, /PR base SHA: `c800ca5e8cebc83a0fc71087e0c6bdc457640725`/);
  assert.match(doc, /Current proof boundary:/);
  assert.match(doc, /`src\/components\/clariobase-ui\/`/);
  assert.match(doc, /Pinned release: `v1.5.1`/);
  assert.match(doc, /Pinned commit: `ece0dab7282175002f5103afbac6f86306169a4e`/);
  assert.match(doc, /button\.tsx/);
  assert.match(doc, /input\.tsx/);
  assert.match(doc, /card\.tsx/);
  assert.match(doc, /sheet\.tsx/);
  assert.match(doc, /src\/components\/clariobase-ui\/button\.tsx/);
  assert.match(doc, /src\/components\/clariobase-ui\/field\.tsx/);
  assert.match(doc, /src\/components\/clariobase-ui\/surface\.tsx/);
  assert.match(doc, /src\/components\/clariobase-ui\/proof-card\.tsx/);
  assert.match(doc, /src\/components\/clariobase-ui\/sheet\.tsx/);
  assert.match(doc, /Project-owned primitives created/);
  assert.match(doc, /button, field, surface, proof-card, and sheet components/);
  assert.match(doc, /The exact `\/leads` route now renders inside the shared `AppShell`/);
});

test("source-derived boundaries are documented and project-owned primitives are not copied", () => {
  const doc = read("docs/design/clariobase-ui-v1.md");
  const notice = read("THIRD_PARTY_NOTICES.md");

  assert.match(doc, /Source Boundary Inventory/);
  assert.match(doc, /Project-Owned Primitive Inventory/);
  assert.match(doc, /Badge/);
  assert.match(doc, /TableSurface/);
  assert.match(doc, /Rejected Dependencies/);
  assert.match(notice, /Repository: `https:\/\/github\.com\/Qualiora\/shadboard`/);
  assert.match(notice, /Pinned commit: `ece0dab7282175002f5103afbac6f86306169a4e`/);
  assert.match(notice, /starter-kit\/src\/components\/ui\/button\.tsx/);
  assert.match(notice, /starter-kit\/src\/components\/ui\/input\.tsx/);
  assert.match(notice, /starter-kit\/src\/components\/ui\/card\.tsx/);
  assert.match(notice, /starter-kit\/src\/components\/ui\/sheet\.tsx/);
  assert.match(notice, /Copyright \(c\) 2025 Qualiora/);
  assert.match(doc, /no upstream source code was copied for these/);
});

test("route files do not import from uncontrolled starter-kit or prohibited dependencies", () => {
  const routeFiles = [
    "src/app/page.tsx",
    "src/app/leads/page.tsx",
    "src/app/duplicates/page.tsx",
    "src/app/imports/page.tsx",
    "src/app/reports/sales/page.tsx",
    "src/app/work/page.tsx"
  ];

  for (const file of routeFiles) {
    const content = read(file);
    assert.doesNotMatch(content, /starter-kit\//);
    assert.doesNotMatch(content, /shadboard\/starter-kit/);
    assert.doesNotMatch(content, /@radix-ui\/react-/);
    assert.doesNotMatch(content, /class-variance-authority/);
    assert.doesNotMatch(content, /lucide-react/);
  }
});
