---
title: CRM container operations runbook
document_id: DOC-E014-CONTAINER-OPERATIONS
document_type: operations-runbook
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-15
related_epic: E014
related_tasks:
  - E014.T005
related_components:
  - COMP-CRM-APP
  - COMP-CRM-POSTGRES
related_documents:
  - docs/runtime/container-runtime.md
  - docs/runtime/container-image.md
  - docs/architecture/container-orchestration.md
  - docs/decisions/adr-e014-container-runtime.md
  - README.md
tags:
  - operations
  - docker
  - compose
  - runbook
  - backup
  - restore
---

# CRM container operations runbook

## Purpose

This document is the canonical operator runbook for the implemented E014 local production-like CRM runtime.
It describes how a solo operator starts, configures, verifies, restarts, backs up, restores, and troubleshoots the current CRM-only Compose stack.

Current scope:

- repository-local runtime only;
- `crm-app` plus `crm-postgres`;
- localhost-first operation by default;
- manual AI file exchange through `data/ai-exchange/`;
- no gatherer orchestration, cloud deployment, or public exposure.

## Canonical runtime assets

Operator-facing files and paths:

- `compose.yaml`
- `.env.compose.example`
- local copied env file such as `.env.compose.local`
- `data/ai-exchange/`
- named volume key `crm-postgres-data`
- endpoints:
  - `/health`
  - `/api/ready`

Canonical repository-level verification commands:

- `corepack pnpm docker:test-image`
- `corepack pnpm docker:test-runtime`
- `corepack pnpm docker:test-backup-restore`
- `corepack pnpm cleanup:test-runtime`

## Exact environment variables

| Variable | Required | Used by | Meaning |
| --- | --- | --- | --- |
| `CRM_BIND_ADDRESS` | yes | Compose ports | Host bind address. Default: `127.0.0.1`. |
| `CRM_HOST_PORT` | yes | Compose ports | Host port published to the CRM app. Default: `3000`. |
| `AI_EXCHANGE_HOST_PATH` | yes | Compose bind mount | Host path mounted to `/app/data/ai-exchange`. |
| `CRM_POSTGRES_DB` | yes | `crm-postgres`, `crm-app` | CRM database name. Recommended: `clariobase_crm`. |
| `CRM_POSTGRES_USER` | yes | `crm-postgres`, `crm-app` | CRM PostgreSQL username. |
| `CRM_POSTGRES_PASSWORD` | yes | `crm-postgres`, `crm-app` | Required local runtime secret. |
| `CRM_DATABASE_URL` | no | `crm-app` | Explicit DSN override when credentials must be URI-encoded. |

Rules:

- copy `.env.compose.example` to a local file such as `.env.compose.local`;
- set `CRM_POSTGRES_PASSWORD` before first run;
- keep `.env.compose.local` uncommitted;
- use `CRM_DATABASE_URL` only when the derived DSN is not sufficient;
- do not point `CRM_DATABASE_URL` at the harvester or gatherer database.

## First run

1. Copy the env template:

```bash
cp .env.compose.example .env.compose.local
```

2. Edit `.env.compose.local` and set at least:

```dotenv
CRM_POSTGRES_PASSWORD=replace-with-a-local-secret
```

3. Start the database only:

```bash
docker compose --env-file .env.compose.local up -d crm-postgres
```

4. Apply migrations from the app image:

```bash
docker compose --env-file .env.compose.local run --rm crm-app sh -lc "node ./node_modules/prisma/build/index.js migrate deploy"
```

5. Start the application service:

```bash
docker compose --env-file .env.compose.local up -d crm-app
```

6. Verify the stack:

```bash
docker compose --env-file .env.compose.local ps
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/api/ready
```

7. Run the isolated verification suite whenever you want a disposable end-to-end confirmation:

```bash
corepack pnpm docker:test-runtime
```

Expected semantics:

