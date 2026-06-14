---
title: CRM container orchestration boundaries
document_id: DOC-E014-CONTAINER-ORCHESTRATION
document_type: architecture
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-14
related_epic: E014
related_tasks:
  - E014.T005
related_components:
  - COMP-CRM-APP
  - COMP-CRM-POSTGRES
related_documents:
  - docs/runtime/container-runtime.md
  - docs/operations/container-operations.md
  - docs/decisions/adr-e014-container-runtime.md
  - docs/11-harvester-integration-analysis.md
tags:
  - architecture
  - orchestration
  - compose
  - boundaries
---

# CRM container orchestration boundaries

## Purpose

This document describes the future server-level orchestration direction around the implemented E014 CRM runtime without implementing that orchestration now.
It exists to keep the current CRM-only runtime explicit while documenting the boundaries for a later CRM + gatherer deployment.

## Current implemented runtime

The only implemented E014 runtime today is the repository-local CRM stack:

```text
crm-app
crm-postgres
```

Current facts:

- it is CRM-only;
- it keeps a dedicated CRM PostgreSQL database;
- it defaults to localhost host binding;
- it keeps `data/ai-exchange/` on the host via a bind mount;
- it does not orchestrate the gatherer or harvester runtime.

## Future orchestration direction

A future server-level Compose project may orchestrate CRM and gatherer side by side, but that future stack must preserve the following boundaries.

### Repository boundary

- `clariobase-ai-crm` remains the CRM repository and the owner of CRM runtime behavior;
- gatherer/harvester stays in its own repository and keeps its own lifecycle;
- E014 does not merge repositories or compose files today.

### Database boundary

CRM and gatherer keep separate databases.

- CRM keeps its own dedicated database;
- gatherer keeps its own dedicated database;
- credentials remain separate;
- no shared schema is introduced;
- no direct cross-database writes are introduced by default orchestration.

### Network and exposure boundary

- CRM may later sit in a broader server-level network, but localhost-first behavior remains the current default;
- any LAN or wider exposure remains an explicit operator choice;
- E014 does not define public ingress, TLS termination, reverse proxying, or SaaS-style operations.

### File exchange boundary

- `data/ai-exchange/` remains a CRM-owned host path;
- gatherer orchestration must not take ownership of CRM runtime exports;
- manual export -> review -> validate -> import remains a CRM-local workflow.

## External PostgreSQL override direction

Future server-level orchestration may choose to replace `crm-postgres` with an external PostgreSQL instance, but only under these rules:

- the external instance still contains a dedicated CRM-only database;
- the CRM connection string stays explicit through `CRM_DATABASE_URL` or `DATABASE_URL`;
- migrations remain operator-invoked and reviewed;
- gatherer does not reuse the CRM schema or credentials;
- the override is documented as an explicit operator decision, not as a silent default.

## Current limitations

Current E014 limitations remain intentional:

- no combined CRM + gatherer Compose project is implemented here;
- no server-level reverse proxy or ingress document is included;
- no Kubernetes or cloud deployment guidance is included;
- no public observability or monitoring platform integration is included.

## Follow-up contract for future work

Any future orchestration work should preserve these invariants:

- CRM readiness remains tied to CRM database availability and migrated CRM schema;
- CRM operational data must remain recoverable without depending on gatherer runtime state;
- restart or failure of gatherer must not implicitly mutate or corrupt CRM runtime state;
- the current operator runbook in [docs/operations/container-operations.md](../operations/container-operations.md) remains valid for the standalone CRM runtime even if a future combined deployment also exists.
