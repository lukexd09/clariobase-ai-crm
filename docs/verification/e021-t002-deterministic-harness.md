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

## Notes

- HTML report opens disabled.
- Screenshot, trace, and video are retained only on failure.
- Docker is required for the browser commands.
