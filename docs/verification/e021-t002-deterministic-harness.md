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
- Ownership marker: synthetic `E2E_PLAYWRIGHT` source plus run-scoped IDs

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

- `pnpm exec tsx --test tests/docker-test-support.test.ts tests/e2e-guard.test.ts tests/e2e-commands.test.ts tests/test-suite-classification.test.ts`: PASS
- `pnpm exec tsx --test tests/docs-sanity.test.ts tests/runtime-docs-sanity.test.ts`: PASS
- `pnpm cleanup:test-runtime`: PASS
- `pnpm test:e2e:smoke`: PASS
- five consecutive smoke runs: PASS
- `pnpm test:e2e:area -- dashboard`: PASS
- `pnpm test:e2e:area -- leads`: PASS
- `pnpm test:e2e:full`: PASS
- Docker unavailable negative run with `DOCKER_HOST=tcp://127.0.0.1:1` against `pnpm test:e2e:smoke`: EXPECTED FAILURE
- Restored normal environment and re-ran `pnpm test:e2e:smoke`: PASS
- forced-termination recovery proof: PASS
- controlled browser failure proof: PASS
- artifact inspection: PASS

## Resilience Checks

- The E2E harness failed closed when two browser runs attempted to own `127.0.0.1:3011` at the same time.
- Re-running the browser commands sequentially passed, confirming the harness behaves deterministically when used one run at a time.
- `cleanup:test-runtime` reported that protected Docker resources remained untouched.
- The Docker-unavailable path failed before Playwright execution and returned a clear Docker connection error.
- The forced-termination proof used a test-only pause hook, then a manifest-driven recovery script inspected ownership before cleanup.
- The controlled browser failure produced screenshot, video, trace, and error-context artifacts and then cleaned the runtime.

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

## Notes

- HTML report opens disabled.
- Screenshot, trace, and video are retained only on failure.
- Docker is required for the browser commands.
