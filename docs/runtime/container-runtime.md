---
title: CRM container runtime contract
document_id: DOC-E014-CONTAINER-RUNTIME
document_type: architecture
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-14
related_epic: E014
related_tasks:
  - E014.T001
  - E014.T004
related_components:
  - COMP-CRM-APP
  - COMP-CRM-POSTGRES
related_documents:
  - docs/decisions/adr-e014-container-runtime.md
  - docs/runtime/container-image.md
  - docs/04-ai-file-exchange.md
  - docs/10-technical-stack-decision.md
  - docs/11-harvester-integration-analysis.md
  - README.md
tags:
  - runtime
  - docker
  - compose
  - postgres
  - readiness
---

# CRM container runtime contract

## Purpose of the E014 runtime contract

This document is the canonical runtime contract for `E014 - Add containerized local production runtime foundation`.
It defines the approved local production-like topology, boundary rules, environment-variable contract, port policy, persistence rules, AI exchange mount rules, and liveness/readiness semantics for ClarioBase AI CRM.

This document defines the target runtime that E014 tasks must implement.
It does not mean every runtime detail is already implemented in the repository at `E014.T001`.

## Current repository baseline before E014 implementation

Before E014 implementation is complete, the repository baseline is:

- the CRM app runs through the existing `pnpm dev`, `pnpm build`, and `pnpm start` workflows;
- `DATABASE_URL` points to a dedicated CRM PostgreSQL database;
- `/health` exists as the current HTTP liveness page;
- `/api/ready` does not exist yet;
- repository-local Docker image and Compose runtime files are not yet present;
- `data/ai-exchange/` remains a host-side local workflow directory.

The approved E014 tasks implement the target contract described below without changing the CRM/harvester database separation rule.

## Canonical local production-like topology

The default E014 topology is a repository-local Docker Compose stack with exactly two services:

```text
crm-app
crm-postgres
```

Component identifiers:

- `COMP-CRM-APP`: the Next.js CRM application runtime.
- `COMP-CRM-POSTGRES`: the dedicated PostgreSQL 16 service for CRM operational data only.

Default runtime flow:

```text
Host operator
  -> docker compose
  -> crm-app
  -> crm-postgres
```

The Compose stack is the default first-run topology for local production-like use.
An external server-level PostgreSQL instance may be added later as an explicit override path, but it is not the default contract for E014 first run.
The implemented repository-local Compose assets are `compose.yaml` and `.env.compose.example`.

## Service ownership and database separation contract

`crm-postgres` is dedicated exclusively to ClarioBase CRM.

The runtime contract is:

- the CRM connects only to the CRM PostgreSQL database;
- the CRM must never connect to or mutate the harvester or gatherer database as part of the default E014 runtime;
- the local production-like database name should be `clariobase_crm`;
- database credentials must stay runtime-only and uncommitted;
- later cross-repository orchestration may place CRM and gatherer in one server-level Compose project, but each system must keep its own database boundary.

This contract extends the existing repository rule that the CRM PostgreSQL database is the system of record for CRM operational data.

## Environment-variable contract

The approved runtime contract uses the following exact variables.

| Variable | Scope | Required | Meaning |
| --- | --- | --- | --- |
| `DATABASE_URL` | `crm-app` | yes | Prisma and app connection string for the dedicated CRM database. |
| `CRM_DATABASE_URL` | Compose override | no | Optional explicit Compose override for `DATABASE_URL`, used when credentials need URI encoding. |
| `CRM_BIND_ADDRESS` | Compose host binding | yes | Host interface for published HTTP access. Default: `127.0.0.1`. |
| `CRM_HOST_PORT` | Compose host binding | yes | Host port mapped to the CRM container. Default: `3000`. Test override: `3002`. |
| `AI_EXCHANGE_HOST_PATH` | Compose bind mount | yes | Host path mounted into the container so `data/ai-exchange/` stays host-accessible. |
| `CRM_POSTGRES_DB` | `crm-postgres` | yes | CRM-only database name. Recommended default: `clariobase_crm`. |
| `CRM_POSTGRES_USER` | `crm-postgres` | yes | CRM-only PostgreSQL username. |
| `CRM_POSTGRES_PASSWORD` | `crm-postgres` | yes | CRM-only PostgreSQL password. Runtime secret only. |

Supporting runtime rules:

- the internal application port is fixed at `3000`;
- `CRM_BIND_ADDRESS` and `CRM_HOST_PORT` control host exposure, not application code behavior;
- the default contract keeps PostgreSQL private to the Compose network instead of exposing it publicly;
- `compose.yaml` carries safe inline defaults for non-secret values, while `CRM_POSTGRES_PASSWORD` remains a required runtime secret supplied through the operator environment or a copied local env file;
- `CRM_DATABASE_URL` may override the derived DSN when the username, password, or database name must be URI-encoded explicitly;
- `.env.example` remains sanitized and may be used only for safe placeholders, not real runtime secrets.

## Network and port-binding policy

The canonical network policy is:

- inside the container, the CRM application listens on port `3000`;
- by default, the host publishes the CRM only on `127.0.0.1`;
- the default host port is `3000`;
- automated E014 verification should prefer `CRM_HOST_PORT=3002`;
- a LAN operator may intentionally override `CRM_BIND_ADDRESS=0.0.0.0`, but only for internal-network use;
- E014 must not add public internet exposure, TLS, reverse proxying, or cloud ingress.

`HOSTNAME` is not part of the default runtime contract.
If later testing proves a `HOSTNAME` override is technically required, that change must be justified by implementation evidence and documented explicitly.

## Runtime file and bind-mount contract for AI exchange

`data/ai-exchange/` stays part of the host workflow.
The runtime contract does not allow those files to be copied into the application image.

The approved mount model is:

