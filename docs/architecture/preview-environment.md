---
title: Preview environment contract
document_id: DOC-E016-PREVIEW-ENVIRONMENT
document_type: architecture
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-26
related_epic: E016
related_tasks:
  - E016.T001
  - E016.T009
  - E016.T012
related_components:
  - COMP-CRM-PREVIEW-APP
  - COMP-CRM-PREVIEW-POSTGRES
related_documents:
  - docs/decisions/adr-e016-manual-preview.md
  - docs/runtime/container-runtime.md
  - docs/operations/container-operations.md
  - docs/operations/preview-operations.md
  - README.md
tags:
  - preview
  - deployment
  - github-actions
  - runner
  - safety
---

# Preview environment contract

## Purpose

This document is the canonical architecture contract for `E016 - Add manual branch preview environment and CI foundation`.
It defines one shared preview slot, its trust boundaries, immutable image provenance, production-protection rules and the separation between Fast CI, Full Integration and on-demand Preview Release.

## Implemented and protected environments

```text
Production
  Compose project: clariobase-crm
  Port:            implementation-specific
  Database:        clariobase_crm
  URL:             implementation-specific

Preview
  Compose project: clariobase-crm-preview
  Port:            3001
  Database:        clariobase_crm_preview
  URL:             http://Serwer:3001
```

Preview is one replaceable slot. E016 does not implement one environment per PR and does not change production release behavior.

## Validation and release boundaries

The repository separates three concerns:

```text
Fast CI
  exact PR head validation and fast application feedback

Full Integration
  Docker, Compose, workflow, backup/restore and preview-runtime verification

Preview Release
  intentional build, publication and deployment of one exact successful Fast CI SHA
```

A successful Fast CI run is evidence that a source SHA passed the fast gate. It is not an instruction to deploy.

Full Integration is conditional for pull requests, always available manually, and runs on `main`. Its result does not replace the exact successful Fast CI requirement for Preview Release.

Preview Release is initiated only by `workflow_dispatch` with a PR number and optional expected SHA.

## Environment boundary model

The preview contract distinguishes:

- development checkout and disposable local test resources;
- trusted GitHub-hosted control and image-build jobs;
- source from the exact validated same-repository PR head;
- trusted control checkout from `main` on the Windows runner;
- the dedicated preview runtime;
- protected production runtime, which may be local, remote or not yet deployed.

Preview must remain isolated from production by:

- Compose project identity;
- host port;
- PostgreSQL database name and persistent volume;
- Docker network;
- bind-mounted AI exchange host path;
- env-file contract and runtime secrets;
- cleanup scope.

## Deployment environment marker

The application reads `CRM_DEPLOYMENT_ENV` as a server-side runtime value.

- Only the exact literal `CRM_DEPLOYMENT_ENV=production` hides the in-app environment marker.
- `CRM_DEPLOYMENT_ENV=preview` shows the in-app repeated `TEST` watermark pattern.
- missing, empty, padded, differently cased, invalid or unsupported values fail safe and show the watermark pattern.

The owner-approved preview UX is watermark-only: no top banner, no layout shift, no interactive affordance and no exact-production suppression except for the raw literal `production`.
Preview operators should expect subtle repeated `TEST` watermarks before doing destructive or manual testing.
Production deployment must explicitly declare `CRM_DEPLOYMENT_ENV=production`.
Do not use `NEXT_PUBLIC_*` for this contract.

Preview must never reuse production `.env.compose.local`, production AI exchange paths, production containers or production database identifiers.
Preview deployment does not query production health and must not depend on production being reachable from the preview host.

## Approved preview topology

Preview keeps the E014 runtime shape:

```text
crm-app
crm-postgres
```

Approved preview identity:

- project name: `clariobase-crm-preview`;
- application URL: `http://Serwer:3001`;
- application bind port: `3001`;
- database name: `clariobase_crm_preview`;
- PostgreSQL host port: not published;
- AI exchange host path: preview-specific and separate from production.

## Trust contract

Only a trusted repository ref from `lukexd09/clariobase-ai-crm` may supply application source.
Forked pull request code must never execute on the self-hosted runner.

The release control contract is:

