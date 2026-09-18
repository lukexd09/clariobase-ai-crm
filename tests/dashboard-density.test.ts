import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const read = (filePath: string) => fs.readFileSync(path.join(repoRoot, filePath), "utf8");

test("dashboard density contracts render server-driven metrics and priorities", () => {
  const page = read("src/components/dashboard-page.tsx");
  const data = read("src/lib/dashboard.ts");
  const primitives = read("src/components/dashboard-primitives.tsx");

  assert.match(page, /data\.metrics\.map/);
  assert.match(page, /data\.priorities\.map/);
  assert.match(page, /data\.priorities\.length > 0/);
  assert.match(page, /t\("dashboard\.prioritiesEmpty"\)/);
  assert.match(page, /DashboardDataQualityAlert count=\{data\.activeDuplicateCount\}/);
  assert.match(page, /PipelineSnapshot items=\{data\.pipeline\.map/);
  assert.doesNotMatch(page, /formatNumber\((2|4|11|6)\)|2026-06-21/);
  assert.doesNotMatch(page, /Lumina|Aurora|Sienna|Velvet/);

  assert.match(data, /getWorkBuckets\(leads, now\)/);
  assert.match(data, /getPresentationDayBounds\(now\)/);
  assert.match(data, /flatMap\(\(bucket\) => bucket\.leads\)/);
  assert.match(data, /slice\(0, 4\)/);
  assert.match(data, /SALES_STATUS_METADATA\[lead\.leadStatus\]\.nextActionKey/);
  assert.match(data, /href: `\/leads\/\$\{lead\.id\}`/);

  assert.match(primitives, /if \(count === 0\) return null/);
  assert.match(primitives, /formatNumber\(count\)/);
  assert.match(primitives, /maximumValue === 0 \? "0%"/);
  assert.match(primitives, /ButtonLink/);
  assert.match(primitives, /focus-visible:ring-\[color:var\(--cb-focus-ring\)\]/);
});
