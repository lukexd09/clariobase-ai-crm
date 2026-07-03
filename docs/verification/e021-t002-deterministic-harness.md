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
- `pnpm cleanup:test-runtime`: PASS
- `pnpm test:e2e:smoke`: PASS
- `pnpm test:e2e:area -- dashboard`: PASS
- `pnpm test:e2e:area -- leads`: PASS
- `pnpm test:e2e:full`: PASS
- Docker unavailable negative run with `DOCKER_HOST=tcp://127.0.0.1:1` against `pnpm test:e2e:smoke`: EXPECTED FAILURE
- Restored normal environment and re-ran `pnpm test:e2e:smoke`: PASS

## Resilience Checks

- The E2E harness failed closed when two browser runs attempted to own `127.0.0.1:3011` at the same time.
- Re-running the browser commands sequentially passed, confirming the harness behaves deterministically when used one run at a time.
- `cleanup:test-runtime` reported that protected Docker resources remained untouched.
- The Docker-unavailable path failed before Playwright execution and returned a clear Docker connection error.

## Notes

- HTML report opens disabled.
- Screenshot, trace, and video are retained only on failure.
- Docker is required for the browser commands.
