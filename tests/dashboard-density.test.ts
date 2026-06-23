import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("dashboard density contracts keep business values and link-based priorities", () => {
  const page = read("src/app/page.tsx");
  const primitives = read("src/components/dashboard-primitives.tsx");

  assert.match(page, /<MetricCard label="Overdue" value="2" \/>/);
  assert.match(page, /<MetricCard label="Due today" value="4" \/>/);
  assert.match(page, /<MetricCard label="Upcoming" value="11" \/>/);
  assert.match(page, /<MetricCard label="No next action" value="6" \/>/);
  assert.match(page, /Today&apos;s priorities/);
  assert.match(page, /PipelineSnapshot items=\{pipeline\}/);
  assert.match(page, /Alert/);
  assert.match(page, /body="3 possible duplicates need review"/);

  assert.match(primitives, /href/);
  assert.match(primitives, /company/);
  assert.match(primitives, /Open →/);
  assert.match(primitives, /Deadline:/);
  assert.match(primitives, /Pipeline snapshot/);
  assert.match(primitives, /stage: string; value: number/);
  assert.match(primitives, /Open →/);
  assert.doesNotMatch(primitives, /4 active tasks/);
  assert.doesNotMatch(primitives, /Current/);
});
