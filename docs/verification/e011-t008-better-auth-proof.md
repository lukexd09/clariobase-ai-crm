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

## Evidence

- Base branch SHA: not recorded here
- Checkpoint SHA: `4cf4a7e437adb07fe7659122d9106a14a70ea136`
- Helper commit SHA: `d858a210019dfccc89d0b7c609d70085b8d55425`
- Canonical schema SHA-256: `571066657A4FF8E99A7D9F2322B28C54ABCA3C24965B8010E16F977AC38D6FD0`
- Regenerated schema SHA-256: `3B7CA6EF0DD9E05041076D73E526A59820657FA83B6D012E9DD6CA2577F0C52E`
- CLI version: `@better-auth/cli@1.4.21`
- Better Auth version: `better-auth@1.6.23`
- proof image ID: `sha256:550a5aad9edc343abf28453a937c52564ea9acf0389e4c09f43f47b341c216ed`
- restored image ID: `sha256:550a5aad9edc343abf28453a937c52564ea9acf0389e4c09f43f47b341c216ed`
- image archive SHA-256: `0C99A22C6846419D9216867738381DD76C4F000F29DA0D3888E68009B9C7A086`
- helper git hash-object: `6bde79aad3976f0f66d88b93f49216c00a382baa`
- helper SHA-256: `832F5FEC4E6F092AF59A12A4E86C3B59811A53B72934EB01C983D70CD1C47FD1`

## Schema diff summary

- Snapshot is a reviewed and checksummed Prisma 7 proof schema.
- Regenerated CLI output uses `User`, `Session`, `Account`, `Verification`.
- Regenerated CLI output includes legacy `datasource url = env("DATABASE_URL")`.
- Regenerated CLI output uses a different `@@map` shape.
- Regenerated CLI output has a different schema shape and model casing.
- Runtime Better Auth writes `session.ipAddress` and `session.userAgent`.
- The raw CLI output is not automatically accepted as migration source or canonical schema.

## Final Contract

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
- Technical proof verdict: GO
- Task workflow status: not complete until PR and independent review

## Verdict

- Overall E011.T008 technical proof verdict: GO
- Task workflow status: not complete until PR and independent review
