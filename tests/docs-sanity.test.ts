import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("README documents the current post-UI CRM state and scripts", () => {
  const readme = read("README.md");
  const packageJson = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };

  assert.match(readme, /Post-UI implementation, workflow stabilization, and light CRM visual foundation phase\./);
  assert.match(readme, /lead detail operator workspace/);
  assert.match(readme, /Open `\/work`/);
  assert.match(readme, /Open `\/reports\/sales`/);
  assert.match(readme, /Open a lead in `\/leads\/\[id\]`/);
  assert.match(readme, /corepack pnpm ai:validate-import-file/);

  for (const scriptName of [
    "dev",
    "build",
    "start",
    "lint",
    "test",
    "docker:test-image",
    "docker:test-runtime",
    "docker:test-backup-restore",
    "cleanup:test-runtime",
    "prisma:generate",
    "prisma:validate",
    "prisma:migrate",
    "prisma:seed",
    "leads:import",
    "leads:detect-duplicates",
    "ai:export-leads",
    "ai:validate-import-file"
  ]) {
    assert.ok(packageJson.scripts[scriptName], `missing script ${scriptName}`);
  }
});

test("roadmap distinguishes implemented current state from future work", () => {
  const roadmap = read("docs/06-roadmap.md");

  assert.match(roadmap, /Implemented current state:/);
  assert.match(roadmap, /lead detail operator workspace/);
  assert.match(roadmap, /daily sales workbench/);
  assert.match(roadmap, /Future follow-up:/);
  assert.match(roadmap, /AI preview \/ approval UI/);
});

test("Stitch operator workspace reference stays reference-only", () => {
  const stitchReadme = read("docs/design/stitch/operator-workspace/README.md");

  assert.match(stitchReadme, /reference material, not a runtime dependency/);
  assert.match(stitchReadme, /Do not import the exported HTML directly into the app/);
});

test("light CRM visual direction covers shell navigation guidance", () => {
  const doc = read("docs/design/light-crm-visual-direction.md");

  assert.match(doc, /semantic navigation/);
  assert.match(doc, /Main navigation/);
  assert.match(doc, /focus-visible/);
  assert.match(doc, /business work entries above system entries/i);
  assert.match(doc, /color scheme/i);
  assert.match(doc, /minimum important text size/i);
  assert.match(doc, /manual keyboard and contrast checks/i);
  assert.match(doc, /active navigation state is visible without color alone/i);
});

