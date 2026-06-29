import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("shadboard adoption decision documents the pinned upstream ref and licensing posture", () => {
  const doc = read("docs/architecture/shadboard-adoption-decision.md");

  assert.match(doc, /ClarioBase base SHA: `578d949f0644f22a69656553260b7b2a8e29343f`/);
  assert.match(doc, /Shadboard release: `v1.5.1`/);
  assert.match(doc, /Shadboard commit: `ece0dab7282175002f5103afbac6f86306169a4e`/);
  assert.match(doc, /MIT license/i);
  assert.match(doc, /retain the copyright notice/i);
  assert.match(doc, /retain the permission notice/i);
  assert.match(doc, /treat assets separately from code/i);
});

test("proof boundary stays project-owned and avoids prohibited dependencies", () => {
  const doc = read("docs/architecture/shadboard-adoption-decision.md");
  const proofShell = read("src/components/clariobase-ui/proof-shell.tsx");
  const proofCard = read("src/components/clariobase-ui/proof-card.tsx");

  assert.match(doc, /src\/components\/clariobase-ui\//);
  assert.match(doc, /NextAuth \/ Auth\.js/);
  assert.match(doc, /@auth\/prisma-adapter/);
  assert.match(doc, /demo routes/);
  assert.match(doc, /billing/);
  assert.match(proofShell, /data-ui-foundation="shadboard-proof"/);
  assert.match(proofShell, /aria-label="Primary navigation"/);
  assert.match(proofShell, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(proofShell, /focus-visible:ring-\[color:var\(--cb-ui-ring\)\]/);
  assert.match(proofCard, /--cb-ui-radius-lg/);
});

test("leads route preserves data loading and uses the proof boundary", () => {
  const page = read("src/app/leads/page.tsx");
  const layout = read("src/app/layout.tsx");
  const appShell = read("src/components/app-shell.tsx");
  const filters = read("src/components/lead-filters.tsx");
  const table = read("src/components/lead-table.tsx");
  const pagination = read("src/components/lead-pagination.tsx");
  const globalsCss = read("src/app/globals.css");

  assert.match(page, /getLeadPage/);
  assert.match(page, /getLeadFilterOptions/);
  assert.match(page, /normalizeLeadFilters/);
  assert.match(page, /ProofShell pathname="\/leads"/);
  assert.match(page, /ProofCard/);
  assert.match(layout, /<AppShell>\{children\}<\/AppShell>/);
  assert.match(appShell, /if \(pathname === "\/leads"\)/);
  assert.match(appShell, /return <>\{children\}<\/>;/);
  assert.match(appShell, /aria-label="Primary navigation"/);
  assert.match(appShell, /pathname === "\/leads"/);
  assert.match(page, /ProofShell pathname="\/leads"/);
  assert.doesNotMatch(page, /AppShell/);

  assert.match(filters, /buildLeadUrl/);
  assert.match(filters, /router\.replace/);
  assert.match(table, /\/leads\/\$\{lead\.id\}/);
  assert.match(pagination, /buildLeadUrl/);
  assert.match(globalsCss, /\[data-ui-foundation="shadboard-proof"\]/);
  assert.match(globalsCss, /--cb-ui-background/);
  assert.match(globalsCss, /--cb-ui-primary/);
});
