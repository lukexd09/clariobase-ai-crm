---
title: E016 integrated assurance audit
document_id: DOC-E016-INTEGRATED-ASSURANCE
document_type: verification-report
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-15
related_epic: E016
related_tasks:
  - E016.T001
  - E016.T002
  - E016.T003
  - E016.T004
related_documents:
  - docs/architecture/preview-environment.md
  - docs/decisions/adr-e016-manual-preview.md
  - docs/operations/preview-operations.md
  - docs/operations/windows-self-hosted-runner.md
  - docs/verification/e016-budget-telemetry.yaml
  - .github/workflows/ci.yml
  - .github/workflows/deploy-preview.yml
  - .github/workflows/stop-preview.yml
tags:
  - verification
  - audit
  - preview
  - github-actions
  - runner
  - docker
  - rag
---

# E016 integrated assurance audit

## Audit result

Result: `PASS`

This document records the final integrated assurance outcome for `E016 - Add manual branch preview environment and CI foundation`.

Audit target:

- base SHA: `c230d3800114c57afc9a5911a334b7a2f19f3172`
- verified implementation SHA: `9092981`
- epic branch target: `epic/e016-manual-preview`
- audit date: `2026-06-15`

Review-gate history:

- `E016.T001` architecture and safety contract review: `PASS`
- `E016.T002` isolation and production-protection review: `PASS`
- `E016.T003` GitHub Actions and self-hosted-runner security review: `PASS`
- `E016.T004` integrated assurance audit: `PASS`

## Scope audited

This audit covers:

- preview architecture and ADR decisions;
- preview runtime scripts, compose override, and guardrails;
- pull-request CI and manual preview workflows;
- Windows runner documentation and preflight;
- integrated verification evidence and residual manual gates.

## Integrated verification evidence

Fresh verification executed on `2026-06-15` with logs in `.codex-tmp/e016-assurance/`:

| Command | Result | Evidence summary |
| --- | --- | --- |
| `corepack pnpm prisma:validate` | PASS | Prisma schema remained valid. Log: `.codex-tmp/e016-assurance/prisma-validate.log` |
| `corepack pnpm prisma:generate` | PASS | Prisma Client generated successfully. Log: `.codex-tmp/e016-assurance/prisma-generate.log` |
| `corepack pnpm lint` | PASS | ESLint completed without reported violations. Log: `.codex-tmp/e016-assurance/lint.log` |
| `corepack pnpm build` | PASS | Next.js production build passed after the preview control-plane fix. Log: `.codex-tmp/e016-assurance/build.log` |
| `corepack pnpm test` | PASS | `82` tests passed, `0` failed, `0` skipped, including the new preview workflow/runtime regression coverage. Log: `.codex-tmp/e016-assurance/test.log` |
| `corepack pnpm docker:test-image` | PASS | Disposable image verification completed successfully. Log: `.codex-tmp/e016-assurance/docker-test-image.log` |
| `corepack pnpm docker:test-runtime` | PASS | Disposable runtime verification completed for readiness, failure path, restart, and persistence. Log: `.codex-tmp/e016-assurance/docker-test-runtime.log` |
| `corepack pnpm docker:test-backup-restore` | PASS | Disposable backup/restore rehearsal completed successfully. Log: `.codex-tmp/e016-assurance/docker-test-backup-restore.log` |
| `corepack pnpm cleanup:test-runtime` | PASS | Cleanup preserved protected resources and removed only approved disposable artifacts. Log: `.codex-tmp/e016-assurance/cleanup-test-runtime.log` |

Correction delta:

- initial final build attempt found a TypeScript inference regression in `scripts/deploy-preview.ts`;
- follow-up fix added the trusted control-plane split, `.codex-tmp` root creation, and tighter preview env validation in `9092981`;
- affected checks rerun: `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm docker:test-runtime`, `corepack pnpm docker:test-backup-restore`, and focused preview workflow/runtime tests;
- no broader risk boundary was reopened, so a delta correction cycle was sufficient.

## Automated test audit

Audit result: `PASS`

Coverage assessment:

- documentation drift is covered through `tests/docs-sanity.test.ts`;
- preview compose/env/guard logic is covered through `tests/preview-runtime.test.ts`;
- trusted-ref and workflow static contracts are covered through `tests/github-actions-preview.test.ts`;
- container runtime/image/backup behavior continues to be covered by the existing E014 Docker-backed suite;
- `corepack pnpm test` executed all integrated checks successfully on the verified implementation SHA.

