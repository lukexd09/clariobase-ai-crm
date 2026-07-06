# E021.T002 Deterministic Harness

## Baseline

- Required baseline: `00c5b5ed2382477f7cf9cc75ca3e748c4c1c507e`
- Repository: `C:\Serwer\Projekty\Clariobase\clariobase-ai-crm`

## Branch Model

- Epic branch: `epic/e021-playwright-agentic-ui-qa`
- Task branch: `e021-t002-deterministic-harness`

## Runtime

- PostgreSQL image: `postgres:16`
- App URL: `http://127.0.0.1:3011`
- Database URL: constructed only by the project-owned E2E runtime
- Ownership marker: canonical Docker labels `clariobase.epic=E021`, `task=T002`, and `run-id=<runId>` on both the runtime Postgres container and the runtime Docker network

## Fixture Rules

- Single owned synthetic lead
- `customerId` uses an E2E prefix
- `sourceRecordId` contains the run ID
- `businessName` contains `E2E Synthetic`
- Cleanup deletes only the current-run record

## Commands

- `pnpm cleanup:test-runtime`
- `pnpm test:e2e:smoke`
- `pnpm test:e2e:area -- dashboard`
- `pnpm test:e2e:area -- leads`
- `pnpm test:e2e:full`

## Verified Results

- `pnpm exec tsx --test tests/e2e-commands.test.ts tests/e2e-guard.test.ts tests/test-suite-classification.test.ts tests/docker-test-support.test.ts tests/e2e-fixture-negative.test.ts`: PASS
- `pnpm exec tsx --test tests/docs-sanity.test.ts tests/runtime-docs-sanity.test.ts`: PASS
- `pnpm cleanup:test-runtime`: PASS
- `cleanup:test-runtime` removed E021-owned networks and E021 fixture temp entries: PASS
- `pnpm test:e2e:smoke`: PASS
- `pnpm test:e2e:area -- dashboard`: PASS
- `pnpm test:e2e:area -- leads`: PASS
- `pnpm test:e2e:full`: PASS
- Docker unavailable negative run with `DOCKER_HOST=tcp://127.0.0.1:1` against `pnpm test:e2e:smoke`: EXPECTED FAILURE
- forced-termination recovery proof: PASS
- controlled browser failure proof: PASS
- artifact inspection: PASS
- final repository validation: PASS
- final `pnpm test:e2e:smoke`: PASS
- final `pnpm test:e2e:area -- dashboard`: PASS
- final `pnpm test:e2e:area -- leads`: PASS
- final `pnpm test:e2e:full`: PASS
- `pnpm install --frozen-lockfile`: PASS
- `pnpm prisma:validate`: PASS
- `pnpm prisma:generate`: PASS
- `pnpm lint`: PASS
- `pnpm test:fast`: PASS
- `pnpm build`: PASS
- `git diff --check`: PASS

## Negative Matrices

- Command/classification negative matrix: PASS
  - Covered by `tests/e2e-commands.test.ts`, `tests/e2e-guard.test.ts`, and `tests/test-suite-classification.test.ts`.
  - Includes exact command selection, missing/unknown mode, missing/unknown area, extra-argument rejection, exact `@smoke` semantics, `@smoke-extra` non-match, and suite classification.
- Target/runtime negative matrix: PASS
  - Covered by `tests/e2e-guard.test.ts`.
  - Includes protected hostnames, `http`-only target checks, credentials, query strings, fragments, non-root paths, missing runtime marker, wrong runtime marker, and occupied `127.0.0.1:3011` command failure.
- Docker/database ownership negative matrix: PASS
  - Covered by `tests/docker-test-support.test.ts`.
  - Includes synthetic ownership snapshots for wrong image, missing labels, wrong run ID label, wrong network ownership, protected identity, wrong host port, and manifest/container mismatch.
- Docker unavailable proof: PASS
  - `DOCKER_HOST=tcp://127.0.0.1:1 pnpm test:e2e:smoke` failed before Playwright with a Docker network creation error.
  - Restored `docker info` and `pnpm test:e2e:smoke` both passed.
