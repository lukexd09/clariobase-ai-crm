---
title: Preview operations runbook
document_id: DOC-E016-PREVIEW-OPERATIONS
document_type: operations-runbook
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-15
related_epic: E016
related_tasks:
  - E016.T002
  - E016.T009
  - E016.T012
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
  - ci
---

# Preview operations runbook

## Purpose

This document is the canonical operator runbook for the E016 preview slot.
It separates normal pull-request feedback from infrastructure integration and intentional preview releases while preserving the exact-SHA, immutable-image, trusted-control and Windows deployment safeguards.

## Operating model

The repository has three distinct validation and release paths:

```text
Fast CI
Full Integration
Preview Release
```

A normal pull-request push runs Fast CI only. It does not publish an image, start the Windows runner, or replace the preview slot.

### Fast CI

Fast CI is the default feedback path for application, UI, documentation and business-logic changes. It:

- checks out the exact current PR head SHA;
- verifies the checkout identity;
- publishes the exact-run `auto-preview-context` artifact;
- restores the pnpm cache and installs locked dependencies;
- validates and generates Prisma;
- runs lint, `pnpm test:fast`, and the Next.js build;
- cancels an older in-progress CI run when a newer commit is pushed to the same PR.

Fast CI is sufficient when no infrastructure-sensitive file changed and no deployed preview is needed.

### Full Integration

Full Integration runs automatically for infrastructure-sensitive pull-request changes, including workflow, Dockerfile, Compose, preview deployment scripts, Prisma schema or migrations, runtime readiness and infrastructure tests.

It also runs:

- for every push to `main`;
- manually through `workflow_dispatch`;
- before merging reviewed deployment-infrastructure changes.

A normal UI-only pull request still receives a visible Full Integration gate, but the heavy `pnpm test:infra` job is skipped when the classifier finds no infrastructure-sensitive changes.

### Preview Release

Preview Release is intentional and manual. A successful Fast CI run does not start it automatically.

Run it from the repository default branch with:

```powershell
gh workflow run preview-release.yml -f source_mode=open_pr -f pr_number=112
```

To require a specific current head SHA:

```powershell
gh workflow run preview-release.yml `
  -f source_mode=open_pr `
  -f pr_number=112 `
  -f expected_sha=0123456789abcdef0123456789abcdef01234567
```

To rehearse a trusted post-merge commit from `main`:

```powershell
gh workflow run preview-release.yml `
  -f source_mode=main `
  -f pr_number= `
  -f expected_sha=0123456789abcdef0123456789abcdef01234567
```

The workflow must be dispatched from `main`. It rejects a workflow run selected from another ref.

## Preview Release eligibility

The resolver loaded from trusted workflow code must prove all of the following before image build begins:

1. `source_mode=open_pr` requires a valid positive integer `pr_number`;
2. `source_mode=open_pr` requires the pull request to exist and be open;
3. `source_mode=open_pr` requires the PR head to belong to `lukexd09/clariobase-ai-crm`;
4. `source_mode=open_pr` requires the current PR head to be a full exact commit SHA;
5. optional `expected_sha` must match that current head;
6. the PR must not change protected preview control-plane files that must first be reviewed and merged to `main`;
7. a completed successful `CI` run must exist for the exact current head SHA;
8. that exact CI run must contain a non-expired `auto-preview-context` artifact;
9. the artifact repository, PR number, branch, SHA and workflow run ID must match the live PR and selected CI run;
10. `source_mode=main` requires an empty `pr_number`;
11. `source_mode=main` requires `expected_sha`, when present, to match the exact trusted `main` SHA;
12. `source_mode=main` requires a completed successful `Full Integration` run for that exact SHA from a push to `main`;
13. `source_mode=main` must not use the PR-only `auto-preview-context` artifact or PR comment APIs.

A green CI run for an older SHA is not eligible. Push a new commit or rerun Fast CI for the current PR head before requesting Preview Release.

