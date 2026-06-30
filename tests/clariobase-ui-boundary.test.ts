import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("project-owned ui boundary exists and excludes starter-kit imports", () => {
  const componentFiles = [
    "src/components/clariobase-ui/button.tsx",
    "src/components/clariobase-ui/surface.tsx",
    "src/components/clariobase-ui/status.tsx",
    "src/components/clariobase-ui/field.tsx",
    "src/components/clariobase-ui/table.tsx",
    "src/components/clariobase-ui/feedback.tsx",
    "src/components/clariobase-ui/proof-card.tsx",
    "src/components/clariobase-ui/sheet.tsx"
  ];

  for (const file of componentFiles) {
    assert.doesNotThrow(() => read(file));
  }

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

test("package inventory stays aligned with the dependency gate", () => {
  const packageJson = JSON.parse(read("package.json")) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  assert.deepEqual(Object.keys(packageJson.dependencies).sort(), [
    "@prisma/adapter-pg",
    "@prisma/client",
    "@radix-ui/react-dialog",
    "lucide-react",
    "next",
    "react",
    "react-dom",
    "zod"
  ]);
  assert.deepEqual(Object.keys(packageJson.devDependencies).sort(), [
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "autoprefixer",
    "eslint",
    "eslint-config-next",
    "postcss",
    "prisma",
    "tailwindcss",
    "tsx",
    "typescript"
  ]);
});

test("table surface uses a scrollable region contract and legacy theme remains intact", () => {
  const table = read("src/components/clariobase-ui/table.tsx");
  const globalsCss = read("src/app/globals.css");

  assert.match(table, /overflow-x-auto/);
  assert.match(table, /role=\{role\}/);
  assert.match(table, /tabIndex=\{tabIndex\}/);
  assert.match(table, /aria-label=\{ariaLabel\}/);
  assert.match(table, /data-slot="table-surface"/);
  assert.doesNotMatch(table, /overflow-hidden/);
  assert.match(globalsCss, /--clariobase-primary:\s*#006194;/);
  assert.match(globalsCss, /--clariobase-background:\s*#f8fafc;/);
  assert.match(globalsCss, /--clariobase-surface:\s*#ffffff;/);
  assert.doesNotMatch(globalsCss, /radial-gradient/);
  assert.doesNotMatch(globalsCss, /linear-gradient/);
});
