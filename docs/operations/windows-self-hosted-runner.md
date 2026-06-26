---
title: Windows self-hosted runner runbook
document_id: DOC-E016-WINDOWS-RUNNER
document_type: operations-runbook
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-26
related_epic: E016
related_tasks:
  - E016.T003
  - E016.T008
  - E016.T009
  - E016.T012
related_documents:
  - docs/architecture/preview-environment.md
  - docs/operations/preview-operations.md
  - docs/verification/e016-integrated-assurance.md
  - .github/workflows/preview-release.yml
  - .github/workflows/stop-preview.yml
  - scripts/runner-preflight.ps1
tags:
  - runner
  - windows
  - github-actions
  - security
---

# Windows self-hosted runner runbook

## Purpose

This is the canonical runbook for the E016 Windows preview runner. The runner executes only trusted on-demand Preview Release and Stop Preview jobs. Fast CI and Full Integration remain on GitHub-hosted Linux runners.

## Approved identity

```text
Repository:          lukexd09/clariobase-ai-crm
Labels:              self-hosted, windows, x64, clariobase-preview
Runner root:         C:\actions-runners\clariobase-preview
Runner work:         C:\actions-work\clariobase-preview
Production checkout: C:\Serwer\Projekty\Clariobase\clariobase-ai-crm
Startup mode:        Automatic with delayed startup behavior
```

The runner root and work directories must stay outside the production checkout. Do not run an interactive listener while the Windows service is active.

## Registration and preflight

Use only a short-lived repository-scoped registration token obtained through the GitHub repository runner settings. Never store registration credentials in repository files, scripts, shell history or documentation.

Before registration and after runner upgrades, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\runner-preflight.ps1 `
  -RunnerRoot C:\actions-runners\clariobase-preview `
  -RunnerWorkDir C:\actions-work\clariobase-preview `
  -ProductionCheckout C:\Serwer\Projekty\Clariobase\clariobase-ai-crm
```

Preflight verifies directory isolation, Docker, Git, Node.js and the minimum supported runner version. The runner must support `actions/checkout@v5` and `actions/setup-node@v5`.

## When Windows may run

The runner is eligible only after Preview Release has:

1. been dispatched from `main`;
2. resolved an open same-repository PR;
3. found successful Fast CI for the exact current PR head SHA;
4. validated the matching `auto-preview-context` artifact;
5. built and smoke-tested exactly one `linux/amd64` image;
6. pushed the image and captured its immutable registry digest.

A normal PR push, Fast CI completion or Full Integration result must not queue this runner.

## Deployment contract

The Windows job must:

1. check out trusted control files from `main` only;
2. revalidate that the PR is open, same-repository and still points to the selected SHA;
3. verify that the image source SHA equals the Fast CI SHA;
4. accept only `ghcr.io/lukexd09/clariobase-ai-crm@sha256:<64 lowercase hex>`;
5. authenticate to GHCR with the workflow token;
6. pull the exact digest before deleting the previous preview stack;
7. validate the merged Compose model;
8. run migration with `--pull never`;
9. start the application with `--no-build --pull never`;
10. require HTTP 200 with `service=clariobase-ai-crm`, `status=ready` and `checks.database=ok`;
11. clean temporary secrets and artifacts;
12. always attempt GHCR logout after successful login.

The runner must never build the CRM application locally or fall back to a Compose build.

## Shared slot and recovery

Preview Release and Stop Preview serialize through `clariobase-preview-slot`. If a job is active, inspect it in GitHub Actions before restarting the runner service. Stop only the isolated preview stack through `scripts/stop-preview.ps1`; never use broad Docker cleanup.

For runner diagnostics:

- check the Windows service state;
- inspect `C:\actions-runners\clariobase-preview\_diag`;
- confirm Docker access for the service account;
- rerun `scripts/runner-preflight.ps1`;
- confirm the runner labels still include `clariobase-preview`.

## Historical restart proof

The E016 restart rehearsal on `2026-06-16` proved that the service returned to `Running`, preview deployment and readiness succeeded, and Stop Preview removed the isolated preview resources. That historical result validates runner startup and isolation but does not replace the required post-merge Preview Release rehearsal for E016.T012.

## Security reminders

- only trusted on-demand Preview Release may execute on this runner;
- exact live PR head validation occurs again immediately before deployment;
- `pull_request_target` must not execute untrusted code;
- production health is not queried by preview gating;
- production `.env.compose.local`, containers, database and paths must remain untouched;
- interactive and service listeners must not run simultaneously;
- no registration or service credential may be committed or printed.
