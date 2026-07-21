import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("dashboard density contracts keep business values and link-based priorities", () => {
  const page = read("src/components/dashboard-page.tsx");
  const primitives = read("src/components/dashboard-primitives.tsx");

  assert.match(page, /<MetricCard label=\{t\("dashboard\.metric\.overdue"\)\} value=\{formatNumber\(2\)\} tone="danger" \/>/);
  assert.match(page, /<MetricCard label=\{t\("dashboard\.metric\.dueToday"\)\} value=\{formatNumber\(4\)\} tone="warning" \/>/);
  assert.match(page, /<MetricCard label=\{t\("dashboard\.metric\.upcoming"\)\} value=\{formatNumber\(11\)\} tone="information" \/>/);
  assert.match(page, /<MetricCard label=\{t\("dashboard\.metric\.idle"\)\} value=\{formatNumber\(6\)\} tone="neutral" \/>/);
  assert.match(page, /sm:grid-cols-2/);
  assert.match(page, /xl:grid-cols-4/);
  assert.match(page, /xl:grid-cols-\[minmax\(0,1\.7fr\)_minmax\(280px,1fr\)\]/);
  assert.match(page, /list-none divide-y divide-\[color:var\(--cb-border\)\]/);
  assert.match(page, /py-4 first:pt-0 last:pb-0/);
  assert.match(page, /DashboardDataQualityAlert/);
  assert.match(page, /t\("dashboard\.todayPriorities"\)/);
  assert.match(page, /PipelineSnapshot items=\{pipeline\.map/);
  assert.doesNotMatch(page, /Operational snapshot/);

  assert.match(primitives, /ButtonLink/);
  assert.match(primitives, /Badge/);
  assert.match(primitives, /t\("dashboard\.open"\)/);
  assert.match(primitives, /t\("dashboard\.deadline"\)/);
  assert.match(primitives, /t\("dashboard\.pipeline"\)/);
  assert.match(primitives, /stage: string; value: number/);
  assert.match(primitives, /<dt className="text-xs font-semibold uppercase tracking-\[0\.16em\] text-\[color:var\(--cb-muted-foreground\)\]">/);
  assert.match(primitives, /<dd className="font-semibold tabular-nums text-\[color:var\(--cb-foreground\)\]">/);
  assert.match(primitives, /tabular-nums/);
  assert.match(primitives, /focus-visible:ring-\[color:var\(--cb-focus-ring\)\]/);
  assert.match(primitives, /aria-hidden="true"/);
  assert.doesNotMatch(primitives, /first:pt-0|last:pb-0/);
  assert.doesNotMatch(primitives, /4 active tasks/);
  assert.doesNotMatch(primitives, /Current tasks/);
  assert.doesNotMatch(primitives, /border-t border-\[#E2E8F0\]/);
  assert.doesNotMatch(primitives, /sr-only/);
});
