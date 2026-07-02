# Auth Dependency Recovery

## Retained artifacts

- `better-auth@1.6.23` tarball
- `@better-auth/prisma-adapter@1.6.23` tarball
- `@better-auth/cli@1.4.21` tarball
- bundled `pnpm@9.15.0`
- bundled Prisma Schema Engine binary for the target platform
- recovery workspace lockfile
- proof schema snapshot

## Recovery contract

- Offline restore runs in a disposable container network with disposable PostgreSQL.
- The proof workspace installs from the bundled store and retained tarballs.
- Generated proof client output lives under a temporary directory only.
- The temporary proof root is removed in `finally`.

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
- Raw CLI output is therefore not automatically accepted as migration source or canonical schema.

## Limits

- This documents the proven offline restore path only.
- Fresh offline rebuild from source remains a separate recovery exercise.
- Immutable image recovery is deferred.
