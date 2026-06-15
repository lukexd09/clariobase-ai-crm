---
title: Windows self-hosted runner runbook
document_id: DOC-E016-WINDOWS-RUNNER
document_type: operations-runbook
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-15
related_epic: E016
related_tasks:
  - E016.T003
related_documents:
  - docs/architecture/preview-environment.md
  - docs/operations/preview-operations.md
  - .github/workflows/deploy-preview.yml
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

This document is the canonical runbook for the E016 preview self-hosted runner.
It defines the dedicated install path, work path, labels, startup behavior, bootstrap procedure, diagnostics, and recovery rules for preview workflows that execute code on the server.

## Required runner identity

Approved repository:

```text
https://github.com/lukexd09/clariobase-ai-crm
```

Approved labels:

```text
self-hosted
windows
x64
clariobase-preview
```

Approved directories:

```text
Runner root: C:\actions-runners\clariobase-preview
Runner work: C:\actions-work\clariobase-preview
Production checkout: C:\Serwer\Projekty\Clariobase\clariobase-ai-crm
```

The runner root and work directories must stay outside the protected production checkout.

## Preflight

Minimum supported version for the Node.js 24-compatible `actions/checkout@v5` and `actions/setup-node@v5` releases is `v2.327.1` or newer, per the official release notes.

Before registration, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\runner-preflight.ps1 `
  -RunnerRoot C:\actions-runners\clariobase-preview `
  -RunnerWorkDir C:\actions-work\clariobase-preview `
  -ProductionCheckout C:\Serwer\Projekty\Clariobase\clariobase-ai-crm
```

Preflight checks:

- runner root and work directories are distinct from production;
- `docker`, `git`, and `node` are callable;
- Docker engine responds locally;
- the runner version is at least `v2.327.1`;
- the proposed workspace separation is explicit and reviewable.

To inspect the installed runner version on Windows, read the `FileVersion` or `ProductVersion` metadata from `C:\actions-runners\clariobase-preview\bin\Runner.Listener.exe`, or rerun the preflight script and inspect the emitted `runnerVersion` field.

## Registration

Download the current Windows x64 GitHub Actions runner package manually from the official GitHub runner releases page into `C:\actions-runners\clariobase-preview`.

Then configure it from the extracted runner directory:

```powershell
.\config.cmd `
  --url https://github.com/lukexd09/clariobase-ai-crm `
  --token <PASTE_SHORT_LIVED_TOKEN_HERE> `
  --labels self-hosted,windows,x64,clariobase-preview `
  --work C:\actions-work\clariobase-preview `
  --unattended `
  --replace
```

Rules:

- use a short-lived repository-scoped registration token;
- never commit, echo, or screenshot the token;
- do not save the token in the repository, runner scripts, shell history, or Markdown docs;
- repository-scoped registration is preferred over broader organization scope for this single preview slot.

## Service startup and restart behavior

Install and start the runner service:

```powershell
.\svc.cmd install
.\svc.cmd start
```

Expected behavior:

- the Windows service should start automatically after host restart;
- the runner should reconnect with the same labels and work path;
- if the runner self-updated, rerun the preflight script to confirm the minimum supported version still holds;
- if that startup behavior is not yet verified before merge, it remains an explicit post-merge manual gate instead of an automated `PASS`.

## Daily operator checklist

- confirm the runner is online in repository Actions settings;
- confirm labels include `clariobase-preview`;
- confirm Docker Desktop is running and healthy;
- confirm the runner work directory remains outside the production checkout;
- confirm preview workflows still target `clariobase-crm-preview` and never `clariobase-crm`.

## Diagnostics and recovery

Runner appears offline:

- check the Windows service status;
- inspect the runner `_diag` directory;
- confirm outbound connectivity to GitHub;
- rerun `scripts/runner-preflight.ps1` to confirm local prerequisites.

Runner is busy or stuck:

- let the current preview-control job finish when possible because concurrency protects one slot;
- inspect the active job in GitHub Actions;
- if a process is orphaned, stop only the preview stack with `scripts/stop-preview.ps1`;
- restart the runner service if necessary.

Runner must be removed or re-registered:

```powershell
.\config.cmd remove --token <PASTE_SHORT_LIVED_TOKEN_HERE>
.\svc.cmd uninstall
```

Then clean only the dedicated runner root and work directories, not the production checkout.

## Security reminders

- self-hosted preview jobs execute repository code on the server;
- only trusted same-repository refs may be deployed;
- `pull_request_target` must not be used for untrusted code execution;
- the runner must not be installed inside `C:\Serwer\Projekty\Clariobase\clariobase-ai-crm`;
- preview workflows must not read or mutate production `.env.compose.local` or the production runtime paths.
