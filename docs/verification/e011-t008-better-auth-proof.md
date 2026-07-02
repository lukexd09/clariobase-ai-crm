# E011.T008 Better Auth Proof

## Results

- Fresh offline dependency install: PASS
- Local bundled Prisma Schema Engine: PASS
- Offline Prisma validation: PASS
- Offline Prisma Client generation: PASS
- Offline db push: PASS
- Fresh offline runtime authentication proof: PASS
- Organization schema exclusion: PASS
- Better Auth Infrastructure exclusion: PASS
- Online schema regeneration equivalence: FAIL
- Immutable image execution by digest: NOT YET EXECUTED

## Evidence

- Base branch SHA: not recorded here
- Checkpoint SHA: pending commit
- Canonical schema SHA-256: `571066657A4FF8E99A7D9F2322B28C54ABCA3C24965B8010E16F977AC38D6FD0`
- Regenerated schema SHA-256: `3B7CA6EF0DD9E05041076D73E526A59820657FA83B6D012E9DD6CA2577F0C52E`
- CLI version: `@better-auth/cli@1.4.21`
- Better Auth version: `better-auth@1.6.23`

## Schema diff summary

- Snapshot is a lowercase, reviewable Prisma 7 proof schema.
- Regenerated CLI output uses `User`, `Session`, `Account`, `Verification`.
- Regenerated CLI output includes legacy `datasource url = env("DATABASE_URL")`.
- Regenerated CLI output maps table names with `@@map`.
- The semantic shape is not identical to the proof snapshot.

## Verdict

- Overall E011.T008 verdict: CHANGES REQUIRED