test("container runtime docs stay canonical and discoverable", () => {
  const readme = read("README.md");
  const runtimeContract = read("docs/runtime/container-runtime.md");
  const operationsRunbook = read("docs/operations/container-operations.md");
  const orchestrationDoc = read("docs/architecture/container-orchestration.md");
  const auditReport = read("docs/verification/e014-epic-quality-audit.md");
  const adr = read("docs/decisions/adr-e014-container-runtime.md");
  const workItemCoding = read("docs/12-work-item-coding.md");

  assert.match(readme, /docs\/runtime\/container-runtime\.md/);
  assert.match(readme, /docs\/decisions\/adr-e014-container-runtime\.md/);
  assert.match(readme, /docs\/operations\/container-operations\.md/);
  assert.match(readme, /docs\/architecture\/container-orchestration\.md/);
  assert.match(readme, /docs\/verification\/e014-epic-quality-audit\.md/);
  assert.match(workItemCoding, /E014 - Add containerized local production runtime foundation/);

  assert.match(runtimeContract, /document_id: DOC-E014-CONTAINER-RUNTIME/);
  assert.match(runtimeContract, /COMP-CRM-APP/);
  assert.match(runtimeContract, /COMP-CRM-POSTGRES/);
  assert.match(runtimeContract, /exactly two services/i);
  assert.match(runtimeContract, /crm-app/);
  assert.match(runtimeContract, /crm-postgres/);
  assert.match(runtimeContract, /PostgreSQL 16/);
  assert.match(runtimeContract, /CRM_BIND_ADDRESS/);
  assert.match(runtimeContract, /CRM_HOST_PORT/);
  assert.match(runtimeContract, /AI_EXCHANGE_HOST_PATH/);
  assert.match(runtimeContract, /must never connect to or mutate the harvester or gatherer database/i);
  assert.match(runtimeContract, /must be mounted at runtime instead of baked into the image/i);
  assert.match(runtimeContract, /returns HTTP `200` when the Next\.js process can respond/);
  assert.match(runtimeContract, /fresh timestamp on each request/i);
  assert.match(runtimeContract, /must not be statically cached/i);
  assert.match(runtimeContract, /\/api\/ready/);
  assert.match(runtimeContract, /returns HTTP `200` only when the CRM application can execute a lightweight query/i);
  assert.match(runtimeContract, /returns HTTP `503` when the configured CRM database is unavailable/i);
  assert.match(runtimeContract, /corepack pnpm docker:test-backup-restore/);
  assert.match(runtimeContract, /corepack pnpm cleanup:test-runtime/);
  assert.match(runtimeContract, /Current repository baseline before E014 implementation/);
  assert.match(runtimeContract, /Approved first-run migration sequence/);
  assert.match(runtimeContract, /one-off operator-invoked `prisma migrate deploy` step/i);
  assert.match(runtimeContract, /normal `crm-app` container startup must not rerun migrations automatically/i);
  assert.match(runtimeContract, /Planned evolution after the default E014 runtime/);
  assert.match(runtimeContract, /\.codex-tmp/);

  assert.match(adr, /document_id: ADR-E014-CONTAINER-RUNTIME/);
  assert.match(adr, /crm-app/);
  assert.match(adr, /crm-postgres/);
  assert.match(adr, /localhost-only host binding by default/);

  assert.match(operationsRunbook, /document_id: DOC-E014-CONTAINER-OPERATIONS/);
  assert.match(operationsRunbook, /canonical operator runbook/i);
  assert.match(operationsRunbook, /docker compose --env-file \.env\.compose\.local up -d crm-postgres/);
  assert.match(operationsRunbook, /node \.\/node_modules\/prisma\/build\/index\.js migrate deploy/);
  assert.match(operationsRunbook, /corepack pnpm docker:test-runtime/);
  assert.match(operationsRunbook, /corepack pnpm docker:test-backup-restore/);
  assert.match(operationsRunbook, /corepack pnpm cleanup:test-runtime/);
  assert.match(operationsRunbook, /CRM_DATABASE_URL/);
  assert.match(operationsRunbook, /crm-postgres-data/);
  assert.match(operationsRunbook, /backup/i);
  assert.match(operationsRunbook, /restore/i);
  assert.match(operationsRunbook, /CRM_BIND_ADDRESS=0\.0\.0\.0/);
  assert.match(operationsRunbook, /clariobase-crm/);
  assert.match(operationsRunbook, /must never target/i);

  assert.match(orchestrationDoc, /document_id: DOC-E014-CONTAINER-ORCHESTRATION/);
  assert.match(orchestrationDoc, /future server-level orchestration direction/i);
  assert.match(orchestrationDoc, /CRM-only runtime/i);
  assert.match(orchestrationDoc, /separate databases/i);
  assert.match(orchestrationDoc, /no shared schema/i);
  assert.match(orchestrationDoc, /CRM_DATABASE_URL/);
  assert.match(orchestrationDoc, /does not orchestrate the gatherer or harvester runtime/i);

  assert.match(auditReport, /document_id: DOC-E014-EPIC-QUALITY-AUDIT/);
  assert.match(auditReport, /Result: `PASS`/);
  assert.match(auditReport, /Automated test audit/i);
  assert.match(auditReport, /Documentation accuracy audit/i);
  assert.match(auditReport, /RAG readiness audit/i);
  assert.match(auditReport, /Acceptance-criteria coverage matrix/i);
  assert.match(auditReport, /Residual risk assessment/i);
  assert.match(auditReport, /corepack pnpm docker:test-image/);
  assert.match(auditReport, /corepack pnpm docker:test-runtime/);
  assert.match(auditReport, /corepack pnpm docker:test-backup-restore/);
  assert.match(auditReport, /\| Final whole-epic review passes \| PASS \|/);
  assert.match(auditReport, /\| One final Draft PR exists from `epic\/e014-containerized-runtime` to `main` \| PASS \|/);
  assert.match(auditReport, /Draft PR \[#67\]/);
  assert.match(auditReport, /Codex does not merge the final PR or close issues/i);
  assert.match(auditReport, /epic plus child issues remain open by contract/i);
  assert.doesNotMatch(auditReport, /final whole-epic review remains the next required gate/i);
  assert.doesNotMatch(auditReport, /draft PR creation is a later epic step/i);
});
