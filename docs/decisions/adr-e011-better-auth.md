---
title: ADR E011 Better Auth foundation
document_id: ADR-E011-BETTER-AUTH
document_type: architecture-decision
status: accepted
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-16
related_epic: E011
related_issues:
  - 56
  - 161
  - 200
tags:
  - adr
  - auth
  - better-auth
  - prisma
---

# ADR E011: Better Auth Foundation

## Context

ClarioBase needs a self-hosted authentication foundation with Prisma 7, PostgreSQL, database-backed sessions, and no mandatory external auth runtime.

## Decision

Adopt MIT-licensed Better Auth `1.6.23` with `@better-auth/prisma-adapter@1.6.23` for the self-hosted ClarioBase authentication foundation.

## Schema Contract

- Canonical proof schema is a reviewed and checksummed repository snapshot.
- Canonical proof schema is validated by Prisma 7.
- Canonical proof schema is validated by executable Better Auth runtime proof.
- Canonical proof schema is the source of truth for E011 proof and later reviewed Prisma migration work.
- Better Auth CLI is an optional online diagnostic and regeneration helper.
- Better Auth CLI is not part of the accepted authentication runtime.
- Better Auth CLI is not part of any accepted operated recovery path.
- Better Auth CLI is not accepted as an unmodified canonical Prisma 7 schema generator.
- Schema lifecycle is owned by ClarioBase and Prisma migrations.

## Reuse analysis

- Better Auth: selected for core auth/session behavior.
- Auth.js: not selected for this proof boundary.
- SuperTokens: not selected.
- Keycloak: not selected.
- Custom auth: rejected because it would increase ClarioBase-owned auth surface.

## Consequences

- ClarioBase keeps the auth runtime self-hosted.
- Better Auth Infrastructure remains excluded.
- The organization plugin remains deferred.
- The proof schema stays small and reviewable.

## Historical offline implementation decision

- Full offline rebuild/restore is not an operated ClarioBase capability or E011 acceptance requirement.
- Historical proof artifacts remain unchanged until separate issue `#200` removes them with owner approval.
- T014 must not run, extend or repair the offline path.

## Historical T008 CLI boundary

- Runtime authentication proof: PASS
- Prisma 7 and PostgreSQL proof: PASS
- Fresh offline dependency restore and proof: PASS
- Canonical snapshot conformance: PASS
- Raw Better Auth CLI schema equivalence: FAIL
- CLI accepted as canonical generator: NO
- Immutable proof image build: PASS
- Immutable image execution by content identifier: PASS
- Image archive checksum verification: PASS
- Image removal and restore: PASS
- Restored immutable image execution: PASS
- External network isolation: PASS
- Secret scan: PASS
- Cleanup: PASS
- Overall E011.T008 technical proof verdict: GO
- CLI mismatch includes different model casing.
- CLI mismatch includes different `@@map` shape.
- CLI mismatch includes legacy `datasource url`.
- CLI mismatch includes a different schema shape.
- Runtime Better Auth writes `session.ipAddress` and `session.userAgent`.
- Therefore raw CLI output is not automatically accepted as migration source or canonical schema.

## Final proof evidence

- helper commit: `d858a210019dfccc89d0b7c609d70085b8d55425`
- proof image ID: `sha256:550a5aad9edc343abf28453a937c52564ea9acf0389e4c09f43f47b341c216ed`
- restored image ID: `sha256:550a5aad9edc343abf28453a937c52564ea9acf0389e4c09f43f47b341c216ed`
- image archive SHA-256: `0C99A22C6846419D9216867738381DD76C4F000F29DA0D3888E68009B9C7A086`
- helper git hash-object: `6bde79aad3976f0f66d88b93f49216c00a382baa`
- helper SHA-256: `832F5FEC4E6F092AF59A12A4E86C3B59811A53B72934EB01C983D70CD1C47FD1`
- tsc: PASS
- prisma:validate: PASS
- lint: PASS
- git diff --check: PASS
- working tree after helper commit: clean
- Docker resources after proof: no remaining E011 proof containers, networks or volumes

## Verdict

This ADR accepts the self-hosted E011 authentication foundation. It does not authorize public exposure, managed Better Auth Infrastructure, dependency upgrades or full offline rebuild/restore.
