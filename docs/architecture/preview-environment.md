---
title: Preview environment contract
document_id: DOC-E016-PREVIEW-ENVIRONMENT
document_type: architecture
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-24
related_epic: E016
related_tasks:
  - E016.T001
  - E016.T009
related_components:
  - COMP-CRM-PREVIEW-APP
  - COMP-CRM-PREVIEW-POSTGRES
related_documents:
  - docs/decisions/adr-e016-manual-preview.md
  - docs/runtime/container-runtime.md
  - docs/operations/container-operations.md
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
It defines the approved preview topology, trust boundaries, production-protection rules, lifecycle, and operator-visible reporting rules for a single shared preview slot used by both manual and post-CI automatic deployments.

## Implemented and protected environments

The current CRM environments are:

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

Preview is one replaceable slot.
E016 does not implement one preview per PR and does not change production release behavior.

## Boundary model

The preview contract distinguishes three boundaries:

- development checkout and local test resources inside this repository;
- preview runtime deployed from a trusted repository ref into the dedicated preview slot;
- protected production runtime on `clariobase-crm`, which may be local, remote, or not yet deployed.

Preview must remain isolated from production by:

- Compose project identity;
- host port;
- PostgreSQL database name and persistent volume;
- Docker network;
- bind-mounted AI exchange host path;
- env-file contract and runtime secrets;
- cleanup scope.

Preview must never reuse production `.env.compose.local`, production AI exchange paths, production containers, or production database identifiers.
Preview deployment does not query production health and must not depend on production being reachable from the preview host.

## Approved preview topology

Preview keeps the same application shape as the E014 runtime:

```text
crm-app
crm-postgres
```

The approved preview-specific identity is:

- project name: `clariobase-crm-preview`;
- application URL: `http://Serwer:3001`;
- application bind port: `3001`;
- database name: `clariobase_crm_preview`;
- PostgreSQL host port: not published;
- AI exchange host path: preview-specific and separate from production.

Because Docker Compose namespaces containers, networks, and named volumes by project name, the preview stack must run with the explicit preview project identity instead of reusing the production project name.

## Trust boundaries for refs and execution

Preview deployment uses trusted control workflows only.

The trust contract is:

- only refs from `lukexd09/clariobase-ai-crm` may be deployed;
- forked pull request code must not execute on the self-hosted runner;
- manual workflow inputs must resolve to an exact commit SHA before deployment begins;
- automatic preview deployment must trigger only from the trusted `workflow_run` completion of `CI` after the workflow file exists on the default branch;
- automatic preview deployment must treat the completed CI run `head_sha` as the validated commit and must separately confirm through the GitHub API that the current PR head still matches that SHA;
- stale CI results must stop with `BLOCKED: stale validated SHA`;
- the resolved SHA must be reported back to the operator;
- preview jobs run code on the server and therefore require explicit runner and workflow documentation;
- preview deploy and stop operations must serialize access to the single preview slot.

`pull_request_target` is out of scope and must not be used to execute untrusted code.

## Production-protection invariants

Every preview script, workflow, and cleanup path must protect these exact production identifiers:

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

## Deployment lifecycle

The preview lifecycle is:

1. a manual operator selects a trusted repository ref or a successful same-repository PR CI run triggers the trusted auto-deploy workflow from `main`;
2. the workflow resolves the exact commit SHA that is allowed to deploy;
3. automatic deployment revalidates the live PR state before using the self-hosted runner and again immediately before deployment after any queue wait;
4. the deployment script validates all preview identifiers and guardrails;
5. preview runtime is built and replaced only inside the approved preview slot;
6. `prisma migrate deploy` runs only against the preview database;
7. readiness waits for `/api/ready` on preview only;
8. the workflow reports requested ref, resolved SHA, runtime identity, preview URL, and the current PR comment status;
9. stop or cleanup acts only on the approved preview scope.

## Failure-state contract

Failure behavior must be explicit:

- preview deployment failure must return `FAIL` or `BLOCKED`, never a hidden success;
- gate rejections must surface as explicit `SKIPPED` or `BLOCKED` summaries before the self-hosted runner is used;
- failed preview startup must not be represented as healthy before `/api/ready` returns HTTP `200`;
- cleanup after failure must stay within approved preview resources only;
- a preview failure must not stop, recreate, mutate, or query the production runtime;
- `SKIPPED` checks remain explicit and must not be reported as `PASS`.

## Workflow and reporting contract

Manual preview control is implemented through `workflow_dispatch`.
Automatic preview replacement is implemented through `workflow_run` for the `CI` workflow after merge to `main`.

The workflow contract must include:

- trusted ref input;
- exact resolved SHA reporting;
- preview URL reporting as `http://Serwer:3001`;
- shared preview concurrency group `clariobase-preview-slot` across manual deploy, auto deploy, and stop preview;
- least-privilege permissions;
- a single persistent PR status comment identified by `<!-- clariobase-preview-status -->`;
- environment-derived and PR-derived values must be passed into shells through step-level environment variables rather than direct inline interpolation inside `run:` bodies;
- job summaries that distinguish `PASS`, `FAIL`, `SKIPPED`, and `BLOCKED`.

## Bootstrap limitation

The preview workflows normally become available in the GitHub UI after the workflow files exist on the default branch.
This applies especially to the automatic `workflow_run` preview workflow, which cannot react to PR CI runs until its file is merged to `main`.

Pre-merge evidence may cover static workflow validation, scripts, tests, and documentation.
The following operator actions remain a post-merge manual gate:

1. register or confirm the repository-scoped runner;
2. run `Deploy Preview` from GitHub Actions;
3. verify `http://Serwer:3001` from another LAN device;
4. run `Stop Preview`.

These steps must not be claimed as completed before they actually run.

## Related canonical sources

- [ADR: E016 manual preview environment](../decisions/adr-e016-manual-preview.md)
- [E014 runtime contract](../runtime/container-runtime.md)
- [E014 operations runbook](../operations/container-operations.md)
