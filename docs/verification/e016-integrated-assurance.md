---
title: E016 integrated assurance audit
document_id: DOC-E016-INTEGRATED-ASSURANCE
document_type: verification-report
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-16
related_epic: E016
related_tasks:
  - E016.T001
  - E016.T002
  - E016.T003
  - E016.T004
  - E016.T006
  - E016.T007
  - E016.T008
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

This document records the final integrated assurance outcome for `E016 - Add manual branch preview environment and CI foundation`, including the post-merge runtime and Windows restart gates completed on `2026-06-16`.

## Stable implementation evidence

- Epic PR: `#76`
- Epic merge commit: `5dfe9f2d73b9b461aa5d10f5504ee89f87893c76`
- Original verified implementation SHA: `87a6c448e8beb55e33bb6ee4b16fb11217d48df1`
- Original final exact-head CI run: `27572877122` — `success`
- Private-ref correction PR: `#89`
- Build-context correction PR: `#92`
- Windows-service/workflow correction PR: `#96`
- Final correction merge commit: `1552363e419bfa13998c2681b886961a005a2923`
- Final correction CI run: `27628718272` — `success`

## Review-gate history

- `E016.T001` architecture and safety contract review: `PASS`
- `E016.T002` isolation and production-protection review: `PASS`
- `E016.T003` GitHub Actions and self-hosted-runner security review: `PASS`
- `E016.T004` integrated assurance audit: `PASS`
- `E016.T006` private repository ref-resolution correction: `PASS`
- `E016.T007` source build-context propagation correction: `PASS`
- `E016.T008` Windows service resilience and restart proof: `PASS`

## Automated verification summary

The integrated baseline and correction loops passed the repository gates relevant to E016:

- Prisma validation and generation;
- lint;
- full test suite;
- production build;
- preview workflow contract tests;
- preview runtime and isolation tests;
- Docker image/runtime/backup-restore checks;
- scoped runtime cleanup.

The final preview contract test set passed with no failures after the Windows workflow correction, and the final correction PR CI completed successfully.

## Workflow and trust-boundary audit

Audit result: `PASS`

Confirmed controls:

- PR validation uses `pull_request`, not `pull_request_target`;
- workflow permissions remain limited to `contents: read`;
- deploy and stop operations share `concurrency.group: clariobase-manual-preview-slot`;
- trusted control code is checked out from `main`;
- the requested source ref is resolved to an exact trusted repository SHA;
- fork-style and pull-request refs are rejected;
- the resolver operates from locally checked-out trusted refs without a second unauthenticated network fetch;
- the requested source checkout is propagated as `CRM_BUILD_CONTEXT` to every Compose command;
- child PowerShell exit codes are handled explicitly and deployment output is streamed directly to the Actions log;
- no workflow deploys or mutates production.

## Preview isolation and replacement audit

Audit result: `PASS`

Approved preview identity:

```text
Compose project: clariobase-crm-preview
Port:            3001
Database:        clariobase_crm_preview
URL:             http://Serwer:3001
Volume:          clariobase-crm-preview-postgres-data
Network:         clariobase-crm-preview-network
```

Confirmed behavior:

- preview PostgreSQL is not published to the host or LAN;
- preview AI exchange remains separate from production;
- a new deploy first builds the requested source image;
- after a successful build, the old preview stack and preview database volume are removed;
- a fresh preview database is started and migrated;
- the new requested branch replaces the single preview slot;
- switching from `main` to `epic/e009-light-crm-closeout` replaced both preview containers and recreated the preview volume;
- both the new preview and production returned `status: ready` with `database: ok` after the switch.

## Windows self-hosted runner audit

Audit result: `PASS`

Verified runtime identity:

```text
Runner root: C:\actions-runners\clariobase-preview
Runner work: C:\actions-work\clariobase-preview
Service:     actions.runner.lukexd09-clariobase-ai-crm.Preview
Account:     .\user
Startup:     Automatic / delayed automatic behavior observed
Labels:      self-hosted, windows, x64, clariobase-preview
```

Restart proof completed on `2026-06-16`:

- no interactive `run.cmd` listener was started;
- after Windows restart the service reached `Running` with `StartMode: Auto` and exit code `0`;
- the service created a fresh runner diagnostic log and reconnected;
- Deploy Preview succeeded after restart;
- preview readiness on port `3001` returned `database: ok`;
- production readiness on port `3000` remained `database: ok`;
- the preview slot was successfully switched to another trusted branch after restart;
- Stop Preview succeeded after restart.

## Cleanup and production protection audit

Audit result: `PASS`

Final Stop Preview workflow run:

```text
GitHub Actions run: 27631243500
Conclusion:         success
```

Post-stop evidence:

- no containers matched Compose project `clariobase-crm-preview`;
- `clariobase-crm-preview` no longer appeared in `docker compose ls --all`;
- the protected production project `clariobase-crm` remained running;
- production readiness remained healthy;
- no broad Docker prune command was used.

Separate E014 disposable leftovers were removed through the approved `cleanup:test-runtime` command:

```text
Removed containers: 8
Removed networks:   4
Removed volumes:    4
Removed images:     5
Docker cleanup:     PASS
Temporary cleanup:  PASS
```

The cleanup preserved `clariobase-crm`, n8n, the server stack and unrelated local project resources.

## Acceptance-criteria evidence matrix

| Epic acceptance criterion | Final status | Evidence |
| --- | --- | --- |
| Operator can manually deploy a trusted branch/ref through GitHub Actions | PASS | Multiple successful manual Deploy Preview runs |
| Deployed preview reports and uses the resolved commit SHA | PASS | trusted resolver, source checkout and workflow outputs |
| Preview works at `http://Serwer:3001` | PASS | live post-deploy readiness evidence |
| `/api/ready` returns HTTP 200 and `database: ok` | PASS | live preview and production responses |
| Preview has isolated DB, volume, network and AI exchange | PASS | Compose contract, tests and live replacement evidence |
| Preview PostgreSQL is not exposed to host/LAN | PASS | Compose config tests |
| Production remains healthy and unchanged | PASS | repeated readiness checks before/after deploy, switch and stop |
| Preview never uses production port or resources | PASS | fail-closed guards and live isolation proof |
| Preview control jobs are serialized | PASS | shared concurrency group |
| Stop Preview removes only approved preview resources | PASS | run `27631243500` and empty post-stop preview resource listing |
| Pull requests run lint, tests and build | PASS | CI workflow and successful exact-head runs |
| `SKIPPED` is never reported as `PASS` | PASS | runtime and cleanup status contracts |
| Runner starts after Windows restart | PASS | real restart, automatic reconnect and successful post-restart workflow execution |
| Documentation matches implemented behavior | PASS | preview and runner runbooks plus this final post-merge update |
| Integrated verification and assurance return `PASS` | PASS | this report |
| Final epic PR exists and was merged by the maintainer | PASS | PR `#76`, merge commit `5dfe9f2d73b9b461aa5d10f5504ee89f87893c76` |
| Codex did not merge the final PR | PASS | maintainer-controlled merge preserved |

## Residual risks

Accepted non-blocking operational risks:

- Docker Desktop availability still depends on the Windows host and user session model;
- `actions/checkout` can recreate the runner workspace when Windows path-length cleanup fails; this is noisy but did not block jobs;
- the single preview slot is intentionally destructive for preview data during branch replacement;
- production release automation remains out of scope and is handled by E018.

No residual risk blocks closure of E016.

## Final verdict

`PASS`

E016 is complete. The manual preview slot, trusted-ref flow, isolated runtime, Windows service runner, post-restart deploy/replace/stop rehearsal and production-protection gates all passed.
