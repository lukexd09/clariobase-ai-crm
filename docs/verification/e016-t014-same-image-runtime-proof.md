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

The executable repository-owned proof built one application image and reused its content-addressed image ID for the four mandatory disposable production-server starts plus one adversarial padded-production case. Each case crossed the container runtime environment, Next.js server rendering, and returned `/health` HTML. No Compose operator stack, production service, or production database was used.

## Source and image identity

- Source Git SHA: `fd510bc017d17b58a04f47ade2003205334cae79`
- Proof commit SHA: `fd510bc017d17b58a04f47ade2003205334cae79`
- Proof command: `corepack pnpm docker:test-environment-runtime`
- Image build command: `docker build --target runtime --tag clariobase-ai-crm:test-verify-clariobase-e014-runtime-env-proof-23096-1783774314800 --label io.clariobase.source-sha=fd510bc017d17b58a04f47ade2003205334cae79 .`
- Build start: `2026-07-11T12:51:54.988Z`
- Build completion: `2026-07-11T12:52:11.062Z`
- Dockerfile: `./Dockerfile`
- Build target: `runtime`
- Image tag: `clariobase-ai-crm:test-verify-clariobase-e014-runtime-env-proof-23096-1783774314800` (reference only)
- Image ID: `sha256:342caa56cbe629e6447d436aeea33618f393a67c328d1353f6324454f97ccdf7`
- Image digest: `clariobase-ai-crm@sha256:342caa56cbe629e6447d436aeea33618f393a67c328d1353f6324454f97ccdf7`
- Build count: `1`

The script recorded the tag-to-ID mapping immediately after the build, inspected both the tag and immutable ID before migration, inspected both again before every runtime case, and repeated the checks after all cases. Every migration and application `docker run` used the recorded image ID, not the tag. The script failed if the tag drifted, the ID became unavailable, a container reported another image ID, or the build count differed from one.

## Disposable runtime identity

- Network: `clariobase-e014-runtime-env-proof-23096-1783774314800-network`
- PostgreSQL container: `clariobase-e014-runtime-env-proof-23096-1783774314800-db`
- PostgreSQL container ID: `6772f55a6b21574935bc72eb50f83ef2e616d2ccbba2fafe61f144861d048fc6`
- Database: `clariobase_crm_environment_proof`
- Database volume: `clariobase-e014-runtime-env-proof-23096-1783774314800-postgres-data`
- Database image: `postgres:16`
- Published database ports: none

The database password was randomly generated for this disposable run, was never printed, and was destroyed with the database container and volume. Migrations ran once from the exact application image ID on the isolated network.

## Runtime cases

| Case | Container | Port | Runtime value | Readiness | Banner | Watermark marks | Image ID match |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Preview | `clariobase-e016-runtime-env-proof-23096-1783774314800-preview` | `62786` | `preview` | HTTP 200, `status=ready`, `database=ok` | absent | 8 | true |
| Production | `clariobase-e016-runtime-env-proof-23096-1783774314800-production` | `62792` | `production` | HTTP 200, `status=ready`, `database=ok` | absent | 0 | true |
| Missing | `clariobase-e016-runtime-env-proof-23096-1783774314800-missing` | `62798` | omitted | HTTP 200, `status=ready`, `database=ok` | absent | 8 | true |
| Invalid | `clariobase-e016-runtime-env-proof-23096-1783774314800-invalid` | `62804` | `prod` | HTTP 200, `status=ready`, `database=ok` | absent | 8 | true |
| Padded production | `clariobase-e016-runtime-env-proof-23096-1783774314800-padded-production` | `62810` | ` production ` | HTTP 200, `status=ready`, `database=ok` | absent | 8 | true |

For every case, the verifier confirmed the host port belonged to the named container, waited deterministically for `/api/ready`, fetched dynamic server-rendered `/health` HTML, required the `Health check` route fingerprint, and asserted the repeated subtle `TEST` watermark pattern plus the structural `aria-hidden="true"`, `pointer-events-none`, and `select-none` behavior. The exact production case required the overlay to be absent entirely. The missing case inspected the container environment and required `CRM_DEPLOYMENT_ENV` to be truly omitted. The padded-production case proved that a normalized-but-not-exact value cannot silently resemble production. The banner was removed completely in the corrected implementation.

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

The first independent adversarial review returned `CHANGES REQUIRED` because the resolver trimmed and lowercased values, allowing padded or differently cased production strings to hide the marker. Commit `a05b6f7` changed the resolver to raw exact equality and added focused coverage plus a padded-production container case. Commit `fd510bc` corrected the executable success summary to cover the expanded case set. The exact-source proof above then passed all mandatory and adversarial cases with build count one.

The earlier branch history also records the initial fast-suite classification failure and correction in commit `b73de4b88ada68493cd97acdd91ec0ca8e4df6c1` (`E016.T014 fix fast-test regression`).

## Secret and local-path review

- The proof output contains resource identities and public localhost ports only; it does not contain the generated database password, `DATABASE_URL`, credentials, tokens, or internal service secrets.
- Changed-file scans found no machine-specific, drive-qualified workspace path.
- Unrelated pre-existing absolute paths elsewhere in repository history were not modified as part of E016.T014.

## Limitations and remaining manual gates

- This is a disposable local production-mode runtime proof, not a production deployment.
- The Docker daemon supplied a local repo digest; no registry push, remote pull, or multi-host digest rehearsal was performed.
- Automated HTML assertions prove server-rendered marker presence and absence but do not replace a manual visual check at supported viewport sizes.
- Manual accessibility gates remain for zoom/reflow, high-contrast or forced-colors presentation, keyboard traversal around the application while the decorative overlay stays ignored, and screen-reader confirmation that the repeated watermark remains hidden from assistive tech.
- PR exact-head CI and Full Integration results are recorded in the PR after the evidence commit is pushed.