- `/health` returns HTTP `200` when the Next.js process is alive, with a fresh timestamp on every request and non-cacheable response headers;
- `/api/ready` returns HTTP `200` only after migrations are applied and the CRM database is usable;
- `crm-app` healthcheck becomes healthy only when `/api/ready` returns HTTP `200`.

## Startup and shutdown

Start an already initialized stack:

```bash
docker compose --env-file .env.compose.local up -d
```

Stop containers but keep data:

```bash
docker compose --env-file .env.compose.local stop
```

Remove containers and network but keep the database volume:

```bash
docker compose --env-file .env.compose.local down
```

Remove containers and also delete persisted CRM data:

```bash
docker compose --env-file .env.compose.local down -v
```

`down -v` is destructive for CRM runtime data and should be treated as an intentional reset only.

## Safe migration procedure

Use this procedure when the repository gains new reviewed Prisma migrations:

1. pull the updated repository state;
2. rebuild the app image if needed:

```bash
docker compose --env-file .env.compose.local build crm-app
```

3. stop the app:

```bash
docker compose --env-file .env.compose.local stop crm-app
```

4. apply migrations explicitly:

```bash
docker compose --env-file .env.compose.local run --rm crm-app sh -lc "node ./node_modules/prisma/build/index.js migrate deploy"
```

5. start the app again:

```bash
docker compose --env-file .env.compose.local up -d crm-app
```

6. confirm readiness:

```bash
curl -i http://127.0.0.1:3000/api/ready
```

Do not use `prisma migrate dev` against the operator runtime database.

## Health and readiness verification

Current endpoints:

- `http://127.0.0.1:<CRM_HOST_PORT>/health`
- `http://127.0.0.1:<CRM_HOST_PORT>/api/ready`

Useful commands:

```bash
docker compose --env-file .env.compose.local ps
docker inspect --format='{{.State.Health.Status}}' clariobase-ai-crm-crm-app-1
docker inspect --format='{{.State.Health.Status}}' clariobase-ai-crm-crm-postgres-1
```

If the project name differs, use the actual container names from `docker compose ps`.

Disposable test-runtime cleanup:

```bash
corepack pnpm cleanup:test-runtime
```

Cleanup safety rules:

- the cleanup command is limited to disposable E014 verification artifacts and approved disposable `.codex-tmp/` entries only;
- it may remove only resources created by the current run or names under the approved disposable prefix `clariobase-e014-runtime-*`;
- it must never target the persistent operator stack `clariobase-crm`;
- it must never use broad cleanup commands such as `docker system prune`.

## AI exchange workflow in the containerized runtime

Use the bind-mounted host directory through one-off app-container commands:

```bash
docker compose --env-file .env.compose.local run --rm crm-app node --env-file-if-exists=.env.local ./node_modules/tsx/dist/cli.mjs scripts/export-ai-leads.ts
docker compose --env-file .env.compose.local run --rm crm-app node --env-file-if-exists=.env.local ./node_modules/tsx/dist/cli.mjs scripts/validate-ai-import-file.ts ./data/ai-exchange/inbox/prepared-leads.json
docker compose --env-file .env.compose.local run --rm crm-app node --env-file-if-exists=.env.local ./node_modules/tsx/dist/cli.mjs scripts/import-leads.ts ./data/ai-exchange/inbox/prepared-leads.json
docker compose --env-file .env.compose.local run --rm crm-app node --env-file-if-exists=.env.local ./node_modules/tsx/dist/cli.mjs scripts/detect-duplicates.ts
```

Those commands operate on the containerized CRM database while reading and writing files under the host-mounted `data/ai-exchange/` path.

## Restart and recovery

Restart only the app:

```bash
docker compose --env-file .env.compose.local restart crm-app
```

Restart only PostgreSQL:

```bash
docker compose --env-file .env.compose.local restart crm-postgres
```

Recovery expectations:

