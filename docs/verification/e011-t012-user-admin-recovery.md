---
title: E011.T012 user administration and account recovery discovery
document_id: DOC-E011-T012-USER-ADMIN-RECOVERY
document_type: verification
status: draft
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-09
related_epic: E011
related_tasks:
  - E011.T012
related_documents:
  - docs/verification/e011-t009-better-auth-core-foundation.md
  - docs/verification/e011-t011-boundary-inventory.md
  - docs/runtime/container-runtime.md
tags:
  - verification
  - better-auth
  - admin
  - recovery
---

# E011.T012 user administration and account recovery discovery

## Purpose

This document records the first discovery slice for `E011.T012 - Add controlled user administration and account recovery`.

The slice does not implement the full administrator UI.
It inventories the installed Better Auth admin/recovery surface, confirms the installed plugin contract, and records the smallest safe direction for a later gateway and UI.

## Current accepted foundation

The following T011/T010 foundation is already in place:

- public signup is disabled in `src/lib/auth.ts`;
- telemetry is disabled in `src/lib/auth.ts`;
- CRM browser boundaries and server actions are protected in T011;
- the current auth route handler is the standard Better Auth handler in `src/app/api/auth/[...all]/route.ts`;
- the Prisma schema now contains the Better Auth admin-related columns, while the admin plugin remains disabled at runtime.

## Installed Better Auth admin/recovery surface

Installed package source inspected:

- `node_modules/better-auth/dist/plugins/admin/admin.mjs`
- `node_modules/better-auth/dist/plugins/admin/admin.d.mts`
- `node_modules/better-auth/dist/plugins/admin/types.d.mts`
- `node_modules/better-auth/dist/plugins/admin/access/statement.d.mts`
- `node_modules/better-auth/dist/api/index.d.mts`
- `node_modules/better-auth/dist/api/routes/password.mjs`

Observed admin capabilities from the pinned package:

- `listUsers`
- `createUser`
- `getUser`
- `adminUpdateUser`
- `setRole`
- `banUser`
- `unbanUser`
- `listUserSessions`
- `revokeUserSession`
- `revokeUserSessions`
- `setUserPassword`
- `removeUser`
- `impersonateUser`
- `stopImpersonating`
- `userHasPermission`

Observed password / recovery surface from the pinned package:

- `requestPasswordReset`
- `requestPasswordResetCallback`
- `resetPassword`
- `setPassword`
- `verifyPassword`

Observed default access-control statements exposed by the plugin:

- `defaultRoles`
- `defaultAc`
- `adminAc`
- `userAc`
- `defaultStatements`

## Schema impact

The installed admin plugin exposes these schema fields, which this foundation slice adds to the Prisma schema:

- `user.role`
- `user.banned`
- `user.banReason`
- `user.banExpires`
- `session.impersonatedBy`

The migration prepares storage only. No real gateway write path or admin plugin runtime endpoint is enabled in this slice.

Current repository Prisma schema status:

- `user` carries the prepared admin role/ban columns;
- `session` carries the prepared impersonation marker column;
- `account` table exists for core auth;
- `verification` table exists for core auth;
- no organization, team, workspace, or invitation tables are present.

## Approved operations for the future gateway

The future gateway should expose only:

- list users
- create controlled user
- update basic identity fields
- disable / ban user
- reactivate / unban user
- list user sessions
- revoke user sessions
- initiate / set / reset access through an approved recovery path

## Explicitly prohibited operations

The future gateway must not expose:

- impersonation
- hard delete
- organization operations
- team operations
- workspace operations
- arbitrary Better Auth endpoint forwarding
- public signup

## Admin authorization model

The smallest safe model has not been implemented yet.

Current discovery result:

- the installed Better Auth admin plugin supports `adminRoles`, `defaultRole`, and `adminUserIds`;
  - the current app schema still needs those admin role and ban fields before any gateway write path can be implemented;
- the future gateway must enforce last-admin and self-lockout protection server-side;
- normal users and unauthenticated users must not be able to invoke admin operations.

## Bootstrap and recovery posture

The first T012 slice does not yet implement the bootstrap script or admin UI.

Discovery result:

- a safe bootstrap path still needs to be designed;
- recovery / password reset can use the Better Auth password-reset surface, but the application policy must decide whether it is shown as a one-time local-only credential or a reset flow;
- no plaintext temporary credentials should be persisted or logged;
- no email delivery mechanism has been introduced.

## Proof coverage matrix

| Requirement | How proven | File / script | Status |
| --- | --- | --- | --- |
| Public signup remains disabled | App auth config inspection | `src/lib/auth.ts`, `scripts/e011-t012-user-admin-proof.ts` | Proven |
| Telemetry remains disabled | App auth config inspection | `src/lib/auth.ts`, `scripts/e011-t012-user-admin-proof.ts` | Proven |
| Installed admin APIs are known | Installed package source inspection | `node_modules/better-auth/dist/plugins/admin/*` | Proven |
| Password / recovery APIs are known | Installed package source inspection | `node_modules/better-auth/dist/api/routes/password.mjs` | Proven |
| Prisma schema contains the required admin fields | Schema inspection | `prisma/schema.prisma`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| No full admin UI is present yet | Repo inspection | `src/app/admin/*` not present | Proven |
| Last-admin / self-lockout enforcement | Deferred to gateway implementation | `docs/verification/e011-t012-user-admin-recovery.md` | Deferred |
| Session revocation policy | Deferred to gateway implementation | `docs/verification/e011-t012-user-admin-recovery.md` | Deferred |
| Recovery token handling policy | Deferred to gateway implementation | `docs/verification/e011-t012-user-admin-recovery.md` | Deferred |