1. Preview Release must be dispatched from workflow code on `main`;
2. the input PR must be open and same-repository;
3. the workflow resolves the live current PR head SHA;
4. optional `expected_sha` must match that live head;
5. the selected `CI` workflow run must be completed successfully for that exact SHA;
6. its `auto-preview-context` artifact must match repository, PR, branch, SHA and CI run ID;
7. a stale successful run for an older SHA must be rejected as `BLOCKED`;
8. protected preview control-plane changes must first be reviewed and merged to `main`;
9. the source SHA is revalidated against the live PR again on the Windows runner;
10. preview deploy and stop operations serialize access through `clariobase-preview-slot`.

`pull_request_target` must not be used to execute untrusted code.

## Immutable image provenance

The trusted Linux build job checks out the exact validated source SHA and builds exactly one `linux/amd64` image.

The image is:

1. built locally through Buildx;
2. smoke-tested before registry authentication;
3. pushed as the already-tested image;
4. resolved to exactly one registry digest from the push output;
5. represented for deployment only as:

```text
ghcr.io/lukexd09/clariobase-ai-crm@sha256:<64 lowercase hex>
```

The metadata artifact binds:

- PR number;
- source SHA;
- exact Fast CI run ID;
- image build run ID;
- registry digest;
- immutable image reference;
- deployment run ID.

Build cache may reuse layers but must never become the source of provenance or replace exact SHA and registry digest validation.

## Windows deployment contract

The Windows runner checks out only trusted control files from `main`.
It does not check out PR application source and does not build the application image locally.

Required order:

1. revalidate open PR, same repository and exact current head SHA;
2. validate the source-SHA-to-image handoff;
3. authenticate to GHCR with the workflow token;
4. validate the merged Compose model;
5. pull the exact immutable digest before destructive replacement;
6. remove the old preview stack only after pull succeeds, preserving the preview database by default;
7. start preview PostgreSQL;
8. run `prisma migrate deploy` with `--pull never`;
9. start `crm-app` with `--no-build --pull never`;
10. verify readiness;
11. clean temporary secrets and artifacts;
12. log out of GHCR.

Routine Preview Release and routine Stop Preview both preserve the preview database volume unless the operator explicitly selects `database_mode=reset` and confirms `RESET PREVIEW DATABASE`.

The application Compose override must retain:

```yaml
build: !reset null
pull_policy: never
```

## Readiness contract

Deployment succeeds only when `/api/ready` returns HTTP 200 and:

```text
service = clariobase-ai-crm
status = ready
checks.database = ok
```

## Production-protection invariants

Every preview script, workflow and cleanup path must protect:

```text
clariobase-crm
port 3000
clariobase_crm
.env.compose.local
production CRM PostgreSQL volume
production AI exchange host path
```

Preview control logic must fail closed when any resolved value collides with a protected identifier.

The following broad cleanup commands are prohibited:

```text
docker system prune
docker volume prune
docker network prune
```

## Reporting contract

One persistent PR comment identified by `<!-- clariobase-preview-status -->` must distinguish:

- `queued`;
- `deploying`;
- `ready`;
- `failed`;
- `blocked`.

Every state reports the PR, exact commit, branch, Fast CI run, image build run, deployment run, immutable image, preview URL and timestamp.

A runner-side stale SHA is `blocked`, not a generic deployment failure.

## Retired automatic and direct paths

Completed Fast CI runs must not trigger preview replacement automatically.
The old automatic `workflow_run` deployment and the direct manually supplied image path were removed from the repository and must stay removed.

This prevents:

- unnecessary Windows execution for every commit;
- image publication during ordinary iteration;
- deployment of a manually supplied digest without exact Fast CI correlation.

## Bootstrap and rehearsal limitation

The trusted Preview Release workflow becomes authoritative only after its reviewed workflow and control changes exist on the default branch.

Pre-merge evidence may prove:

- static workflow and permission contracts;
- test-suite classification;
- Fast CI cancellation and absence of automatic deployment;
- Full Integration selection;
- resolver and immutable handoff regression tests.

The final end-to-end exercise is a post-merge manual gate:

1. keep the implementation issue open;
2. use a safe same-repository rehearsal PR that does not modify protected control-plane files;
3. obtain successful Fast CI for its exact current head SHA;
4. dispatch Preview Release from `main`;
5. record CI run ID, source SHA, immutable digest, Windows deployment and readiness evidence;
6. run Stop Preview if the slot should be cleared.

These results must not be claimed before they actually run.

## Related canonical sources

- [Preview operations runbook](../operations/preview-operations.md)
- [ADR: E016 manual preview environment](../decisions/adr-e016-manual-preview.md)
- [E014 runtime contract](../runtime/container-runtime.md)
- [E014 operations runbook](../operations/container-operations.md)
