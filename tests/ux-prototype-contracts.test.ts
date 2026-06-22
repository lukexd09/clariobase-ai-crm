import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("ux prototype routes stay isolated from Prisma and production mutations", () => {
  const files = [
    "src/app/ux-prototype/layout.tsx",
    "src/app/ux-prototype/page.tsx",
    "src/app/ux-prototype/dashboard/page.tsx",
    "src/app/ux-prototype/daily-work/page.tsx",
    "src/app/ux-prototype/leads/page.tsx",
    "src/app/ux-prototype/leads/[id]/page.tsx",
    "src/app/ux-prototype/sales-overview/page.tsx",
    "src/app/ux-prototype/import-batches/page.tsx",
    "src/app/ux-prototype/import-batches/[id]/page.tsx",
    "src/app/ux-prototype/duplicate-candidates/page.tsx",
    "src/app/ux-prototype/duplicate-candidates/[id]/page.tsx",
    "src/app/ux-prototype/system-status/page.tsx",
    "src/components/ux-prototype-shell.tsx",
    "src/lib/ux-prototype.ts"
  ];

  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /@\/lib\/prisma|from "prisma"|from '@\/lib\/prisma'/i, `${file} should not import Prisma`);
    assert.doesNotMatch(source, /route handlers|server actions|updateLeadAction|saveMiniAuditDraftAction|saveOutreachDraftAction|saveOfferDraftAction/i, `${file} should not reuse production mutations`);
  }

  assert.match(read("src/app/ux-prototype/layout.tsx"), /robots: \{ index: false, follow: false \}/);
  assert.match(read("src/components/ux-prototype-shell.tsx"), /UX prototype — no data is saved/);
  assert.match(read("src/components/ux-prototype-shell.tsx"), /Manual keyboard, zoom and screen-reader checks remain pending\./);
  assert.match(read("src/components/ux-prototype-shell.tsx"), /aria-label="Prototype sections"/);
  assert.match(read("src/components/ux-prototype-shell.tsx"), /aria-current=\{active \? "page" : undefined\}/);
  assert.doesNotMatch(fs.readFileSync(path.join(repoRoot, "src/app/ux-prototype/leads/[id]/page.tsx"), "utf8"), /href="#"|href="\#"/);
  assert.match(read("src/app/ux-prototype/system-status/page.tsx"), /Refresh/);
  assert.match(read("src/lib/ux-prototype.ts"), /lead-aurora-bikes/);
  assert.match(read("src/lib/ux-prototype.ts"), /lead-sienna-clinic/);
  assert.match(read("src/lib/ux-prototype.ts"), /lead-amber-hair/);
  assert.match(read("src/lib/ux-prototype.ts"), /lead-long-name/);
  assert.match(read("src/app/ux-prototype/leads/page.tsx"), /<input/);
  assert.match(read("src/app/ux-prototype/leads/page.tsx"), /<select/);
  assert.match(read("src/app/ux-prototype/leads/page.tsx"), /button type="button"/);
});

test("prototype route map covers all required review screens", () => {
  const source = read("src/lib/ux-prototype.ts");
  for (const route of [
    "/ux-prototype",
    "/ux-prototype/dashboard",
    "/ux-prototype/daily-work",
    "/ux-prototype/leads",
    "/ux-prototype/leads/lead-aurora-bikes",
    "/ux-prototype/sales-overview",
    "/ux-prototype/import-batches",
    "/ux-prototype/import-batches/batch-2026-06-21",
    "/ux-prototype/duplicate-candidates",
    "/ux-prototype/duplicate-candidates/dup-aurora-bikes",
    "/ux-prototype/system-status"
  ]) {
    assert.match(source, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
