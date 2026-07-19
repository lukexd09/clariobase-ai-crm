---
title: ADR E011 private HTTPS authentication runtime
document_id: ADR-E011-PRIVATE-HTTPS-RUNTIME
document_type: decision-record
status: accepted
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-15
related_epic: E011
related_tasks:
  - E011.T013
tags:
  - auth
  - https
  - docker
  - recovery
---

# ADR E011 private HTTPS authentication runtime

## Decision

The accepted private-LAN runtime has one ingress and two internal trust boundaries:

```text
private HTTPS host binding
  -> crm-private-ingress:443 (Caddy internal CA)
  -> internal crm-edge network
  -> crm-app:3000
  -> internal crm-data network
  -> crm-postgres:5432
```

`crm-bind` exists only so Docker Desktop can publish the explicitly selected host address and port. Only Caddy joins it. `crm-app` and `crm-postgres` have no host port binding. The ingress joins `crm-edge`, the app joins `crm-edge` and `crm-data`, and PostgreSQL joins only `crm-data`. No service uses the Docker socket, privileged mode, host networking, or router port forwarding.

## Runtime contract

- `CRM_PRIVATE_HOSTNAME` is required, sanitized, non-loopback, and never hard-coded to a real site.
- `CRM_PRIVATE_HTTPS_PORT` is required and must equal the effective port of `BETTER_AUTH_URL`.
- `CRM_PRIVATE_BIND_ADDRESS` is required. Loopback is the safe proof/default template; a real LAN address is owner-selected.
- `CRM_PRIVATE_APP_IMAGE` is required and identifies an already validated immutable application image. The overlay disables builds and pulls.
- `BETTER_AUTH_URL` is one canonical HTTPS origin whose hostname equals `CRM_PRIVATE_HOSTNAME`.
- `CRM_AUTH_TRUSTED_ORIGINS` is required and must equal that exact origin. Wildcards and foreign origins are rejected.
- The issuer is the Caddy internal CA. Its private key stays in the project-scoped Caddy data volume. Only the root certificate is distributed.
- Caddy discards `Forwarded` and overwrites `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, and `X-Forwarded-For` before proxying.
- The application uses a static Better Auth base URL, sets `advanced.trustedProxyHeaders: false`, and independently requires the exact ingress-owned header tuple on auth routes.
- Better Auth session cookies are host-only, `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`.
- Public email signup is disabled and the path is removed from dispatch. Better Auth telemetry and hidden environment overrides are rejected.

## Exceptions

HTTP is accepted only by the explicit `localhost-dev` or gated `disposable-test` modes and only on loopback. These modes cover isolated development, disposable automation, and documented recovery. They are not LAN runtimes.

The existing preview topology remains separate and is not combined with this overlay. Preview has its own secret and retains its accepted E016 isolation and lifecycle.

## Certificate and firewall boundary

Repository automation may create and exercise a disposable CA. Installing that CA on a real workstation or phone, changing host DNS, and changing Windows Firewall remain owner-gated manual operations. The firewall rule, when later approved, must scope inbound TCP to the selected private port, private profile, intended LAN subnet, and Docker host executable. Public profiles, WAN exposure, and router forwarding are prohibited.

## Rollback

Rollback means recreating only `crm-app` from the prior exact image ID while keeping the same PostgreSQL volume and the same ingress image digest. If the HTTPS runtime itself must be disabled, run Compose `down` without `-v`; do not delete database or Caddy volumes. Loopback HTTP may be used only as a documented, temporary recovery exception.