Regression value:

- changing preview identities, ports, AI exchange paths, or protected markers would fail `tests/preview-runtime.test.ts`;
- weakening trusted-ref validation or workflow permissions would fail `tests/github-actions-preview.test.ts`;
- breaking existing runtime safety would fail the E014 Docker-backed checks that still run in the integrated suite.

## Workflow definition audit

Audit result: `PASS`

Confirmed workflow controls:

- PR validation uses `pull_request`, not `pull_request_target`;
- workflow permissions are limited to `contents: read`;
- manual preview control is serialized through `concurrency.group: clariobase-manual-preview-slot`;
- the deploy workflow validates the requested ref with trusted repository code before self-hosted execution;
- the deploy and stop workflows call repository PowerShell entrypoints instead of duplicating runtime logic inline.

## Preview isolation audit

Audit result: `PASS`

Confirmed preview isolation rules:

- preview project name: `clariobase-crm-preview`;
- preview application URL contract: `http://Serwer:3001`;
- preview database name: `clariobase_crm_preview`;
- preview network name: `clariobase-crm-preview-network`;
- preview volume name: `clariobase-crm-preview-postgres-data`;
- preview PostgreSQL is not published in `compose.preview.yaml` config output;
- preview AI exchange path is separate from the protected production path.

Live host evidence after verification:

- no containers matched `clariobase-crm-preview`;
- no Docker networks matched `clariobase-crm-preview`;
- no Docker volumes matched `clariobase-crm-preview`.

This is expected before the post-merge manual workflow gate because the GitHub UI workflows were not executed from the default branch yet.

## Production protection audit

Audit result: `PASS`

Protected production evidence:

- protected runtime containers remained healthy after the integrated suite:
  - `clariobase-crm-crm-app-1`: `healthy`
  - `clariobase-crm-crm-postgres-1`: `healthy`
- `http://192.168.21.8:3000/api/ready` returned a ready payload with `database: ok` after verification;
- `corepack pnpm cleanup:test-runtime` explicitly reported `Protected stack preserved: clariobase-crm`;
- preview scripts reject `.env.compose.local`, port `3000`, database `clariobase_crm`, and the production AI exchange path.

## Cleanup and failure-path audit

Audit result: `PASS`

Confirmed behavior:

- runtime cleanup uses only approved disposable prefixes or the exact preview identity;
- broad Docker prune commands remain prohibited in architecture, runbooks, and tests;
- the preview deploy scripts require exact preview values and fail closed on collisions;
- the final cleanup command removed only approved disposable artifacts and did not touch the protected stack.

## Self-hosted runner security audit

Audit result: `PASS`

Confirmed controls:

- runner labels are pinned to `self-hosted`, `windows`, `x64`, `clariobase-preview`;
- runner root and work directories are required to stay outside the production checkout;
- registration documentation uses a short-lived token placeholder and explicitly forbids storing or printing the token;
- runner preflight validates path separation plus local `docker`, `git`, and `node` availability;
- self-hosted execution is documented as a server trust boundary and restricted to trusted same-repository refs.

## Documentation accuracy and RAG readiness audit

Audit result: `PASS`

Canonical E016 sources:

- architecture contract: `docs/architecture/preview-environment.md`
- ADR: `docs/decisions/adr-e016-manual-preview.md`
- preview operations: `docs/operations/preview-operations.md`
- runner operations: `docs/operations/windows-self-hosted-runner.md`
- integrated assurance report: `docs/verification/e016-integrated-assurance.md`
- budget telemetry: `docs/verification/e016-budget-telemetry.yaml`

RAG-readiness findings:

- each canonical document carries stable front matter and identifiers;
- README links the E016 canonical docs instead of duplicating operational truth;
- workflow/static contracts, runtime contracts, and audit evidence are separated into focused sources;
- shared safety rules remain discoverable through stable identifiers such as `E016`, `DOC-E016-*`, and `ADR-E016-MANUAL-PREVIEW`.

## Acceptance-criteria evidence matrix

