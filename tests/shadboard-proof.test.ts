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

  assert.match(doc, /Current `main` incorporated: `77d888947276ac079650a9eec58d0a84e4690bc6`/);
  assert.match(doc, /Epic synchronization commit: `2363f540f0ef1a6d49e6eda1c0939d3d7b28eece`/);
  assert.match(doc, /Pinned release: `v1.5.1`/);
  assert.match(doc, /Pinned commit: `ece0dab7282175002f5103afbac6f86306169a4e`/);
  assert.match(doc, /`starter-kit\/src\/components\/ui\/card\.tsx` -> `src\/components\/clariobase-ui\/proof-card\.tsx`/);
  assert.match(doc, /`starter-kit\/src\/app\/layout\.tsx` -> `src\/components\/app-shell\.tsx`/);
  assert.match(doc, /`starter-kit\/src\/components\/ui\/sidebar\.tsx` -> `src\/components\/app-shell\.tsx`/);
  assert.doesNotMatch(doc, /Nonexistent placeholder paths removed from the inventory:/);
  assert.doesNotMatch(doc, /app\/leads\/page\.tsx/);
  assert.doesNotMatch(doc, /components\/navigation\.tsx/);
  assert.match(doc, /`class-variance-authority` \| `0\.7\.1`/);
  assert.match(doc, /npm metadata license: `Apache-2\.0`/);
  assert.match(doc, /`@radix-ui\/react-dialog` \| `1\.1\.3`/);
  assert.match(doc, /`@auth\/prisma-adapter` \| `2\.6\.0`/);
  assert.match(doc, /`@fullcalendar\/\*` \| `6\.1\.15`/);
  assert.match(doc, /`@hello-pangea\/dnd` \| `18\.0\.1`/);
  assert.match(doc, /THIRD_PARTY_NOTICES\.md/);
  assert.match(doc, /\.\.\/\.\.\/THIRD_PARTY_NOTICES\.md/);
});

test("proof boundary stays project-owned and avoids prohibited dependencies", () => {
  const doc = read("docs/architecture/shadboard-adoption-decision.md");
  const proofShell = read("src/components/clariobase-ui/proof-shell.tsx");
  const proofCard = read("src/components/clariobase-ui/proof-card.tsx");
  const notice = read("THIRD_PARTY_NOTICES.md");

  assert.match(doc, /`next-auth`/);
  assert.match(doc, /`prisma` \| `5\.20\.0`/);
  assert.match(doc, /`@tiptap\/react` \| `2\.11\.7`/);
  assert.match(proofShell, /data-ui-foundation="shadboard-proof"/);
  assert.match(proofShell, /aria-label="Primary navigation"/);
  assert.match(proofShell, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(proofShell, /focus-visible:ring-\[color:var\(--cb-ui-ring\)\]/);
  assert.match(proofCard, /data-slot="card"/);
  assert.match(proofCard, /ProofCardHeader/);
  assert.match(proofCard, /ProofCardTitle/);
  assert.match(proofCard, /ProofCardDescription/);
  assert.match(proofCard, /ProofCardContent/);
  assert.match(proofCard, /ProofCardFooter/);
  assert.match(notice, /Shadboard/);
  assert.match(notice, /Copyright \(c\) 2025 Qualiora/);
  assert.match(
    notice,
    /Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files \(the "Software"\), to deal in the Software without restriction/,
  );
  assert.match(
    notice,
    /The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software\./,
  );
  assert.match(
    notice,
    /THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT\./,
  );
  assert.match(notice, /Repository: `https:\/\/github\.com\/Qualiora\/shadboard`/);
  assert.match(notice, /Pinned commit: `ece0dab7282175002f5103afbac6f86306169a4e`/);
  assert.match(notice, /starter-kit\/src\/components\/ui\/card\.tsx/);
  assert.match(notice, /src\/components\/clariobase-ui\/proof-card\.tsx/);
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
  assert.doesNotMatch(page, /AppShell/);
  assert.match(filters, /buildLeadUrl/);
  assert.match(filters, /router\.replace/);
  assert.match(table, /\/leads\/\$\{lead\.id\}/);
  assert.match(pagination, /buildLeadUrl/);
  assert.match(globalsCss, /\[data-ui-foundation="shadboard-proof"\]/);
  assert.match(globalsCss, /--cb-ui-background/);
  assert.match(globalsCss, /--cb-ui-primary/);
});
