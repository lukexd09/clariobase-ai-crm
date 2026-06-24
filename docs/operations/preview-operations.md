---
title: Preview operations runbook
document_id: DOC-E016-PREVIEW-OPERATIONS
document_type: operations-runbook
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-24
related_epic: E016
related_tasks:
  - E016.T002
  - E016.T009
related_components:
  - COMP-CRM-PREVIEW-APP
  - COMP-CRM-PREVIEW-POSTGRES
related_documents:
  - docs/architecture/preview-environment.md
  - docs/decisions/adr-e016-manual-preview.md
  - compose.preview.yaml
  - .env.compose.preview.example
tags:
  - preview
  - operations
  - powershell
  - docker
---

# Preview operations runbook

## Purpose

This document is the canonical operator runbook for the E016 preview slot.
It describes the approved preview env file, manual and automatic deployment behavior, operator-visible outputs, and fail-closed safety guards that protect production through isolation rather than production-runtime dependencies.

## Canonical preview assets

Operator-facing preview files:

- `compose.preview.yaml`
- `.env.compose.preview.example`
- local copied env file such as `.env.compose.preview.local`
- `scripts/deploy-preview.ps1`
- `scripts/stop-preview.ps1`

Approved preview identity:

```text
Compose project: clariobase-crm-preview
Port:            3001
Database:        clariobase_crm_preview
URL:             http://Serwer:3001
Volume:          clariobase-crm-preview-postgres-data
Network:         clariobase-crm-preview-network
```

## Preview env contract

Copy `.env.compose.preview.example` to a local ignored file such as `.env.compose.preview.local`.

Required preview values:

- `CRM_BIND_ADDRESS=0.0.0.0`
- `CRM_HOST_PORT=3001`
- `AI_EXCHANGE_HOST_PATH=./data/ai-exchange-preview`
- `CRM_POSTGRES_DB=clariobase_crm_preview`
- `CRM_POSTGRES_USER=clariobase_crm_preview_user`
- `CRM_POSTGRES_PASSWORD=<local preview secret>`

Rules:

- do not reuse production `.env.compose.local`;
- do not reuse the production AI exchange path `./data/ai-exchange`;
- do not point `CRM_DATABASE_URL` at `clariobase_crm`;
- keep preview secrets local or inject them through a workflow secret at runtime.

## Deploy preview

The safe preview deployment entrypoint is:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-preview.ps1 `
  -RequestedRef main `
  -PreviewEnvFile .\.env.compose.preview.local
```

Deployment behavior:

1. validate the preview env file and protected identifiers;
2. resolve the current checkout SHA and compare it to the optional expected SHA;
3. build the preview app image through `compose.yaml` plus `compose.preview.yaml`;
4. remove any existing `clariobase-crm-preview` stack and its preview database volume;
5. start a fresh preview PostgreSQL service;
6. run `prisma migrate deploy` only against the fresh preview database;
7. start the preview app service from the requested ref;
8. wait for `http://127.0.0.1:3001/api/ready`;
9. report requested ref, resolved SHA, preview URL, project name, volume, and network.

Each deployment replaces the single preview slot. Preview database contents are intentionally reset so that migrations and test data from a previously deployed branch cannot contaminate the next branch.

## Automatic post-CI preview deploy

After `.github/workflows/auto-deploy-preview.yml` is merged to `main`, a successful `CI` workflow run for an open same-repository pull request automatically replaces the shared preview slot.

Automatic rules:

- trigger source is `workflow_run` for `CI` with `completed`;
- the downstream workflow uses `actions: read` for exact-run artifact retrieval, `pull-requests: read` for live PR verification, `issues: write` for the persistent PR status comment, and `contents: read` for trusted and exact-SHA checkouts;
- only `pull_request` CI runs with conclusion `success` are eligible;
- the auto-preview job downloads the `auto-preview-context` artifact from the exact triggering CI run ID;
- the artifact is validated before deployment and must match the triggering run SHA, repository, PR number, and PR head metadata;
- the CI workflow checks out the exact PR head SHA rather than `refs/pull/<n>/merge`;
- the workflow must resolve exactly one associated PR;
- forked PRs are rejected;
- closed PRs are rejected;
- the validated SHA is the completed CI run SHA, not a guessed branch ref;
- if the current PR head no longer matches that validated SHA, the job stops with `BLOCKED: stale validated SHA`;
- the deployment still runs through `scripts/deploy-preview.ps1` from the trusted `main` control checkout;
- application source is checked out at the exact validated SHA into a separate `source` directory;
- preview readiness alone determines automatic preview deployment success.
- production may run on the same machine, on another machine, or not yet exist, without affecting preview deployment eligibility.

Because the preview slot is shared, the most recently completed eligible successful PR deployment replaces the previous preview regardless of which PR deployed earlier.

## Stop preview

The safe preview stop entrypoint is:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-preview.ps1 `
  -PreviewEnvFile .\.env.compose.preview.local
```

Stop behavior:

- validates the same preview guardrails as deploy;
- runs `docker compose down -v --remove-orphans` only for `clariobase-crm-preview`;
- removes only the approved preview containers, network, and preview database volume;
- does not touch production `clariobase-crm`.

## Dry-run mode

Both scripts support `-DryRun`.

Use it when you want to inspect the resolved plan without changing Docker state:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-preview.ps1 `
  -RequestedRef epic/e016-manual-preview `
  -PreviewEnvFile .\.env.compose.preview.local `
  -DryRun
```

## Fail-closed protection rules

The scripts must stop immediately when any resolved value collides with:

```text
clariobase-crm
port 3000
clariobase_crm
.env.compose.local
./data/ai-exchange
```

Broad cleanup commands remain prohibited:

```text
docker system prune
docker volume prune
docker network prune
```

## Expected operator-visible output

Successful deploy reports:

- requested ref;
- resolved commit SHA;
- preview URL;
- preview project name;
- preview volume name;
- preview network name.

Automatic deploy additionally reports:

- CI run URL;
- automatic deployment run URL;
- explicit preview readiness results;
- one persistent PR status comment showing which SHA currently occupies the slot.

Successful stop reports:

- preview project name;
- preview volume name;
- preview network name;
- explicit confirmation that only preview resources were targeted.
