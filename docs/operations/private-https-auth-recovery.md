---
title: Private HTTPS authentication and recovery runbook
document_id: DOC-E011-PRIVATE-HTTPS-AUTH-RECOVERY
document_type: operations-runbook
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-16
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
corepack pnpm private-https:preflight -- --env-file .\.env.compose.private-https.local --expected-source-sha <exact source sha>
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
- Runtime-only security/restart/rollback proof: `corepack pnpm e011:t013:runtime-proof`.
- Preview HTTPS auth proof alias: `corepack pnpm preview:https-auth-proof`.

Full offline rebuild/restore is not an operated ClarioBase capability. The removed full-offline command no longer exists; operator recovery stays limited to private HTTPS restart, session persistence, PostgreSQL backup/restore, and immutable-image rollback.

Commands that omit the env and file arguments are illustrative. Operators must use the same explicit project/env/overlay selection throughout one operation.

The local preview env file owns the effective preview hostname, HTTPS port and origin. Do not rebuild those values independently in automation when the resolved preview URL is already available from the loaded env.

## Rotation

Changing `BETTER_AUTH_SECRET` invalidates existing signed cookies. Plan a maintenance window, revoke active sessions when possible, rotate the secret, recreate only the app, and require reauthentication. The database password is a separate credential and follows the PostgreSQL recovery plan.

Caddy renews leaf certificates from its internal CA state. For ordinary leaf rotation, restart Caddy after confirming the persistent Caddy data volume is healthy. Replacing the CA invalidates device trust and is an owner-gated re-enrollment event; export and verify the new root, update every approved device, then remove the old root. Never delete the Caddy volume as a routine certificate rotation step.

## Exact-image rollback

Record the application source SHA, exact image ID/repository digest, Caddy digest, PostgreSQL version, and backup checksum before change. Upgrade by exact image identity. If readiness or auth fails, recreate only `crm-app` using the recorded prior identity. Preserve the PostgreSQL volume and Caddy volumes. Verify `/api/ready`, HTTPS sign-in, an existing valid session where policy permits, and revoked-session behavior after rollback.

Do not push or retag GHCR images as part of the local proof. Mutable tags are labels for cleanup only, never rollback authority.

## Removed offline implementation

Repository T013 offline bundle/restore files were historical technical debt, not operator instructions or a supported recovery path. Issue `#200` removed them in a separate owner-approved cleanup.

Operated recovery in this runbook is limited to checked-in migrations, disposable logical backup/restore rehearsal, secret rotation, private HTTPS restart and immutable-image rollback. Any proposal to add full offline rebuild/restore requires a new owner architecture decision.

## Backup sensitivity and disaster notes

Logical dumps contain users, credential password hashes, sessions, audit events, and CRM data. Treat them as secrets at rest. Evidence may contain only format, PostgreSQL version, row-count assertions, and SHA-256; never raw cookies, tokens, hashes, passwords, database URLs, or CA private material.

Database restore alone is insufficient for live session continuity: the matching Better Auth secret is a separately protected recovery asset. If it is unavailable or intentionally rotated, restored database sessions must be treated as invalid and users must sign in again.
