# ADR E011: Better Auth Foundation

## Context

ClarioBase needs a self-hosted authentication foundation with Prisma 7, PostgreSQL, database-backed sessions, and no mandatory external auth runtime.

## Decision

Adopt Better Auth `1.6.23` with `@better-auth/prisma-adapter@1.6.23` for the proof boundary only.

## Schema Contract

- Canonical proof schema is a reviewed and checksummed repository snapshot.
- Canonical proof schema is validated by Prisma 7.
- Canonical proof schema is validated by executable Better Auth runtime proof.
- Canonical proof schema is the source of truth for E011 proof and later reviewed Prisma migration work.
- Better Auth CLI is an optional online diagnostic and regeneration helper.
- Better Auth CLI is not part of the accepted authentication runtime.
- Better Auth CLI is not part of the offline runtime recovery closure.
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

## Offline survivability

- Proven offline restore used retained package tarballs, a bundled pnpm runtime, and a bundled Prisma Schema Engine.
- Fresh offline source rebuild was not proven in this step.

## CLI Boundary

- Runtime authentication proof: PASS
- Prisma 7 and PostgreSQL proof: PASS
- Fresh offline dependency restore and proof: PASS
- Canonical snapshot conformance: PASS
- Raw Better Auth CLI schema equivalence: FAIL
- CLI accepted as canonical generator: NO
- Immutable image execution by digest: NOT YET EXECUTED
- Overall E011.T008 verdict: CHANGES REQUIRED
- CLI mismatch includes different model casing.
- CLI mismatch includes different `@@map` shape.
- CLI mismatch includes legacy `datasource url`.
- CLI mismatch includes a different schema shape.
- Runtime Better Auth writes `session.ipAddress` and `session.userAgent`.
- Therefore raw CLI output is not automatically accepted as migration source or canonical schema.

## Verdict

This ADR supports the E011.T008 proof boundary, but it does not authorize production auth integration yet.