## Trusted release lifecycle

An eligible Preview Release performs:

```text
exact successful Fast CI SHA
→ queued status
→ one linux/amd64 image build
→ smoke test of that image
→ GHCR push
→ exact registry digest capture
→ immutable metadata artifact
→ deploying status
→ runner-side PR head revalidation
→ exact digest pull on Windows
→ Compose model validation
→ old preview replacement only after pull succeeds
→ PostgreSQL startup
→ prisma migrate deploy with --pull never
→ application startup with --no-build --pull never
→ readiness
→ final status
→ cleanup
→ GHCR logout
```

The metadata artifact binds:

- PR number;
- source SHA;
- exact Fast CI run ID;
- image build run ID;
- registry digest;
- immutable image reference;
- deployment run ID.

## Canonical preview assets

Operator-facing preview files:

- `compose.preview.yaml`;
- `.env.compose.preview.example`;
- local copied env file such as `.env.compose.preview.local`;
- `scripts/deploy-preview.ps1`;
- `scripts/stop-preview.ps1`.

Approved preview identity:

```text
Compose project: clariobase-crm-preview
Port:            3001
Database:        clariobase_crm_preview
URL:             https://clariobase-crm-preview.home.arpa:3001
Volume:          clariobase-crm-preview-postgres-data
Network:         clariobase-crm-preview-network
```

## Preview env contract

Copy `.env.compose.preview.example` to a local ignored file such as `.env.compose.preview.local` only for direct operator diagnostics.

Required preview values:

- `CRM_PRIVATE_BIND_ADDRESS=0.0.0.0`;
- `CRM_PRIVATE_HOSTNAME=clariobase-crm-preview.home.arpa`;
- `CRM_PRIVATE_HTTPS_PORT=3001`;
- `CRM_AUTH_RUNTIME_MODE=private-https`;
- `CRM_AUTH_TRUSTED_ORIGINS=https://clariobase-crm-preview.home.arpa:3001`;
- `BETTER_AUTH_URL=https://clariobase-crm-preview.home.arpa:3001`;
- `AI_EXCHANGE_HOST_PATH=./data/ai-exchange-preview`;
- `CRM_POSTGRES_DB=clariobase_crm_preview`;
- `CRM_POSTGRES_USER=clariobase_crm_preview_user`;
- `CRM_POSTGRES_PASSWORD=<local preview secret>`.

Rules:

- do not reuse production `.env.compose.local`;
- do not reuse the production AI exchange path `./data/ai-exchange`;
- do not point `CRM_DATABASE_URL` at `clariobase_crm`;
- keep preview secrets local or inject them through the workflow secret at runtime.

## Immutable deployment contract

The application image must match:

```text
ghcr.io/lukexd09/clariobase-ai-crm@sha256:<64 lowercase hex>
```

Preview deployment must never use `latest`, a branch name, or a mutable commit tag as the deployed reference.

The merged Compose model must remove the application build definition and keep:

```yaml
build: !reset null
pull_policy: never
```

Deployment behavior:

1. validate the preview env file and protected identifiers;
2. validate the merged Compose model and immutable image reference;
3. pull the exact digest before destructive replacement;
4. remove the previous `clariobase-crm-preview` stack only after the pull succeeds, preserving the preview database by default;
5. start a fresh preview PostgreSQL service;
6. run `prisma migrate deploy` from the pulled image with `--pull never`;
7. start the application from the same digest with `--no-build --pull never`;
8. verify `https://clariobase-crm-preview.home.arpa:3001/api/ready`;
9. clean temporary secrets and log out of GHCR.

Use `database_mode=reset` only when you intend to delete the preview database volume. The exact confirmation phrase is `RESET PREVIEW DATABASE`, and the reset is irreversible for preview data.

## Readiness contract

Preview is ready only when `/api/ready` returns HTTP 200 and:

```text
service = clariobase-ai-crm
status = ready
checks.database = ok
checks.authentication = ok
```

