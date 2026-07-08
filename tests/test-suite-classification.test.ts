import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function extractTestFiles(command: string) {
  return [...command.matchAll(/tests\/[A-Za-z0-9._/-]+\.test\.(?:tsx|ts)/g)].map((match) => match[0]);
}

test("every test file belongs to exactly one fast or infrastructure suite", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  const testDirectory = path.join(repoRoot, "tests");
  const repositoryTests = fs
    .readdirSync(testDirectory)
    .filter((name) => name.endsWith(".test.ts") || name.endsWith(".test.tsx"))
    .map((name) => `tests/${name}`)
    .sort();

  const fastTests = extractTestFiles(packageJson.scripts["test:fast"] ?? "");
  const infraTests = extractTestFiles(packageJson.scripts["test:infra"] ?? "");
  const classified = [...fastTests, ...infraTests].sort();
  const duplicates = classified.filter((name, index) => classified.indexOf(name) !== index);

  assert.equal(packageJson.scripts["test:full"], "pnpm test:fast && pnpm test:infra");
  assert.deepEqual(duplicates, [], `test files classified more than once: ${duplicates.join(", ")}`);
  assert.deepEqual(classified, repositoryTests);

  assert.ok(fastTests.includes("tests/product-docs-sanity.test.ts"));
  assert.ok(fastTests.includes("tests/health-contract.test.ts"));
  assert.ok(fastTests.includes("tests/runtime-readiness.test.ts"));
  assert.ok(fastTests.includes("tests/dashboard-density.test.ts"));
  assert.ok(fastTests.includes("tests/shadboard-proof.test.ts"));
  assert.ok(fastTests.includes("tests/clariobase-ui-boundary.test.ts"));
  assert.ok(fastTests.includes("tests/clariobase-ui-render.test.ts"));
  assert.ok(infraTests.includes("tests/docs-sanity.test.ts"));
  assert.ok(infraTests.includes("tests/runtime-docs-sanity.test.ts"));
  assert.ok(infraTests.includes("tests/health-endpoint.test.ts"));
  assert.ok(infraTests.includes("tests/docker-image.test.ts"));
  assert.ok(infraTests.includes("tests/compose-runtime.test.ts"));
  assert.ok(infraTests.includes("tests/preview-runtime.test.ts"));
  assert.ok(infraTests.includes("tests/github-actions-preview.test.ts"));
  assert.ok(infraTests.includes("tests/compose-backup-restore.test.ts"));
  assert.ok(infraTests.includes("tests/light-density-route-contracts.test.ts"));
});