| Epic acceptance criterion | Status at this audit gate | Coverage evidence |
| --- | --- | --- |
| Operator can manually deploy a trusted branch or ref through GitHub Actions | POST-MERGE MANUAL GATE | Workflow definitions, trusted-ref resolver, runbooks, and scripts are present; UI execution remains pending until workflows exist on default branch |
| Deployed preview reports the exact commit SHA | PASS | `scripts/resolve-preview-ref.ts`, deploy workflow outputs, `scripts/deploy-preview.ts`, and static tests |
| Preview works at `http://Serwer:3001` | POST-MERGE MANUAL GATE | URL is pinned in docs, env contract, scripts, and workflows; live GitHub UI execution remains pending |
| `/api/ready` returns HTTP 200 and `database: ok` | PASS | Existing runtime verifier and preview script readiness target `api/ready`; protected production runtime also returned ready post-verification |
| Preview has isolated DB, volume, network, and AI exchange | PASS | `compose.preview.yaml`, `.env.compose.preview.example`, `tests/preview-runtime.test.ts`, and audit evidence |
| Preview PostgreSQL is not exposed to host or LAN | PASS | `docker compose config` assertions in `tests/preview-runtime.test.ts` |
| Production `clariobase-crm` remains healthy and unchanged | PASS | Docker health evidence, ready payload on `192.168.21.8:3000`, and protected cleanup result |
| Preview never uses port 3000 or production resources | PASS | env validation, script guards, and preview tests |
| Two preview control jobs cannot execute concurrently | PASS | both preview workflows share the same concurrency group |
| `Stop Preview` removes only approved preview resources | PASS | `scripts/stop-preview.ts`, `scripts/stop-preview.ps1`, runbook, and static workflow tests |
| Pull requests run lint, tests, and build | PASS | `.github/workflows/ci.yml` |
| `SKIPPED` is never reported as `PASS` | PASS | runbooks, audits, and existing cleanup/runtime scripts preserve explicit statuses |
| Runner starts after Windows restart or the limitation is explicit | MANUAL GATE DOCUMENTED | runbook documents expected service startup and leaves restart confirmation as a post-merge manual gate |
| Documentation matches actual commands and behavior | PASS | docs sanity tests, focused workflow/runtime tests, and this audit |
| Integrated verification and Integrated Assurance Audit return `PASS` | PASS | this report and full integrated suite |
| One final Draft PR exists from `epic/e016-manual-preview` to `main` | PENDING FINAL STEP | Created after this audit on the epic branch |
| Codex does not merge the final PR or close issues | IN FORCE | no merge or issue closure performed |

## E016 budget and context compliance

Audit result: `PASS`

Budget telemetry is recorded in `docs/verification/e016-budget-telemetry.yaml`.

Recorded aggregate usage:

- `agents_started: 0`
- `review_gates: 4`
- `correction_cycles: 1`
- `full_suite_runs: 1`

Context compliance:

- loaded mandatory WoW core packet and project overlay from pinned `wow_ref`;
- loaded only the needed standard and risk sections for `STRICT` execution;
- avoided full README or full WoW repository loading as primary agent context;
- used one integrated full-suite run on the final implementation SHA plus targeted reruns after the narrow correction.

## Residual-risk assessment

Residual risks accepted for the Draft PR gate:

- GitHub UI `workflow_dispatch` execution remains unverified until the workflows exist on `main`;
- repository-scoped runner registration and restart confirmation remain manual post-merge steps;
- preview reachability from another LAN device remains a manual post-merge smoke test;
- production health confirmation after manual GitHub workflow execution remains a post-merge operator check;
- GitHub Actions CI success on the current head still needs to be observed after push.

Residual-risk conclusion:

- no identified residual risk blocks a Draft PR to `main`;
- the remaining items are explicit manual gates rather than hidden automation claims.

## Manual post-merge smoke-test checklist

1. Register or confirm the repository-scoped Windows runner with labels `self-hosted`, `windows`, `x64`, `clariobase-preview`.
2. Confirm the runner service reconnects after Windows restart or record the remaining manual startup step.
3. Run `Deploy Preview` from GitHub Actions with a trusted ref.
4. Confirm the workflow summary shows the requested ref, resolved SHA, and `http://Serwer:3001`.
5. Open `http://Serwer:3001` from another LAN device and confirm `/api/ready` returns `database: ok`.
6. Run `Stop Preview` from GitHub Actions.
7. Reconfirm production health for `clariobase-crm`.

## Final verdict

`PASS`

E016 is ready for one final Draft PR from `epic/e016-manual-preview` to `main`.
The remaining unperformed work is explicitly limited to post-merge manual gates that cannot be honestly marked as pre-merge `PASS`.
