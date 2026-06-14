---
title: ADR E014 container runtime
document_id: ADR-E014-CONTAINER-RUNTIME
document_type: decision-record
status: accepted
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-14
related_epic: E014
related_tasks:
  - E014.T001
related_components:
  - COMP-CRM-APP
  - COMP-CRM-POSTGRES
related_documents:
  - docs/runtime/container-runtime.md
  - docs/04-ai-file-exchange.md
  - docs/11-harvester-integration-analysis.md
tags:
  - adr
  - runtime
  - docker
  - postgres
---

# ADR E014 container runtime

## Status

Accepted on 2026-06-14 for `E014.T001`.

## Decision statement

ClarioBase AI CRM will use a repository-local two-service Docker Compose topology as the default local production-like runtime:

```text
crm-app
crm-postgres
```

The runtime keeps a dedicated CRM PostgreSQL 16 database, uses localhost-only host binding by default, keeps `data/ai-exchange/` on the host through a bind mount, separates HTTP liveness from database readiness, and leaves future CRM + gatherer orchestration as a later server-level concern.

## Context

The repository already assumes:

- the CRM PostgreSQL database is the source of truth for CRM operational data;
- the CRM and harvester/gatherer databases stay separate;
- AI collaboration is file-based through `data/ai-exchange/`;
- the current app exposes `/health` but does not yet expose a database-aware readiness endpoint;
- the repository needs a stable local production-like runtime without jumping to public deployment or Kubernetes.

The main open architecture choice was whether the default first-run topology should use a repository-local PostgreSQL container or require an existing server-level PostgreSQL instance.

## Decision details

### Default topology

The default E014 runtime includes:

- `crm-app` for the Next.js CRM runtime;
- `crm-postgres` for CRM-only PostgreSQL 16.

This is the approved first-run path because it is self-contained, reviewable, and safest for validating the CRM runtime without coupling to other repositories or operator-managed shared infrastructure.

### Database ownership and separation

`crm-postgres` is owned only by the CRM runtime.

The CRM runtime:

- uses a CRM-specific database such as `clariobase_crm`;
- never connects to the harvester or gatherer database in the default E014 topology;
- keeps runtime credentials uncommitted;
- may support a later explicit override to an external PostgreSQL server without changing the default boundary rules.

### Host exposure and safety

The application listens internally on port `3000`.
Host exposure is controlled by Compose with:

- `CRM_BIND_ADDRESS=127.0.0.1`
- `CRM_HOST_PORT=3000`

This keeps the default runtime local-only.
LAN access is an explicit operator override and must not become the default.

### AI exchange data handling

`data/ai-exchange/` is runtime data, not image content.

The runtime keeps that workflow safe by:

- mounting a host path through `AI_EXCHANGE_HOST_PATH`;
- preserving manual access to the files outside the container;
- preventing export and import artifacts from being baked into the image.

### Readiness model

The runtime uses two separate signals:

- `/health` for HTTP liveness of the Next.js process;
- `/api/ready` for CRM database readiness.

`crm-postgres` health uses `pg_isready`.
This separation avoids the misleading pattern of treating a static page as database readiness.

### Persistence and backup

The default runtime uses a named Docker volume for CRM PostgreSQL persistence.
That volume protects data across normal restarts, but it is not a backup strategy.

## Alternatives considered

## Connect the CRM directly to an existing server-level PostgreSQL instance by default

Rejected as the default first-run path.

Reasons:

- increases the risk of mixing CRM data with other operator-managed infrastructure too early;
- makes the first verified runtime less self-contained;
- raises the chance of accidental mutations against the wrong database;
- weakens repeatable automated runtime verification.

This remains an allowed future override path, not the default.

## Use one combined CRM + gatherer Compose stack now

Rejected for E014.

Reasons:

- it couples two repositories before the CRM runtime contract is stable;
- it adds orchestration scope that is explicitly out of scope for E014;
- it makes database-boundary review and rollback harder.

## Keep running only the manual dev workflow

Rejected.

Reasons:

- does not provide restart behavior or production-like verification;
- does not give a stable operator runtime foundation for future scaling;
- does not create a reviewable image and Compose contract.

## Consequences

Positive consequences:

- the CRM gets a clear local production-like runtime foundation;
- runtime verification can be isolated and repeatable;
- CRM database ownership stays explicit;
- the manual AI file workflow stays compatible with containerization;
- future orchestration work has a stable boundary to build around.

Tradeoffs:

- the repository adds Docker and Compose maintenance surface;
- operators still need explicit backup procedures beyond Docker volume persistence;
- later external PostgreSQL override support must be documented carefully.

## Follow-up tasks

- `E014.T002` implements the production image.
- `E014.T003` implements the repository-local Compose runtime.
- `E014.T004` implements readiness, healthcheck wiring, and runtime verification.
- `E014.T005` writes the operator runbook and future orchestration guidance.

## Canonical references

- [CRM container runtime contract](../runtime/container-runtime.md)
- [AI file exchange contract](../04-ai-file-exchange.md)
- [Harvester integration analysis](../11-harvester-integration-analysis.md)
