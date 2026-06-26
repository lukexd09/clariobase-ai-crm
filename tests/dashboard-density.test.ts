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
  assert.match(page, /max-\[359px\]:grid-cols-1/);
  assert.match(page, /min-\[360px\]:grid-cols-2/);
  assert.match(page, /min-\[760px\]:grid-cols-2/);
  assert.match(page, /xl:grid-cols-4/);
  assert.match(page, /max-\[359px\]:rounded-xl/);
  assert.match(page, /min-\[360px\]:rounded-xl/);
  assert.match(page, /max-\[359px\]:divide-y/);
  assert.match(page, /min-\[360px\]:divide-y/);
  assert.match(page, /max-\[759px\]:text-\[1\.1rem\]/);
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
  assert.match(primitives, /max-\[359px\]:min-h-\[50px\]/);
  assert.match(primitives, /min-\[360px\]:min-h-\[70px\]/);
  assert.match(primitives, /min-\[760px\]:text-base/);
  assert.match(primitives, /min-\[1100px\]:text-\[2rem\]/);
  assert.match(primitives, /min-\[360px\]:text-\[1\.25rem\]/);
  assert.doesNotMatch(primitives, /4 active tasks/);
  assert.doesNotMatch(primitives, /Current/);
  assert.doesNotMatch(primitives, /border-t border-\[#E2E8F0\]/);
  assert.doesNotMatch(primitives, /sr-only/);
});
