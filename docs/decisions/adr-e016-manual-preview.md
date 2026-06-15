---
title: ADR E016 manual preview environment
document_id: ADR-E016-MANUAL-PREVIEW
document_type: decision-record
status: accepted
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-15
related_epic: E016
related_tasks:
  - E016.T001
related_components:
  - COMP-CRM-PREVIEW-APP
  - COMP-CRM-PREVIEW-POSTGRES
related_documents:
  - docs/architecture/preview-environment.md
  - docs/runtime/container-runtime.md
  - docs/operations/container-operations.md
tags:
  - adr
  - preview
  - deployment
  - security
  - runner
---

# ADR E016 manual preview environment

## Status

Accepted on 2026-06-15 for `E016.T001`.

## Decision statement

ClarioBase AI CRM will use one manually controlled preview slot deployed from a trusted repository ref into a dedicated runtime identity:

```text
Compose project: clariobase-crm-preview
Port:            3001
Database:        clariobase_crm_preview
URL:             http://Serwer:3001
```

Preview remains isolated from the protected production runtime `clariobase-crm`, runs through manual GitHub Actions workflows, and executes only trusted same-repository code on a documented self-hosted runner.

## Context

The repository already has:

- a reviewed E014 local production-like runtime;
- a protected production identity on `clariobase-crm`;
- a requirement to inspect a branch before merge to `main`;
- a need to avoid touching production data, ports, networks, volumes, env files, and AI exchange paths.

The main design choices were:

- whether preview should reuse the production runtime identity or a separate slot;
- whether preview should deploy automatically or only through a manual control path;
- whether self-hosted execution should accept arbitrary refs or only trusted repository refs.

## Decision details

### One replaceable preview slot

The first version uses one replaceable preview slot instead of per-PR environments.

Reasons:

- it keeps operational surface smaller;
- it reduces cleanup risk;
- it matches the current single-server operator model;
- it is enough to validate pre-merge runtime behavior.

### Separate runtime identity

Preview uses:

- a distinct Compose project name;
- a distinct application port;
- a distinct CRM database name;
- a distinct named volume namespace;
- a distinct Docker network namespace;
- a distinct AI exchange host path;
- a distinct preview env contract.

This prevents the preview slot from silently colliding with the protected E014 runtime.

### Manual deployment only

Preview is started and stopped through `workflow_dispatch`.

Reasons:

- preview jobs execute on a self-hosted server and must be deliberate;
- manual control reduces accidental runtime churn;
- operator confirmation is more appropriate than automatic deployment for a single shared slot.

### Trusted same-repository refs only

Preview accepts only trusted refs from `lukexd09/clariobase-ai-crm`.

Reasons:

- self-hosted jobs execute arbitrary repository code on the server;
- forked code must not gain this execution path;
- trusted-ref validation is simpler and safer than trying to sandbox untrusted code on the runner.

### Fail-closed cleanup

Preview cleanup must be narrow and explicit.

The approved model is:

- validate exact preview resource names before removal;
- reject production or unrelated names;
- avoid broad prune commands;
- report scoped cleanup success or failure clearly.

## Alternatives considered

## Reuse the production stack as the preview target

Rejected.

Reasons:

- creates unacceptable risk of downtime or data mutation;
- collapses preview and production evidence into one runtime;
- makes failure recovery and auditability worse.

## Create one preview per pull request

Rejected for E016.

Reasons:

- adds orchestration and cleanup complexity beyond the current operator model;
- increases runner, storage, and naming surface prematurely;
- is not necessary for the first safe preview milestone.

## Auto-deploy preview on every push

Rejected.

Reasons:

- broadens self-hosted execution without enough operator control;
- creates unnecessary churn for a single shared slot;
- makes concurrent slot management harder.

## Consequences

Positive consequences:

- preview and production have reviewable hard boundaries;
- one slot is easier to operate and troubleshoot;
- the exact ref and resolved SHA can be reported clearly;
- production protection rules are easier to test.

Tradeoffs:

- only one preview deployment may exist at a time;
- final GitHub UI workflow execution still needs a post-merge manual gate;
- self-hosted execution remains a meaningful trust boundary that must stay documented.

## Follow-up tasks

- `E016.T002` implements the preview runtime and deploy/stop scripts.
- `E016.T003` implements PR CI, workflow YAML, and the Windows runner operating model.
- `E016.T004` performs the integrated assurance audit and final Draft PR handoff.

## Canonical references

- [Manual preview environment contract](../architecture/preview-environment.md)
- [E014 runtime contract](../runtime/container-runtime.md)
- [E014 operations runbook](../operations/container-operations.md)
