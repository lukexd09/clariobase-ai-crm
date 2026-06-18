---
title: Windows self-hosted runner runbook
document_id: DOC-E016-WINDOWS-RUNNER
document_type: operations-runbook
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-16
related_epic: E016
related_tasks:
  - E016.T003
  - E016.T008
related_documents:
  - docs/architecture/preview-environment.md
  - docs/operations/preview-operations.md
  - docs/verification/e016-integrated-assurance.md
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
It defines the dedicated install path, work path, labels, Windows service identity, startup behavior, bootstrap procedure, diagnostics and recovery rules for preview workflows that execute code on the server.

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
Runner root:        C:\actions-runners\clariobase-preview
Runner work:        C:\actions-work\clariobase-preview
Production checkout: C:\Serwer\Projekty\Clariobase\clariobase-ai-crm
```

Approved Windows service:

```text
Service name: actions.runner.lukexd09-clariobase-ai-crm.Preview
Service binary: C:\actions-runners\clariobase-preview\bin\RunnerService.exe
Service account: .\user
Startup mode: Automatic with delayed startup behavior
```

The runner root and work directories must stay outside the protected production checkout.
Normal operation must not require an interactive `run.cmd` listener window.

## Preflight

Minimum supported version for the Node.js 24-compatible `actions/checkout@v5` and `actions/setup-node@v5` releases is `v2.327.1` or newer.

Before registration or after a runner update, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\runner-preflight.ps1 `
  -RunnerRoot C:\actions-runners\clariobase-preview `
  -RunnerWorkDir C:\actions-work\clariobase-preview `
  -ProductionCheckout C:\Serwer\Projekty\Clariobase\clariobase-ai-crm
```

Preflight checks:

- runner root and work directories are distinct from production;
- `docker`, `git` and `node` are callable;
- Docker engine responds locally;
- the runner version is at least the supported minimum;
- the workspace separation is explicit and reviewable.

To inspect the installed runner version on Windows, read the `FileVersion` or `ProductVersion` metadata from:

```text
C:\actions-runners\clariobase-preview\bin\Runner.Listener.exe
```

## Registration

Download the current Windows x64 GitHub Actions runner package manually from the official GitHub runner releases page into:

```text
C:\actions-runners\clariobase-preview
```

Configure it from the extracted runner directory:

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
- never commit, echo or screenshot the token;
- do not save the token in repository files, runner scripts, shell history or Markdown docs;
- repository-scoped registration is preferred over broader organization scope for this single preview slot.

## Windows service installation

Install the official runner service from the runner root:

```powershell
Set-Location C:\actions-runners\clariobase-preview
.\svc.cmd install
.\svc.cmd start
```

The accepted runtime uses the local Windows account `serwer\user` / `.\user` because that account can access the local Docker engine used by preview workflows.
Do not store or document the account password.

Verify the service:

```powershell
Get-CimInstance Win32_Service `
  -Filter "Name='actions.runner.lukexd09-clariobase-ai-crm.Preview'" |
  Select-Object Name, State, StartMode, StartName, ExitCode, ServiceSpecificExitCode, PathName
```

Expected steady state:

```text
State:     Running
StartMode: Auto
StartName: .\user
ExitCode:  0
```

The service may remain `Stopped` briefly immediately after Windows login while delayed startup and host dependencies settle. Recheck before declaring failure.

## Restart proof

The E016 restart rehearsal completed successfully on `2026-06-16`:

- Windows was restarted;
- `run.cmd` was not started manually;
- the service reached `Running` with automatic startup and exit code `0`;
- a new runner diagnostic log appeared in `_diag`;
- Deploy Preview succeeded after restart;
- preview readiness on port `3001` returned `database: ok`;
- production readiness on port `3000` remained `database: ok`;
- the preview slot was switched from `main` to `epic/e009-light-crm-closeout`;
- Stop Preview completed successfully after restart;
- post-stop Docker inspection showed no `clariobase-crm-preview` containers or Compose project.

The final post-restart Stop Preview workflow run was:

```text
27631243500
```

## Daily operator checklist

- confirm the service `actions.runner.lukexd09-clariobase-ai-crm.Preview` is running;
- confirm the runner is online in repository Actions settings;
- confirm labels include `clariobase-preview`;
- confirm Docker Desktop and the Docker engine are healthy;
- confirm the runner work directory remains outside the production checkout;
- confirm preview workflows still target `clariobase-crm-preview` and never `clariobase-crm`;
- do not start `run.cmd` while the service is active.

## Diagnostics and recovery

Runner appears offline:

- check the Windows service status;
- wait for delayed startup when the host has just restarted;
- inspect `C:\actions-runners\clariobase-preview\_diag`;
- confirm outbound connectivity to GitHub;
- confirm Docker engine access from the service account;
- rerun `scripts/runner-preflight.ps1`.

Runner is busy or stuck:

- let the current preview-control job finish when possible because concurrency protects one slot;
- inspect the active job in GitHub Actions;
- if a process is orphaned, stop only the preview stack with `scripts/stop-preview.ps1`;
- restart only the runner service when necessary.

Workspace cleanup warning:

```text
Unable to clean or reset the repository. The repository will be recreated instead.
```

This warning can occur when Windows path-length handling prevents full cleanup of an old `node_modules` tree. The checkout action recreates the workspace and the job may still pass. Treat it as housekeeping noise unless checkout or installation actually fails.

Runner must be removed or re-registered:

```powershell
.\config.cmd remove --token <PASTE_SHORT_LIVED_TOKEN_HERE>
.\svc.cmd uninstall
```

Then clean only the dedicated runner root and work directories, never the production checkout.

## Security reminders

- self-hosted preview jobs execute trusted same-repository code on the server;
- only trusted repository refs may be deployed;
- `pull_request_target` must not be used for untrusted code execution;
- the runner must not be installed inside the production checkout;
- preview workflows must not read or mutate production `.env.compose.local` or production runtime paths;
- interactive and service listeners must not run simultaneously;
- no service or registration credential may be committed or printed.
