---
title: Better Auth dependency provenance and deferred offline implementation
document_id: DOC-E011-AUTH-DEPENDENCY-PROVENANCE
document_type: operations-reference
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-16
related_epic: E011
related_tasks:
  - E011.T008
  - E011.T013
  - E011.T014
related_issues:
  - 161
  - 200
tags:
  - auth
  - dependencies
  - provenance
  - historical-evidence
---

# Better Auth dependency provenance and deferred offline implementation

Full offline rebuild/restore is not an operated ClarioBase capability. Files described below are historical proof artifacts retained unchanged until separate issue `#200`; they are not operator recovery instructions and must not be run by T014.

## Retained artifacts

- exact root `package.json` and `pnpm-lock.yaml`
- integrity-addressed exact source archive, Dockerfile, checked-in migrations, and private HTTPS assets
- complete root pnpm store and `pnpm@9.15.0` runtime
- `better-auth@1.6.23` tarball
- `@better-auth/prisma-adapter@1.6.23` tarball
- `@better-auth/cli@1.4.21` tarball
- bundled `pnpm@9.15.0`
- bundled Prisma Schema Engine binary for the target platform
- Prisma engines for the accepted Linux target
- exact validated application image archive
- digest-pinned Caddy, PostgreSQL, and Node base image archives
- manifest and SHA-256 checksums for every retained file

## Historical implementation record

- T013 source dependency code was designed for `--network none`, an empty external cache, the root lockfile, and the supplied store.
- T013 exact-image restore code used internal disposable networks with fresh PostgreSQL and the accepted HTTPS ingress.
- The older proof workspace remains only a pinned diagnostic for the T008 schema boundary.
- Generated proof client output lives under a temporary directory only.
- The temporary proof root is removed in `finally`.

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

## Historical T008 proof record

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
- Raw CLI output is therefore not automatically accepted as migration source or canonical schema.

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

## Limits

- Historical source dependency restore, offline Prisma generation and exact-image restore code does not establish an operated capability.
- A rebuilt source image would not be the same immutable artifact and would require a new owner-approved validation gate.
- Emergency upstream forks remain owner-gated and are never part of the accepted runtime.
- See `docs/operations/private-https-auth-recovery.md` for supported CA handling, runtime rollback and secret continuity.
- Removal of unused offline files remains deferred to issue `#200`.
