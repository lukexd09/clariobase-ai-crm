---
title: E011 post-merge documentation and regression audit
document_id: DOC-E011-POST-MERGE-DOC-TEST-AUDIT
document_type: verification-report
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-20
related_epic: E011
related_issues:
  - 203
related_documents:
  - docs/decisions/adr-e011-better-auth.md
  - docs/decisions/adr-e011-private-https-runtime.md
  - docs/security/better-auth-authentication.md
  - docs/operations/auth-dependency-recovery.md
  - docs/operations/private-https-auth-recovery.md
  - docs/operations/preview-operations.md
  - docs/runtime/container-runtime.md
  - docs/verification/e011-epic-quality-audit.md
  - docs/verification/e011-t008-better-auth-proof.md
  - docs/verification/e011-t009-better-auth-core-foundation.md
  - docs/verification/e011-t011-boundary-inventory.md
  - docs/verification/e011-t012-user-admin-recovery.md
  - scripts/e011-t010-auth-session-proof.ts
  - scripts/admin-user-access-proof.ts
  - scripts/e011-t013-private-https-proof.ts
  - scripts/verify-compose-backup-restore.ts
tags:
  - verification
  - audit
  - authentication
  - authorization
  - https
  - recovery
  - rag
---

# E011 post-merge documentation and regression audit

## 1. Scope

Issue `#203` asked for a post-merge audit of active E011 documentation, regression coverage, stale references, and RAG readiness. This report is read-only on application/runtime behavior; no product capability, Prisma schema, dependency version, or migration was changed.

## 2. Baseline and delivery state

- Baseline SHA: `3efc4e0cfef533cdbb2fcb7e969f87b85ea69a21`
- Final SHA: `pending final delivery commit`
- Branch: `feature/e011-doc-test-audit`
- Worktree: `C:\Serwer\Projekty\Clariobase\worktrees\e011-doc-test-audit`
- Commit(s): `pending`
- Draft PR: `pending push`

## 3. Documentation inventory

### Canonical sources

- `docs/decisions/adr-e011-better-auth.md`
- `docs/decisions/adr-e011-private-https-runtime.md`
- `docs/security/better-auth-authentication.md`
- `docs/operations/auth-dependency-recovery.md`
- `docs/operations/private-https-auth-recovery.md`
- `docs/verification/e011-epic-quality-audit.md`
- `docs/verification/e011-t009-better-auth-core-foundation.md`
- `docs/verification/e011-t011-boundary-inventory.md`
- `docs/verification/e011-t012-user-admin-recovery.md`

### Supporting sources

- `README.md`
- `docs/runtime/container-runtime.md`
- `docs/operations/preview-operations.md`
- `docs/operations/container-operations.md`
- `docs/verification/e011-t008-better-auth-proof.md`
- `docs/verification/e011-t010-auth-session-proof.ts`

### Current inventory result

- Active docs use one clear canonical source per operating area.
- No active doc or script still references `e011:t013:proof`.
- No active doc or script still references `e011-offline`, `offline-proof`, or `tools/e011-auth-recovery` as a current capability.
- References to full offline rebuild/restore are consistently framed as historical or unsupported, not operated capability.
- `#200` is still used only as deferred cleanup/history, not as current capability.

## 4. Stale and contradictory findings

### Kept on purpose

- Historical offline-proof references remain in historical evidence docs only.
- `#200` remains as deferred cleanup evidence in supported security and recovery docs.
- Old proof and audit files still preserve historical state for RAG and traceability.

### Corrected or absent

- No active stale reference to `e011:t013:proof` found.
- No active stale reference to a removed `e011-offline` command found.
- No active stale preview HTTP URL found in current operator docs.
- No active claim that full offline rebuild/restore is a supported operator capability.

### RAG readiness

- Headers are explicit.
- Canonical source is singular per operating area.
- Commands are current and copyable.
- Path/link targets resolve in-repo.
- Historical evidence is separated from current operator contract.
- No secrets, credentials, or host-specific sensitive paths are present in the audited docs.

## 5. Evidence matrix

Legend:

- `behavioral boundary-crossing`: executable proof of real runtime behavior.
- `integration/runtime`: Docker, Compose, workflow, or browser/runtime proof.
- `contract/source-shape`: source, script, workflow, or config shape test.
- `documentation-only`: doc truthfulness or inventory only.
- `missing`: no current evidence.
- `obsolete`: historical-only evidence or removed capability.

