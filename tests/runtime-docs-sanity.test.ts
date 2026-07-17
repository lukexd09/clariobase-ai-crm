import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("container runtime docs stay canonical and discoverable", () => {
  const readme = read("README.md");
  const runtimeContract = read("docs/runtime/container-runtime.md");
  const previewContract = read("docs/architecture/preview-environment.md");
  const previewAdr = read("docs/decisions/adr-e016-manual-preview.md");
  const previewRunbook = read("docs/operations/preview-operations.md");
  const runnerRunbook = read("docs/operations/windows-self-hosted-runner.md");
  const assuranceReport = read("docs/verification/e016-integrated-assurance.md");
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
  assert.match(readme, /docs\/architecture\/preview-environment\.md/);
  assert.match(readme, /docs\/decisions\/adr-e016-manual-preview\.md/);
  assert.match(readme, /docs\/operations\/preview-operations\.md/);
  assert.match(readme, /docs\/operations\/windows-self-hosted-runner\.md/);
  assert.match(readme, /docs\/verification\/e016-integrated-assurance\.md/);
  assert.match(readme, /\.env\.compose\.preview\.example/);
  assert.match(workItemCoding, /E014 - Add containerized local production runtime foundation/);
  assert.match(workItemCoding, /E016 - Add manual branch preview environment and CI foundation/);

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

  assert.match(previewContract, /document_id: DOC-E016-PREVIEW-ENVIRONMENT/);
  assert.match(previewContract, /clariobase-crm-preview/);
  assert.match(previewContract, /https:\/\/clariobase-crm-preview\.home\.arpa:3001/);
  assert.match(previewContract, /clariobase_crm_preview/);
  assert.match(previewContract, /trusted repository ref/i);
  assert.match(previewContract, /must never reuse production `?\.env\.compose\.local`?/i);
  assert.match(previewContract, /docker system prune/);
  assert.match(previewContract, /workflow_dispatch/);
  assert.match(previewContract, /post-merge manual gate/i);

  assert.match(previewAdr, /document_id: ADR-E016-MANUAL-PREVIEW/);
  assert.match(previewAdr, /one manually controlled preview slot/i);
  assert.match(previewAdr, /trusted same-repository refs only/i);
  assert.match(previewAdr, /fail-closed cleanup/i);

  assert.match(previewRunbook, /document_id: DOC-E016-PREVIEW-OPERATIONS/);
  assert.match(previewRunbook, /scripts\/deploy-preview\.ps1/);
  assert.match(previewRunbook, /scripts\/stop-preview\.ps1/);
  assert.match(previewRunbook, /\.env\.compose\.preview\.example/);
  assert.match(previewRunbook, /clariobase-crm-preview-postgres-data/);
  assert.match(previewRunbook, /clariobase-crm-preview-network/);
  assert.match(previewRunbook, /migrate deploy/);
  assert.match(previewRunbook, /docker system prune/);

  assert.match(runnerRunbook, /document_id: DOC-E016-WINDOWS-RUNNER/);
  assert.match(runnerRunbook, /clariobase-preview/);
  assert.match(runnerRunbook, /scripts\/runner-preflight\.ps1/);
  assert.match(runnerRunbook, /short-lived repository-scoped registration token/i);
  assert.match(runnerRunbook, /Automatic with delayed startup behavior/i);

  assert.match(assuranceReport, /document_id: DOC-E016-INTEGRATED-ASSURANCE/);
  assert.match(assuranceReport, /Result: `PASS`/);
  assert.match(assuranceReport, /The final preview contract test set passed with no failures after the Windows workflow correction/i);
  assert.match(assuranceReport, /Automated verification summary/i);
  assert.match(assuranceReport, /Workflow and trust-boundary audit/i);
  assert.match(assuranceReport, /Preview isolation and replacement audit/i);
  assert.match(assuranceReport, /Windows self-hosted runner audit/i);
  assert.match(assuranceReport, /Cleanup and production protection audit/i);
  assert.match(assuranceReport, /Acceptance-criteria evidence matrix/i);
  assert.match(assuranceReport, /Residual risks/i);

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

test("E011 security and recovery docs keep the operated scope explicit and RAG-ready", () => {
  const authSecurity = read("docs/security/better-auth-authentication.md");
  const authDependency = read("docs/operations/auth-dependency-recovery.md");
  const privateHttps = read("docs/operations/private-https-auth-recovery.md");
  const authAdr = read("docs/decisions/adr-e011-better-auth.md");
  const audit = read("docs/verification/e011-epic-quality-audit.md");
  const historicalProof = read("docs/verification/e011-t008-better-auth-proof.md");
  const notices = read("THIRD_PARTY_NOTICES.md");

  assert.match(authSecurity, /document_id: DOC-E011-BETTER-AUTH-SECURITY/);
  assert.match(authDependency, /document_id: DOC-E011-AUTH-DEPENDENCY-PROVENANCE/);
  assert.match(privateHttps, /document_id: DOC-E011-PRIVATE-HTTPS-AUTH-RECOVERY/);
  assert.match(authAdr, /document_id: ADR-E011-BETTER-AUTH/);
  assert.match(audit, /document_id: DOC-E011-EPIC-QUALITY-AUDIT/);
  assert.match(historicalProof, /document_id: DOC-E011-T008-BETTER-AUTH-PROOF/);
  assert.match(historicalProof, /status: historical/);
  assert.match(historicalProof, /not an operated ClarioBase capability/i);
  for (const document of [authSecurity, authDependency, privateHttps, authAdr, audit]) {
    assert.match(document, /not an operated ClarioBase capability/i);
    assert.match(document, /#200|issue `#200`/i);
  }
  assert.doesNotMatch(privateHttps, /^## Offline recovery order$/m);
  assert.doesNotMatch(privateHttps, /Full disposable security\/restart\/rollback proof with offline recovery/);
  assert.match(audit, /Acceptance-criteria evidence matrix/);
  assert.match(notices, /`better-auth` `1\.6\.23`[\s\S]*license: MIT/);
  assert.match(notices, /`@better-auth\/prisma-adapter` `1\.6\.23`[\s\S]*license: MIT/);
});

test("E011 audit keeps external delivery evidence out of tracked matrix", () => {
  const audit = read("docs/verification/e011-epic-quality-audit.md");

  assert.match(audit, /document_id: DOC-E011-EPIC-QUALITY-AUDIT/);
  assert.match(audit, /PR `#201`/);
  assert.doesNotMatch(audit, /\| PENDING \|/);
  assert.doesNotMatch(audit, /independent review is "not yet run"/i);
  assert.doesNotMatch(audit, /exact-head workflows are "not yet created"/i);
  assert.doesNotMatch(audit, /still remain to be performed/i);
  assert.doesNotMatch(audit, /remain mandatory before T014 completion/i);
  assert.doesNotMatch(audit, /workflow run ids?/i);
});