```text
host path from AI_EXCHANGE_HOST_PATH
  -> bind mount
  -> /app/data/ai-exchange
```

Rules for `data/ai-exchange/`:

- the directory must remain host-accessible for the manual file-based ChatGPT workflow;
- the directory must be mounted at runtime instead of baked into the image;
- one-off Compose operator commands such as `docker compose run --rm crm-app node --env-file-if-exists=.env.local ./node_modules/tsx/dist/cli.mjs scripts/export-ai-leads.ts` must work against the mounted directory and the containerized CRM database without requiring a package-manager download at runtime;
- real lead exports and operator runtime files remain uncommitted;
- automated E014 verification uses an isolated disposable host path that is separate from the operator's real runtime files;
- E014 must preserve the current manual export -> review -> validate -> import workflow from [docs/04-ai-file-exchange.md](../04-ai-file-exchange.md).

## Persistence and backup semantics

The default E014 runtime persists PostgreSQL data through a named Docker volume attached to `crm-postgres`.

Persistence contract:

- the PostgreSQL volume exists to preserve CRM data across normal service restarts and host reboots;
- the PostgreSQL volume belongs only to the CRM runtime;
- persistence is not a backup strategy;
- backup and restore remain an explicit operator responsibility;
- later operator documentation must name safe backup and restore procedures clearly.

This contract prevents the common mistake of treating a named volume as disaster recovery.

## Health and readiness contract

The CRM runtime uses separate liveness and readiness signals.

### HTTP liveness contract for `/health`

`/health` is the HTTP liveness endpoint for `COMP-CRM-APP`.

`/health` semantics:

- returns HTTP `200` when the Next.js process can respond;
- does not prove database reachability;
- may remain a simple app-process response;
- must not be described as database readiness.

### Database readiness contract for `/api/ready`

`/api/ready` is the database-aware readiness endpoint for the CRM runtime.

`/api/ready` semantics:

- returns HTTP `200` only when the CRM application can execute a lightweight query against its configured CRM PostgreSQL database;
- the readiness query must depend on migrated CRM application schema so a pre-migration database remains not-ready;
- returns HTTP `503` when the configured CRM database is unavailable;
- must not expose credentials, raw connection strings, or sensitive infrastructure details;
- proves readiness for CRM application work, not just container startup.

### PostgreSQL service health contract

`crm-postgres` uses `pg_isready` as the container health signal.

The PostgreSQL service healthcheck is separate from the CRM app readiness endpoint.
Later E014 tasks wire the application service to depend on the database service without collapsing both signals into one ambiguous check.

### Compose app healthcheck contract

`crm-app` uses `/api/ready` as the Compose container healthcheck.

`crm-app` healthcheck semantics:

- reports healthy only when the Next.js process can serve requests and the configured CRM database is reachable;
- transitions to unhealthy when `/api/ready` returns HTTP `503`;
- does not replace the simpler `/health` liveness endpoint;
- is intended for local runtime verification and restart/failure behavior checks, not for public monitoring exposure.

## Automated runtime verification contract

The canonical repository-level runtime verification command is:

```bash
corepack pnpm docker:test-runtime
```

The verification command must cover:

- the approved first-run migration sequence;
- `/health` success and `/api/ready` success behavior;
- `/api/ready` failure behavior when the CRM database becomes unavailable;
- restart recovery and persistence on isolated disposable test resources;
- the containerized AI exchange workflow against a bind-mounted host path.

## Build and image contract

The runtime contract already fixes the following image-build rules for later E014 tasks:

- the image build must succeed from a clean checkout;
- Prisma Client must be generated during the image build;
- the build must not rely on `src/generated/` already existing in the working tree;
- real `.env` files must not enter the Docker build context;
- `data/ai-exchange/` runtime files must not enter the image;
- a sanitized safe placeholder may be used for build-time Prisma needs if required, but no real credentials may be committed.

These rules exist because `src/generated/` is ignored and cannot be assumed in a clean Docker context.

The implemented image-build details now live in [docs/runtime/container-image.md](container-image.md).

## Migration and startup-safety contract

The runtime contract for database changes is:

- do not run `prisma migrate dev` against a shared or operator-owned runtime database;
- isolated E014 verification may use a disposable database only;
- production-like startup must not silently mutate a real operator database on every container start unless a later reviewed design explicitly approves it;
- first-run schema setup must use a one-off operator-invoked `prisma migrate deploy` step against the dedicated CRM database;
- normal `crm-app` container startup must not rerun migrations automatically.

### Approved first-run migration sequence

The approved first-run schema path for the default two-service runtime is:

1. start `crm-postgres`;
2. wait for the `crm-postgres` healthcheck to pass;
3. run a one-off migration command from the `crm-app` image against the dedicated CRM database using `prisma migrate deploy`;
4. start `crm-app` for normal service;
5. treat `/api/ready` as not-ready until the one-off migration step succeeds and the CRM database can answer the readiness query.

This contract keeps the runtime at two long-lived services while avoiding automatic schema mutation on every application start.
Later E014 implementation tasks and operator documentation must expose the exact migration command and startup sequence in a way that follows this contract.

## Planned evolution after the default E014 runtime

The E014 runtime is intentionally limited.

Planned follow-up direction:

- a future server-level Compose project may orchestrate CRM and gatherer together;
- CRM and gatherer still keep separate databases, credentials, and failure domains;
- E014 does not introduce public exposure, reverse proxying, TLS termination, Kubernetes, or cloud deployment.

## Related canonical sources

- [ADR: E014 container runtime](../decisions/adr-e014-container-runtime.md)
- [AI file exchange contract](../04-ai-file-exchange.md)
- [Technical stack decision](../10-technical-stack-decision.md)
- [Harvester integration analysis](../11-harvester-integration-analysis.md)