| Area | Evidence | Type | State |
| --- | --- | --- | --- |
| Better Auth core with Prisma/PostgreSQL | `scripts/e011-t009-better-auth-core-proof.ts` | behavioral boundary-crossing | covered |
| No Better Auth Infrastructure / telemetry | `tests/auth-runtime-config.test.ts` | contract/source-shape | covered |
| Public sign-up rejection | `scripts/e011-t009-better-auth-core-proof.ts` | behavioral boundary-crossing | covered |
| Invalid credentials | `scripts/e011-t010-auth-session-proof.ts` | behavioral boundary-crossing | covered |
| Account-enumeration resistance | `scripts/e011-t010-auth-session-proof.ts` | behavioral boundary-crossing | covered |
| Sign-in / sign-out | `scripts/e011-t010-auth-session-proof.ts` | behavioral boundary-crossing | covered |
| Session validation / persistence / revocation | `scripts/e011-t010-auth-session-proof.ts` | behavioral boundary-crossing | covered |
| Expired / malformed / revoked sessions | `scripts/e011-t010-auth-session-proof.ts` | behavioral boundary-crossing | covered |
| Disabled user with existing session | `scripts/admin-user-access-proof.ts` | behavioral boundary-crossing | covered |
| Route authorization | `scripts/e011-t011-auth-boundary-proof.ts` | behavioral boundary-crossing | covered |
| Server-action authorization | `scripts/e011-t011-auth-boundary-proof.ts` | behavioral boundary-crossing | covered |
| API authorization | `scripts/admin-user-access-proof.ts` | behavioral boundary-crossing | covered |
| Normal user vs admin operations | `scripts/admin-user-access-proof.ts` | behavioral boundary-crossing | covered |
| Prohibited admin operations | `scripts/admin-user-access-proof.ts` | behavioral boundary-crossing | covered |
| Self-lockout and last-admin protection | `scripts/admin-user-access-proof.ts` | behavioral boundary-crossing | covered |
| Provisioning and partial-failure retry | `scripts/admin-user-access-proof.ts` | behavioral boundary-crossing | covered |
| Secure cookies | `tests/auth-runtime-config.test.ts` and `scripts/e011-t013-private-https-proof.ts` | integration/runtime | covered |
| Trusted origins | `tests/auth-runtime-config.test.ts` | contract/source-shape | covered |
| Proxy headers | `tests/auth-runtime-config.test.ts` | contract/source-shape | covered |
| Wrong origin / hostname / redirect rejection | `scripts/e011-t010-auth-session-proof.ts`, `scripts/e011-t013-private-https-proof.ts`, `scripts/preview-https-auth-proof.ts` | behavioral boundary-crossing | covered |
| Private HTTPS runtime | `scripts/e011-t013-private-https-proof.ts` | integration/runtime | covered |
| Preview HTTPS | `scripts/preview-https-auth-proof.ts` | integration/runtime | covered |
| Application and PostgreSQL restart | `scripts/e011-t013-private-https-proof.ts`, `scripts/preview-https-auth-proof.ts` | integration/runtime | covered |
| Disposable PostgreSQL backup/restore | `scripts/verify-compose-backup-restore.ts` | integration/runtime | covered |
| Exact-image upgrade and rollback | `scripts/e011-immutable-image.ts` and `scripts/e011-t013-private-https-proof.ts` | integration/runtime | covered |
| Session behavior after upgrade / rollback | `scripts/e011-immutable-image.ts` and `scripts/e011-t013-private-https-proof.ts` | behavioral boundary-crossing | covered |
| PostgreSQL volume preservation | `scripts/e011-immutable-image.ts` | integration/runtime | covered |
| Secret / log leakage | `scripts/e011-t010-auth-session-proof.ts`, `scripts/admin-user-access-proof.ts`, `scripts/e011-t013-private-https-proof.ts` | behavioral boundary-crossing | covered |
| Cleanup of containers, networks, volumes, images, certs, temp DB | `scripts/cleanup-test-runtime.ts`, `scripts/preview-https-auth-proof.ts`, `scripts/e011-t013-private-https-proof.ts` | integration/runtime | covered |
| Workflow path classification for E011-owned files | `.github/workflows/ci.yml`, `.github/workflows/full-integration.yml`, `.github/workflows/preview-release.yml`, `.github/workflows/stop-preview.yml`, `tests/github-actions-preview.test.ts`, `tests/test-suite-classification.test.ts` | contract/source-shape | covered |

## 6. Gap review

### Confirmed gaps fixed earlier or already absent

- No active stale `e011:t013:proof` reference.
- No active stale offline bundle/restore command claim.
- No active claim that managed Better Auth Infrastructure is required.
- No active claim that full offline rebuild/restore is an operated capability.

### Residual gaps

- No executable browser-based assistive-technology rehearsal exists for the whole E011 auth surface.
- No new product/runtime regression was exposed by the baseline audit.
- No Prisma schema, migration, dependency, or production-code fix was required.

## 7. Validation commands and results

- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm prisma:validate`: PASS
- `corepack pnpm prisma:generate`: PASS
- `corepack pnpm lint`: PASS
- `corepack pnpm test:fast`: PASS, 88 tests
- `corepack pnpm test:infra`: PASS, 84 tests
- `corepack pnpm build`: PASS
- `corepack pnpm e011:t013:runtime-proof`: PASS
- `corepack pnpm preview:https-auth-proof`: PASS
- `git diff --check`: PASS

## 8. Cleanup residue

- Temporary generated artifact `stop-preview-result.json` appeared during validation and was removed.
- No remaining untracked generated files in the worktree after cleanup.
- No leftover containers, networks, volumes, certs, temporary databases, or listeners were left by the final validation run.
- Repo cleanup of branches/worktrees was not performed.

## 9. Deferred scope

- `#200` remains deferred cleanup/history only.
- No offline rebuild/restore capability was added.
- No dependency upgrade, Prisma migration, or production-code refactor was required.
- `CI run ID/status`: pending push and exact-head workflow completion.
- `Full Integration run ID/status`: pending push and exact-head workflow completion.

## 10. Final note

This audit is truthful to the current repository state at report creation. Final delivery metadata will be captured after push and exact-head workflow completion.