- if PostgreSQL is unavailable, `/api/ready` returns HTTP `503`;
- once PostgreSQL is back and healthy, `/api/ready` should recover to HTTP `200`;
- the named volume keeps CRM data across normal restarts;
- use `corepack pnpm docker:test-runtime` to validate recovery and persistence on disposable resources.

## Persistence, backup and restore

Persistence details:

- the implemented volume key is `crm-postgres-data`;
- Compose will materialize it under the active project name;
- the volume protects against normal container restarts, not operator mistakes or host loss.

Create a logical backup inside the running database container:

```bash
mkdir backups
docker compose --env-file .env.compose.local exec -T crm-postgres sh -lc 'mkdir -p /tmp/backups && pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > /tmp/backups/clariobase_crm.sql'
docker compose --env-file .env.compose.local cp crm-postgres:/tmp/backups/clariobase_crm.sql backups/clariobase_crm.sql
```

Restore a logical backup into the current CRM database only after stopping the app and resetting the target database:

```bash
docker compose --env-file .env.compose.local stop crm-app
docker compose --env-file .env.compose.local cp backups/clariobase_crm.sql crm-postgres:/tmp/clariobase_crm.sql
docker compose --env-file .env.compose.local exec -T crm-postgres sh -lc 'db_name="$POSTGRES_DB"; db_user="$POSTGRES_USER"; dropdb -U "$db_user" --force --if-exists "$db_name" && createdb -U "$db_user" "$db_name" && psql -U "$db_user" "$db_name" < /tmp/clariobase_crm.sql'
docker compose --env-file .env.compose.local up -d crm-app
```

Backup and restore warnings:

- restore only from a reviewed backup file after the target CRM database has been reset;
- confirm the target database is the CRM database, not the harvester/gatherer database;
- use `corepack pnpm docker:test-backup-restore` when you want to rehearse the documented flow on disposable resources;
- use `corepack pnpm cleanup:test-runtime` to remove only disposable verification leftovers after interrupted test runs;
- keep backups outside ignored runtime folders if they must survive a repo cleanup.

## Localhost and LAN configuration

Default behavior:

- `CRM_BIND_ADDRESS=127.0.0.1`
- `CRM_HOST_PORT=3000`

This means the CRM is reachable only from the same machine by default.

LAN-only override:

```dotenv
CRM_BIND_ADDRESS=0.0.0.0
CRM_HOST_PORT=3000
```

Use this only on a trusted internal network.
E014 does not add TLS, reverse proxying, public DNS, or internet-facing exposure.

## External PostgreSQL override direction

The current implemented default is the repository-local `crm-postgres` service.

If a later operator intentionally uses an external server-level PostgreSQL instance instead:

- keep a dedicated CRM-only database;
- keep dedicated CRM-only credentials;
- provide a reviewed `CRM_DATABASE_URL`;
- remove or ignore `crm-postgres` only as an explicit override path;
- do not collapse CRM into the harvester or gatherer database.

That direction is documented for future controlled use, not as the default E014 path.

## Troubleshooting

`/health` returns `200`, but `/api/ready` returns `503`:

- verify `crm-postgres` is healthy with `docker compose ps`;
- confirm the migration step was run successfully;
- inspect app logs:

```bash
docker compose --env-file .env.compose.local logs crm-app --tail 200
docker compose --env-file .env.compose.local logs crm-postgres --tail 200
```

The app never becomes healthy:

- confirm `CRM_POSTGRES_PASSWORD` is set in `.env.compose.local`;
- confirm `CRM_DATABASE_URL` is URI-encoded correctly if used;
- rerun:

```bash
corepack pnpm docker:test-runtime
```

AI export/import commands do not create host files:

- confirm `AI_EXCHANGE_HOST_PATH` points to an existing writable host path;
- confirm the path resolves to `data/ai-exchange/` or another intended operator directory;
- check the bind mount in `docker compose config`.

You need a fully clean local reset:

```bash
docker compose --env-file .env.compose.local down -v
```

This removes CRM runtime data and must be followed by the first-run migration sequence again.
