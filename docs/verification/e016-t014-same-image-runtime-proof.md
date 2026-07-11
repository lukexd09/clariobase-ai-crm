---
title: E016.T014 same-image environment runtime proof
document_id: DOC-E016-T014-SAME-IMAGE-RUNTIME-PROOF
document_type: verification-report
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-11
related_epic: E016
related_tasks:
  - E016.T014
related_documents:
  - docs/architecture/preview-environment.md
  - docs/operations/preview-operations.md
tags:
  - verification
  - docker
  - runtime
  - preview
  - environment
---

# E016.T014 same-image environment runtime proof

## Result

Result: `PASS`

The executable repository-owned proof built one application image and reused its content-addressed image ID for four disposable production-server starts. Each case crossed the container runtime environment, Next.js server rendering, and returned `/health` HTML. No Compose operator stack, production service, or production database was used.

## Source and image identity

- Source Git SHA: `9a6fcaa1fb5484f2bf12d3dac6d280def8f8c6d4`
- Proof commit SHA: `9a6fcaa1fb5484f2bf12d3dac6d280def8f8c6d4`
- Proof command: `corepack pnpm docker:test-environment-runtime`
- Image build command: `docker build --target runtime --tag clariobase-ai-crm:test-verify-clariobase-e014-runtime-env-proof-11236-1783773211791 --label io.clariobase.source-sha=9a6fcaa1fb5484f2bf12d3dac6d280def8f8c6d4 .`
- Build start: `2026-07-11T12:33:31.964Z`
- Build completion: `2026-07-11T12:33:47.631Z`
- Dockerfile: `./Dockerfile`
- Build target: `runtime`
- Image tag: `clariobase-ai-crm:test-verify-clariobase-e014-runtime-env-proof-11236-1783773211791` (reference only)
- Image ID: `sha256:55dcaba94ebf351143d791fdc79bf4560cdb1a12e3a05d086175000ec0c091bf`
- Image digest: `clariobase-ai-crm@sha256:55dcaba94ebf351143d791fdc79bf4560cdb1a12e3a05d086175000ec0c091bf`
- Build count: `1`

The script recorded the tag-to-ID mapping immediately after the build, inspected both the tag and immutable ID before migration, inspected both again before every runtime case, and repeated the checks after all cases. Every migration and application `docker run` used the recorded image ID, not the tag. The script failed if the tag drifted, the ID became unavailable, a container reported another image ID, or the build count differed from one.

## Disposable runtime identity

- Network: `clariobase-e014-runtime-env-proof-11236-1783773211791-network`
- PostgreSQL container: `clariobase-e014-runtime-env-proof-11236-1783773211791-db`
- PostgreSQL container ID: `17364b63ae0efccddd62f419664c0763736220cb67d1bf32d82ad78434e334d2`
- Database: `clariobase_crm_environment_proof`
- Database volume: `clariobase-e014-runtime-env-proof-11236-1783773211791-postgres-data`
- Database image: `postgres:16`
- Published database ports: none

The database password was randomly generated for this disposable run, was never printed, and was destroyed with the database container and volume. Migrations ran once from the exact application image ID on the isolated network.

## Runtime cases

| Case | Container | Port | Runtime value | Readiness | Banner | Watermark | Image ID match |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Preview | `clariobase-e014-runtime-env-proof-11236-1783773211791-preview` | `62527` | `preview` | HTTP 200, `status=ready`, `database=ok` | present | present | true |
| Production | `clariobase-e014-runtime-env-proof-11236-1783773211791-production` | `62534` | `production` | HTTP 200, `status=ready`, `database=ok` | absent | absent | true |
| Missing | `clariobase-e014-runtime-env-proof-11236-1783773211791-missing` | `62540` | omitted | HTTP 200, `status=ready`, `database=ok` | present | present | true |
| Invalid | `clariobase-e014-runtime-env-proof-11236-1783773211791-invalid` | `62546` | `prod` | HTTP 200, `status=ready`, `database=ok` | present | present | true |

For every case, the verifier confirmed the host port belonged to the named container, waited deterministically for `/api/ready`, fetched dynamic server-rendered `/health` HTML, required the `Health check` route fingerprint, and asserted the exact warning-banner text plus the structural `aria-hidden` `TEST` watermark. The production case required both markers to be absent. The missing case inspected the container environment and required `CRM_DEPLOYMENT_ENV` to be truly omitted.

## Cleanup evidence

Cleanup result: `PASS`

The shared cleanup controller registered every application container, the PostgreSQL container, network, named database volume, and disposable image tag before use. It ran on success, exceptions, process exit, `SIGINT`, and `SIGTERM`. After the successful run, exact-name inspections confirmed that all disposable containers, the network, the database volume, and the image tag were absent. No broad prune or production-scoped cleanup command was used.

## Verification history

Required local verification before the proof-code commit:

- `corepack pnpm tsx --test tests/preview-environment-config.test.ts` — `PASS`
- `corepack pnpm tsx --test tests/deployment-env.test.ts` — `PASS`
- `corepack pnpm tsx --test tests/environment-indicator.test.tsx` — `PASS`
- `corepack pnpm test:fast` — `PASS`, 80 tests
- `corepack pnpm test:infra` — `PASS`, 76 tests
- `corepack pnpm prisma:validate` — `PASS`
- `corepack pnpm prisma:generate` — `PASS`
- `corepack pnpm lint` — `PASS`
- `corepack pnpm build` — `PASS`
- `git diff --check` — `PASS`

The first runtime-proof attempt failed deterministically before the four cases. Its generated database container name was 64 characters, exceeding the 63-character Docker DNS-label boundary, so the migration container could not reach PostgreSQL by name even though `pg_isready` passed inside the database container. The correction shortened the disposable scope and added an executable length assertion. The focused proof contract, suite-classification test, and lint passed after correction. The corrected proof run then returned `PASS` with build count one and all four cases successful.

The earlier branch history also records the initial fast-suite classification failure and correction in commit `b73de4b88ada68493cd97acdd91ec0ca8e4df6c1` (`E016.T014 fix fast-test regression`).

## Secret and local-path review

- The proof output contains resource identities and public localhost ports only; it does not contain the generated database password, `DATABASE_URL`, credentials, tokens, or internal service secrets.
- Changed-file scans found no machine-specific, drive-qualified workspace path.
- Unrelated pre-existing absolute paths elsewhere in repository history were not modified as part of E016.T014.

## Limitations and remaining manual gates

- This is a disposable local production-mode runtime proof, not a production deployment.
- The Docker daemon supplied a local repo digest; no registry push, remote pull, or multi-host digest rehearsal was performed.
- Automated HTML assertions prove server-rendered marker presence and absence but do not replace a manual visual check at supported viewport sizes.
- Manual accessibility gates remain for zoom/reflow, high-contrast or forced-colors presentation, keyboard traversal around the sticky banner, and screen-reader confirmation that the decorative watermark remains ignored.
- PR exact-head CI and Full Integration results are recorded in the PR after the evidence commit is pushed.
