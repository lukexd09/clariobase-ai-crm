# E011.T009 Better Auth Core Foundation

## Scope

- Exact runtime packages: `better-auth@1.6.23`, `@better-auth/prisma-adapter@1.6.23`
- Canonical schema source: reviewed repository schema snapshot plus Prisma migration lifecycle
- Raw Better Auth CLI output remains non-canonical

## Implemented boundary

- Server auth factory: [src/lib/auth.ts](/C:/Serwer/Projekty/Clariobase/clariobase-ai-crm/src/lib/auth.ts)
- Next.js route boundary: [src/app/api/auth/[...all]/route.ts](/C:/Serwer/Projekty/Clariobase/clariobase-ai-crm/src/app/api/auth/%5B...all%5D/route.ts)
- Prisma schema foundation: [prisma/schema.prisma](/C:/Serwer/Projekty/Clariobase/clariobase-ai-crm/prisma/schema.prisma)
- Migration foundation: [prisma/migrations/20260706130000_better_auth_core_foundation/migration.sql](/C:/Serwer/Projekty/Clariobase/clariobase-ai-crm/prisma/migrations/20260706130000_better_auth_core_foundation/migration.sql)

## Environment contract

- `BETTER_AUTH_URL` is required
- `BETTER_AUTH_SECRET` is required
- Missing or malformed secret/base URL values fail safely in the auth factory
- No Better Auth Infrastructure key is used

## Proof command

- `corepack pnpm e011:t009:proof`

## Residual risks

- The proof harness still needs to be executed against disposable PostgreSQL to confirm the full record-creation and restart semantics.
- The auth factory intentionally disables public signup, so the proof must continue to verify that closed behavior remains intact.