## Admin schema and gateway foundation slice

This slice adds the minimum schema and server-side policy foundation needed for a controlled admin gateway.

### Schema migration summary

- Added the Better Auth admin fields required by the installed plugin surface.
- Migration file: `prisma/migrations/20260709000000_add_better_auth_admin_fields/migration.sql`
- The migration intentionally uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to accommodate pre-provisioned development databases during rollout. Prisma's migration ledger remains the normal source of migration state; this syntax does not prove that a pre-existing column has the expected type, nullability, or default.
- Added fields:
  - `user.role`
  - `user.banned`
  - `user.banReason`
  - `user.banExpires`
  - `session.impersonatedBy`

### Better Auth admin plugin runtime boundary

- `src/lib/auth.ts` keeps the Better Auth admin plugin runtime disabled for now.
- The plugin was discovered and the schema was prepared. The current public handler is executable-proofed to return 404 for every installed admin-plugin path; a safe future runtime-enabled architecture remains deferred.
- Public signup remains disabled.
- Telemetry remains disabled.
- Better Auth remains self-hosted through the existing app auth route.

### Gateway foundation

- `src/lib/admin-policy.ts` defines the ClarioBase admin role contract and a fail-closed prohibited capability list.
- `src/lib/user-admin-gateway.ts` exposes a narrow server-side gateway foundation; it accepts request headers and resolves the actor from Better Auth rather than accepting caller-supplied actor data.
- Approved operations are limited to:
  - list users
  - create controlled user
  - update basic identity fields
  - disable / ban user
  - reactivate / unban user
  - list user sessions
  - revoke user sessions
  - set/reset access through an approved recovery path
- Prohibited operations fail closed:
  - impersonation
  - hard delete
  - arbitrary Better Auth endpoint forwarding
  - organization operations
  - team operations
  - workspace operations

### Last-admin and self-lockout policy

- The gateway foundation exposes fail-closed placeholders for last-admin protection and self-lockout prevention.
- Disable/ban and role-change capability checks return false even for an authenticated admin until data-backed protection exists.
- A full data-backed enforcement path remains deferred.

### What is implemented now

- Prisma schema and migration for the admin fields.
- Better Auth admin plugin contract inspection, with runtime configuration intentionally absent.
- Narrow ClarioBase admin policy module.
- Unmounted server-side admin gateway foundation with fail-closed prohibited operations; no public route or client import exposes it.
- Proof coverage for schema, plugin, policy, and gateway foundations.

### What remains deferred

- Full admin UI.
- Bootstrap flow.
- Recovery delivery flow.
- Concrete admin CRUD and session mutation implementations.
- Any impersonation, hard delete, org/team/workspace, or arbitrary forwarding surface.
- Better Auth admin plugin runtime enablement until raw endpoint restrictions are proven.

### Updated proof coverage

| Requirement | How proven | File / script | Status |
| --- | --- | --- | --- |
| Prisma schema contains required admin fields | Schema inspection | `prisma/schema.prisma`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Migration exists and includes only expected admin fields | Migration inspection | `prisma/migrations/20260709000000_add_better_auth_admin_fields/migration.sql` | Proven |
| Better Auth admin plugin is absent from the public runtime handler | Executable requests to every installed `/admin/*` plugin path | `src/lib/auth.ts`, `src/app/api/auth/[...all]/route.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven; every path returns 404 |
| Public signup remains disabled | App auth config inspection | `src/lib/auth.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Telemetry remains disabled | App auth config inspection | `src/lib/auth.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| No org/team/workspace/invitation schema added | Prisma schema inspection | `prisma/schema.prisma` | Proven |
| Policy allows only admin/user default roles | Policy inspection | `src/lib/admin-policy.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Prohibited operations fail closed | Gateway proof | `src/lib/user-admin-gateway.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Non-admin role is rejected by policy | Pure policy proof | `src/lib/admin-policy.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven; a real signed-in normal-user request remains deferred |
| Unauthenticated admin operation fails | Gateway proof | `src/lib/user-admin-gateway.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Last-admin protection placeholder fails closed | Gateway proof | `src/lib/user-admin-gateway.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven; data-backed enforcement deferred |
| Self-lockout protection placeholder fails closed | Gateway proof | `src/lib/user-admin-gateway.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven; data-backed enforcement deferred |
| No secrets printed in proof output | Proof output inspection | `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |

## Explicit exclusions

- No schema migration for admin plugin fields beyond the required user/session columns.
- No admin gateway implementation beyond the narrow foundation.
- No bootstrap script implementation.
- No recovery flow implementation.
- No admin UI.
- No public signup.
- No NextAuth.
- No OAuth, MFA, passkeys, social login, or SSO.
- No organizations, memberships, teams, invitations, or workspaces.
- No RBAC/permission builder.
- No production deployment.

## Residual risks

- The admin plugin exposes powerful account-management endpoints, including impersonation and destructive operations, so the app must wrap it with a narrow ClarioBase-owned gateway before any UI work.
- Existing databases still require the checked-in migration, and `IF NOT EXISTS` cannot detect a conflicting pre-existing column definition.
- Bootstrap and recovery flows still need a policy decision before implementation.

## Explicit exclusions

- No NextAuth
- No public signup
- No OAuth, MFA, passkeys, or SSO
- No organizations, memberships, invitations, teams, or workspaces
- No RBAC/permission builder
- No impersonation surface in the ClarioBase UI
- No hard delete in the CRM UI or gateway
- No production deployment
- No full administrator UI yet
