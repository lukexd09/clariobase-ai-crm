import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("README documents the current post-UI CRM state and scripts", () => {
  const readme = read("README.md");
  const packageJson = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };

  assert.match(readme, /Post-UI implementation, workflow stabilization, and light CRM visual foundation phase\./);
  assert.match(readme, /lead detail operator workspace/);
  assert.match(readme, /Open `\/work`/);
  assert.match(readme, /Open `\/reports\/sales`/);
  assert.match(readme, /Open a lead in `\/leads\/\[id\]`/);
  assert.match(readme, /corepack pnpm ai:validate-import-file/);

  for (const scriptName of [
    "dev",
    "build",
    "start",
    "lint",
    "test",
    "prisma:generate",
    "prisma:validate",
    "prisma:migrate",
    "prisma:seed",
    "leads:import",
    "leads:detect-duplicates",
    "ai:export-leads",
    "ai:validate-import-file"
  ]) {
    assert.ok(packageJson.scripts[scriptName], `missing script ${scriptName}`);
  }
});

test("roadmap distinguishes implemented current state from future work", () => {
  const roadmap = read("docs/06-roadmap.md");

  assert.match(roadmap, /Implemented current state:/);
  assert.match(roadmap, /lead detail operator workspace/);
  assert.match(roadmap, /daily sales workbench/);
  assert.match(roadmap, /Future follow-up:/);
  assert.match(roadmap, /AI preview \/ approval UI/);
});

test("Stitch operator workspace reference stays reference-only", () => {
  const stitchReadme = read("docs/design/stitch/operator-workspace/README.md");

  assert.match(stitchReadme, /reference material, not a runtime dependency/);
  assert.match(stitchReadme, /Do not import the exported HTML directly into the app/);
});

test("light CRM visual direction covers shell navigation guidance", () => {
  const doc = read("docs/design/light-crm-visual-direction.md");

  assert.match(doc, /semantic navigation/);
  assert.match(doc, /Main navigation/);
  assert.match(doc, /focus-visible/);
  assert.match(doc, /business work entries above system entries/i);
  assert.match(doc, /color scheme/i);
  assert.match(doc, /minimum important text size/i);
  assert.match(doc, /manual keyboard and contrast checks/i);
  assert.match(doc, /active navigation state is visible without color alone/i);
});
