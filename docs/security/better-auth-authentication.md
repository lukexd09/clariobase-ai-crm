# Better Auth Authentication

- Exact proof version: `better-auth@1.6.23`
- Adapter: `@better-auth/prisma-adapter@1.6.23`
- Helper CLI used for schema regeneration diagnostics: `@better-auth/cli@1.4.21`

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

## Runtime contract

- Better Auth is self-hosted inside ClarioBase.
- No Better Auth-operated runtime service is required.
- `@better-auth/infra` is not installed or required.
- Telemetry is disabled in the proof harness.
- Public registration is disabled in the proof runtime.
- Organization plugin is not enabled.

## Session and credential ownership

- Password hashing and verification are owned by Better Auth.
- Session records are database-backed.
- Server-side session validation uses the proof database connection directly.
- Logout / revoke invalidates the existing session.

## Cookie and origin policy

- Session cookies are captured from server headers and not logged with values.
- Trusted origins are explicitly set in the proof runtime.
- Origin and redirect protection remain enabled.

## CLI Boundary

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
- For that reason, raw CLI output is not automatically accepted as migration source or canonical schema.

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

## Known limitations

- The proof harness is isolated and is not the production CRM auth flow.
- The proof schema is a reviewable snapshot for E011.T008 only.
- Offline source rebuild was not proven here; only the offline restore path was proven.
