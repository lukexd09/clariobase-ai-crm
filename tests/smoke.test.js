const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");

function runValidator(inputPath) {
  const scriptPath = path.join(repoRoot, "scripts", "validate-ai-import-file.ts");
  const cliPath = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

  return spawnSync(process.execPath, [cliPath, scriptPath, inputPath], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

test("sample prepared AI file validates", () => {
  const result = runValidator(path.join(repoRoot, "data", "ai-exchange", "inbox", "sample-prepared-leads.json"));

  assert.equal(result.status, 0, result.stderr);
  assert.match(`${result.stdout}\n${result.stderr}`, /total rows: 2/);
  assert.match(`${result.stdout}\n${result.stderr}`, /valid rows: 2/);
  assert.match(`${result.stdout}\n${result.stderr}`, /invalid rows: 0/);
});

test("invalid AI import file fails with row-level errors", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clariobase-ai-"));
  const invalidFile = path.join(tmpDir, "invalid.json");
  fs.writeFileSync(
    invalidFile,
    JSON.stringify(
      [
        {
          businessName: "Broken Row",
          source: "manual",
          sourceRecordId: "invalid-1",
          websiteUrl: "not-a-url"
        }
      ],
      null,
      2
    ),
    "utf8"
  );

  const result = runValidator(invalidFile);

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /invalid rows: 1/);
  assert.match(`${result.stdout}\n${result.stderr}`, /websiteUrl: Invalid URL/);
});

test(".gitignore protects AI exchange runtime exports", () => {
  const gitignore = fs.readFileSync(path.join(repoRoot, ".gitignore"), "utf8");

  assert.match(gitignore, /data\/ai-exchange\/outbox\/\*\.json/);
  assert.match(gitignore, /data\/ai-exchange\/outbox\/\*\.md/);
  assert.match(gitignore, /!data\/ai-exchange\/\*\*\/\.gitkeep/);
  assert.match(gitignore, /!data\/ai-exchange\/inbox\/sample-prepared-leads\.json/);
});