- Fixture negative matrix: PASS
  - Covered by `tests/e2e-fixture-negative.test.ts`.
  - Includes run-scoped synthetic fixture creation, exact current-run ownership, stale-row rejection, and cleanup filter behavior.
- Occupied-port proof: PASS
  - Temporary listener on `127.0.0.1:3011` caused `pnpm test:e2e:smoke` to fail immediately with `Error: Port 3011 is occupied` before Docker startup.

## Resilience Checks

- The E2E harness failed closed when two browser runs attempted to own `127.0.0.1:3011` at the same time.
- Re-running the browser commands sequentially passed, confirming the harness behaves deterministically when used one run at a time.
- `cleanup:test-runtime` reported that protected Docker resources remained untouched.
- The Docker-unavailable path failed before Playwright execution and returned a clear Docker connection error.
- The forced-termination proof used a test-only pause hook, then a manifest-driven recovery script inspected ownership before cleanup.
- The controlled browser failure produced screenshot, video, trace, and error-context artifacts and then cleaned the runtime.
- `cleanup:test-runtime` removed the E021-owned network and the E021 fixture temp entry, leaving no `.codex-tmp` residue after the normal cleanup proof.

## Forced-Termination Recovery

- Residue archive: `C:\Serwer\Projekty\Clariobase\recovery\e021-t002-paused-residue-20260706-095726`
- Archive manifest: `C:\Serwer\Projekty\Clariobase\recovery\e021-t002-paused-residue-20260706-095726\manifest.csv`
- Paused-run residue archived from `.codex-tmp\e2e-fixture`, `.codex-tmp\paused-smoke.err.log`, and `.codex-tmp\paused-smoke.out.log`.
- Pause hook env var: `CLARIOBASE_E2E_PAUSE_BEFORE_PLAYWRIGHT_MS`
- Paused run ID: `e021-t002-mr8xjuaa-r9ycf5`
- Stale resources observed before recovery: Postgres container `e021-t002-mr8xjuaa-r9ycf5-postgres`, network `e021-t002-mr8xjuaa-r9ycf5-network`, host port `59012`, Next.js PID `7584`.
- Forced termination method: stopped only the top-level orchestrator process after readiness, leaving the stale run in place.
- Recovery command: `pnpm exec tsx scripts/recover-e2e-run.ts .codex-tmp/e021-t002-mr8xjuaa-r9ycf5.json`
- Ownership verification result: PASS, with recovery inspecting the run manifest before deleting only the stale owned container, network, and manifest.
- Sentinel preservation: PASS, unrelated Docker network `clariobase-e021-t002-unrelated-sentinel` survived recovery until explicitly removed afterward.
- Post-recovery smoke result: PASS
- Status: PASS

## Controlled Browser Failure

- Temporary hook: `CLARIOBASE_E021_T002_FORCE_SMOKE_FAIL=1` inside `tests/e2e/smoke.spec.ts`
- Result: `pnpm test:e2e:smoke` failed as expected with `Error: Temporary E021.T002 smoke failure`
- Screenshot: PASS
- Trace: PASS
- Video: PASS
- HTML report: PASS
- Next.js stopped: PASS
- Postgres removed: PASS
- Network removed: PASS
- Manifest removed: PASS
- Port 3011 free: PASS
- No E021 Docker residue: PASS

## Artifact Inspection

- `test-results` error context only contained the injected failure message and the local Playwright stack trace.
- `playwright-report` contained the generated HTML report and trace viewer assets only.
- The synthetic fixture state remained run-scoped and contained no secrets, credential-bearing URLs, or real customer/operator data.
- The temporary hook was removed before the final successful smoke run.

## Final Validation

- Final `pnpm test:e2e:smoke`: PASS
- Final `pnpm test:e2e:area -- dashboard`: PASS
- Final `pnpm test:e2e:area -- leads`: PASS
- Final `pnpm test:e2e:full`: PASS
- Cleanup after every browser command: PASS

## Notes

- HTML report opens disabled.
- Screenshot, trace, and video are retained only on failure.
- Docker is required for the browser commands.
