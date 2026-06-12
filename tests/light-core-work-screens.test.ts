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
  const statusPill = read("src/components/lead-status-pill.tsx");

  assert.match(statusPill, /const lightVariants: Record<string, string> = \{/);
  assert.match(statusPill, /appearance === "light" \? lightVariants\[value\] \?\? lightVariants\.UNKNOWN : variants\[value\]/);
  assert.match(statusPill, /UNKNOWN: "bg-white text-slate-700 border-slate-200 shadow-sm"/);
  assert.match(statusPill, /NEW: "bg-sky-50 text-sky-700 border-sky-200"/);
  assert.match(statusPill, /URGENT: "bg-red-50 text-red-700 border-red-200"/);
  assert.match(statusPill, /CLARITY: "bg-cyan-50 text-cyan-700 border-cyan-200"/);
  assert.match(statusPill, /MOMENTUM: "bg-emerald-50 text-emerald-700 border-emerald-200"/);
  assert.match(statusPill, /NOT_FIT: "bg-rose-50 text-rose-700 border-rose-200"/);
});
