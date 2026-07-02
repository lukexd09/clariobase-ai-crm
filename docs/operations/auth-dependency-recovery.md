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

## Limits

- This documents the proven offline restore path only.
- Fresh offline rebuild from source remains a separate recovery exercise.
- Immutable image recovery is deferred.
