# ADR E011: Better Auth Foundation

## Context

ClarioBase needs a self-hosted authentication foundation with Prisma 7, PostgreSQL, database-backed sessions, and no mandatory external auth runtime.

## Decision

Adopt Better Auth `1.6.23` with `@better-auth/prisma-adapter@1.6.23` for the proof boundary only.

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

## Verdict

This ADR supports the E011.T008 proof boundary, but it does not authorize production auth integration yet.
