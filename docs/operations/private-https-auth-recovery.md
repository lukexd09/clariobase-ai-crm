---
title: Private HTTPS authentication and recovery runbook
document_id: DOC-E011-PRIVATE-HTTPS-AUTH-RECOVERY
document_type: operations-runbook
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-15
related_epic: E011
related_tasks:
  - E011.T013
tags:
  - auth
  - https
  - backup
  - disaster-recovery
---

# Private HTTPS authentication and recovery runbook

## Safe preparation

Copy `.env.compose.private-https.example` to an ignored local file. Set a private hostname, the exact HTTPS origin, an explicit bind address and port, an immutable validated application image ID, a unique PostgreSQL password, and a Better Auth secret of at least 32 random characters. Never reuse preview, test, or production credentials.

Generate secrets with an owner-controlled cryptographic password manager or OS CSPRNG. Do not paste values into tickets, terminals that are recorded, Compose output, or proof evidence. `docker compose config` renders secrets and must not be attached to a PR.

Start only after hostname resolution and CA trust are intentionally planned:

```powershell
docker compose --env-file .env.compose.private-https.local -f compose.yaml -f compose.private-https.yaml config --quiet
docker compose --env-file .env.compose.private-https.local -f compose.yaml -f compose.private-https.yaml up -d --no-build --pull never
```

The application and database must show no published ports. Only the configured Caddy `443/tcp` target may be published.

## Owner-gated host and device steps

The following are documentation only and must not be run by automation:

1. Create a private DNS/hosts entry mapping the chosen hostname to the Docker host LAN address.
2. Export only `/data/caddy/pki/authorities/local/root.crt` from `crm-private-ingress`.
3. Verify the root certificate fingerprint out of band, then install it in the minimum required trust store on an owner-approved device.
4. Create a Windows Firewall inbound rule limited to the chosen TCP port, Private profile, and intended LAN subnet.
5. Test one second physical device. Record it as a manual rehearsal only if actually performed.
6. Remove the CA from every device when retiring or rotating the private CA.

Never export the CA private key. Never enable router forwarding, public DNS, a Public-profile firewall rule, or public Internet exposure.

## Routine operations

- App restart: `docker compose ... restart crm-app`.
- Database restart: `docker compose ... restart crm-postgres`; wait for `/api/ready` to return 200.
- Ingress restart: `docker compose ... restart crm-private-ingress`.
- Disable safely: `docker compose ... down --remove-orphans` without `-v`.
- Backup/restore rehearsal: `corepack pnpm docker:test-backup-restore` uses only disposable resources.
- Full disposable security/restart/rollback proof: `corepack pnpm e011:t013:proof`.

Commands that omit the env and file arguments are illustrative. Operators must use the same explicit project/env/overlay selection throughout one operation.

## Rotation

Changing `BETTER_AUTH_SECRET` invalidates existing signed cookies. Plan a maintenance window, revoke active sessions when possible, rotate the secret, recreate only the app, and require reauthentication. The database password is a separate credential and follows the PostgreSQL recovery plan.

Caddy renews leaf certificates from its internal CA state. For ordinary leaf rotation, restart Caddy after confirming the persistent Caddy data volume is healthy. Replacing the CA invalidates device trust and is an owner-gated re-enrollment event; export and verify the new root, update every approved device, then remove the old root. Never delete the Caddy volume as a routine certificate rotation step.

## Exact-image rollback

Record the application source SHA, exact image ID/repository digest, Caddy digest, PostgreSQL version, and backup checksum before change. Upgrade by exact image identity. If readiness or auth fails, recreate only `crm-app` using the recorded prior identity. Preserve the PostgreSQL volume and Caddy volumes. Verify `/api/ready`, HTTPS sign-in, an existing valid session where policy permits, and revoked-session behavior after rollback.

Do not push or retag GHCR images as part of the local proof. Mutable tags are labels for cleanup only, never rollback authority.

## Offline recovery order

1. Verify `manifest.sha256` and every artifact checksum before execution.
2. Restore the exact source archive, root `package.json`, root lockfile, migrations, Dockerfile, Caddy config, pnpm runtime/store, Better Auth archives, Prisma engines, and image archives.
3. Prefer exact-image restore for the validated incident image. Load the saved application, Caddy, PostgreSQL, and Node images without pulling.
4. Restore PostgreSQL into a fresh instance and validate the logical backup checksum and server version.
5. Start PostgreSQL, run checked-in migrations, start the exact app image, then start Caddy.
6. Verify readiness, HTTPS trust, sign-in, active/revoked sessions, account linkage, CRM rows, and admin audit events.
7. Keep the recovery networks internal until the owner explicitly opens the private bind boundary.

The source-rebuild path performs an offline frozen install from the retained root pnpm store and regenerates Prisma. A source rebuild creates a new image identity and therefore requires the full validation gate before use. Exact-image restore preserves the already validated identity and is the preferred fast recovery path.

The emergency upstream fork procedure is owner-gated: verify retained Better Auth source archives and licenses, create a private fork from the checksum-pinned archive, record provenance, review every patch, rebuild the entire application, and run all T009–T013 plus full CI. Never silently replace the package or contact Better Auth managed infrastructure.

## Backup sensitivity and disaster notes

Logical dumps contain users, credential password hashes, sessions, audit events, and CRM data. Treat them as secrets at rest. Evidence may contain only format, PostgreSQL version, row-count assertions, and SHA-256; never raw cookies, tokens, hashes, passwords, database URLs, or CA private material.

Database restore alone is insufficient for live session continuity: the matching Better Auth secret is a separately protected recovery asset. If it is unavailable or intentionally rotated, restored database sessions must be treated as invalid and users must sign in again.
