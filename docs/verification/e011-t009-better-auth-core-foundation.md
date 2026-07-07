# E011.T009 Better Auth Core Foundation

## Scope

- Exact runtime packages: `better-auth@1.6.23`, `@better-auth/prisma-adapter@1.6.23`
- Canonical schema source: reviewed repository schema snapshot plus Prisma migration lifecycle
- Raw Better Auth CLI output remains non-canonical

## Implemented boundary

- Server auth factory: `src/lib/auth.ts`
- Next.js route boundary: `src/app/api/auth/[...all]/route.ts`
- Prisma schema foundation: `prisma/schema.prisma`
- Migration foundation: `prisma/migrations/20260706130000_better_auth_core_foundation/migration.sql`

## Environment contract

- `BETTER_AUTH_URL` is required
- `BETTER_AUTH_SECRET` is required
- Missing or malformed secret/base URL values fail safely in the auth factory
- No Better Auth Infrastructure key is used

## Proof command

- `corepack pnpm e011:t009:proof`

## Verification result

- `corepack pnpm e011:t009:proof`: PASS
- `corepack pnpm test:infra`: PASS
- `corepack pnpm prisma:validate`: PASS
- `corepack pnpm prisma:generate`: PASS
- `corepack pnpm lint`: PASS
- `corepack pnpm test:fast`: PASS
- `corepack pnpm build`: PASS
- `git diff --check`: PASS
- GitHub CI: PASS
- GitHub Full Integration: PASS

## Residual risks

- The auth factory intentionally disables public signup, so the proof must continue to verify that closed behavior remains intact.
