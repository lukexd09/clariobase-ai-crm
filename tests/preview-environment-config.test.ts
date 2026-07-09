import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("compose and env docs declare the deployment environment contract", () => {
  const compose = read("compose.yaml");
  const previewCompose = read("compose.preview.yaml");
  const envExample = read(".env.compose.example");
  const previewEnvExample = read(".env.compose.preview.example");
  const previewEnvironmentDoc = read("docs/architecture/preview-environment.md");
  const previewOperationsDoc = read("docs/operations/preview-operations.md");

  assert.match(compose, /CRM_DEPLOYMENT_ENV:\s*production/);
  assert.match(previewCompose, /CRM_DEPLOYMENT_ENV:\s*preview/);
  assert.match(envExample, /^CRM_DEPLOYMENT_ENV=production$/m);
  assert.match(previewEnvExample, /^CRM_DEPLOYMENT_ENV=preview$/m);
  assert.match(previewEnvironmentDoc, /CRM_DEPLOYMENT_ENV/);
  assert.match(previewEnvironmentDoc, /NEXT_PUBLIC_/);
  assert.match(previewOperationsDoc, /CRM_DEPLOYMENT_ENV/);
  assert.match(previewOperationsDoc, /NEXT_PUBLIC_/);
});

test("no public deployment env variable is introduced", () => {
  const files = [
    read("compose.yaml"),
    read("compose.preview.yaml"),
    read(".env.compose.example"),
    read(".env.compose.preview.example"),
    read("docs/architecture/preview-environment.md"),
    read("docs/operations/preview-operations.md")
  ];

  for (const contents of files) {
    assert.doesNotMatch(contents, /NEXT_PUBLIC_CRM_DEPLOYMENT_ENV/);
  }
});
