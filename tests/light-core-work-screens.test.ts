import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("core CRM work screens use the light shell baseline", () => {
  const workPage = read("src/app/work/page.tsx");
  const leadsPage = read("src/app/leads/page.tsx");
  const salesReportPage = read("src/app/reports/sales/page.tsx");

  for (const source of [workPage, leadsPage, salesReportPage]) {
    assert.match(source, /bg-slate-50/);
    assert.doesNotMatch(source, /bg-slate-950/);
  }
});

test("core CRM work screens opt into the light status pill treatment", () => {
  const workPage = read("src/app/work/page.tsx");
  const leadsTable = read("src/components/lead-table.tsx");
  const salesReportPage = read("src/app/reports/sales/page.tsx");

  assert.match(workPage, /appearance="light"/);
  assert.match(leadsTable, /appearance="light"/);
  assert.match(salesReportPage, /appearance="light"/);
});