A responding process without a successful database check is not ready.

## Persistent PR status comment

One comment identified by `<!-- clariobase-preview-status -->` is updated through these states:

- `queued` — exact Fast CI correlation succeeded and release work is waiting or starting;
- `deploying` — the image was smoke-tested, pushed and resolved to an immutable digest;
- `ready` — Windows deployment, migration and readiness all passed;
- `blocked` — a policy or freshness gate rejected the request, including stale SHA;
- `failed` — eligible release execution started but build, push, migration, startup or readiness failed.

Each status contains:

- source mode;
- PR number;
- exact commit;
- branch;
- Fast CI run;
- image build run;
- deployment run;
- immutable image;
- preview URL;
- timestamp.

`blocked` means the release must not be retried unchanged. Resolve the stated policy condition first. `failed` means the selected SHA passed eligibility but release execution failed and requires log investigation. `ready` proves only the exact displayed SHA and digest.

## Trusted control-plane limitation

A PR that changes preview workflow, Compose or deployment control files is intentionally blocked from deploying those unmerged controls. Review and merge the infrastructure PR first, then run a separate post-merge rehearsal from trusted `main` against a safe same-repository rehearsal PR.

Do not treat a green Draft PR workflow as the final end-to-end proof for a new trusted release workflow.

## Retired workflows

`Auto Deploy Preview` and the old direct `Deploy Preview` path were removed from the repository.

They are no longer visible as manual GitHub Actions entrypoints and they must not return as active deployment paths.

The only preview deployment entrypoint is `Preview Release`.

The only preview cleanup entrypoint is `Stop Preview`.

Completed Fast CI runs must not trigger preview replacement automatically.

These removed paths must not:

- react to completed CI runs;
- use the Windows runner;
- build or publish images;
- accept a manually supplied image digest that bypasses exact Fast CI correlation.

## Stop preview

The safe preview stop entrypoint remains:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-preview.ps1 `
  -PreviewEnvFile .\.env.compose.preview.local
```

By default, Stop Preview preserves the preview database volume. If reset support is enabled for a manual cleanup, it must use the same `database_mode` and exact `RESET PREVIEW DATABASE` confirmation as Preview Release.

Stop behavior:

- validates the same preview guardrails;
- runs `docker compose down -v --remove-orphans` only for `clariobase-crm-preview`;
- removes only the approved preview containers, network and preview database volume;
- does not touch production `clariobase-crm`.

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

Production state is not an eligibility dependency. Safety comes from exact identities, isolated preview resources and narrowly scoped cleanup.

## Post-merge validation

After the trusted preview control-plane changes are merged to `main`, perform a manual rehearsal with `source_mode=main`:

1. confirm the `main` workflow dispatch uses the exact trusted SHA selected from `main`;
2. confirm the release passes only after the corresponding successful Full Integration run exists for that SHA;
3. confirm the summary shows `source_mode=main`, the exact SHA, database mode, image identity and deployment result;
4. confirm no PR comment API call occurs in `main` mode;
5. confirm the deployed preview still reports readiness at `https://clariobase-crm-preview.home.arpa:3001/api/ready`.

Use `source_mode=open_pr` for ordinary pre-merge preview testing and `source_mode=main` for the post-merge rehearsal of trusted control-plane changes.

## Application environment marker

The app itself shows a watermark-only `TEST` overlay whenever `CRM_DEPLOYMENT_ENV` is not the exact literal `production`. The overlay is decorative, `aria-hidden`, `pointer-events: none`, and intentionally subtle enough to remain usable at normal zoom and 200% zoom.

Preview operators should assume the repeated `TEST` marks will be visible in preview and other non-production runtimes, while exact raw `production` suppresses the overlay entirely.
Production deployments must explicitly set `CRM_DEPLOYMENT_ENV=production`.
The marker contract is server-side runtime configuration and must not use `NEXT_PUBLIC_*`.
