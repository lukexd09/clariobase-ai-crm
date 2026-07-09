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
- the current Prisma schema does not yet contain the Better Auth admin-related columns needed by the installed plugin surface.

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

The installed admin plugin exposes schema fields that are required by the plugin contract and are not yet present in the current Prisma schema:

- `user.role`
- `user.banned`
- `user.banReason`
- `user.banExpires`
- `session.impersonatedBy`

That means the first T012 slice still needs a schema migration before any real gateway implementation can write those fields.

Current repository Prisma schema status:

- `user` table exists for core auth and does not yet carry the admin role/ban columns;
- `session` table exists for core auth and does not yet carry the impersonation marker column;
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
| Current Prisma schema already contains the required admin fields | Schema inspection | `prisma/schema.prisma`, `scripts/e011-t012-user-admin-proof.ts` | Not yet proven; schema gap confirmed |
| No full admin UI is present yet | Repo inspection | `src/app/admin/*` not present | Proven |
| Last-admin / self-lockout enforcement | Deferred to gateway implementation | `docs/verification/e011-t012-user-admin-recovery.md` | Deferred |
| Session revocation policy | Deferred to gateway implementation | `docs/verification/e011-t012-user-admin-recovery.md` | Deferred |
| Recovery token handling policy | Deferred to gateway implementation | `docs/verification/e011-t012-user-admin-recovery.md` | Deferred |

## Admin schema and gateway foundation slice

This slice adds the minimum schema and server-side policy foundation needed for a controlled admin gateway.

### Schema migration summary

- Added the Better Auth admin fields required by the installed plugin surface.
- Migration file: `prisma/migrations/20260709000000_add_better_auth_admin_fields/migration.sql`
- Added fields:
  - `user.role`
  - `user.banned`
  - `user.banReason`
  - `user.banExpires`
  - `session.impersonatedBy`

### Better Auth admin plugin config

- `src/lib/auth.ts` now enables the installed Better Auth admin plugin with:
  - `defaultRole: "user"`
  - `adminRoles: ["admin"]`
- Public signup remains disabled.
- Telemetry remains disabled.
- Better Auth remains self-hosted through the existing app auth route.

### Gateway foundation

- `src/lib/admin-policy.ts` defines the ClarioBase admin role contract and a fail-closed prohibited capability list.
- `src/lib/user-admin-gateway.ts` exposes a narrow server-only gateway foundation.
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

- The gateway foundation exposes pure policy checks for last-admin protection and self-lockout prevention.
- The current slice keeps those checks fail-closed and policy-testable.
- A full data-backed enforcement path remains deferred.

### What is implemented now

- Prisma schema and migration for the admin fields.
- Better Auth admin plugin configuration.
- Narrow ClarioBase admin policy module.
- Server-only admin gateway foundation with fail-closed prohibited operations.
- Proof coverage for schema, plugin, policy, and gateway foundations.

### What remains deferred

- Full admin UI.
- Bootstrap flow.
- Recovery delivery flow.
- Concrete admin CRUD and session mutation implementations.
- Any impersonation, hard delete, org/team/workspace, or arbitrary forwarding surface.

### Updated proof coverage

| Requirement | How proven | File / script | Status |
| --- | --- | --- | --- |
| Prisma schema contains required admin fields | Schema inspection | `prisma/schema.prisma`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Migration exists and includes only expected admin fields | Migration inspection | `prisma/migrations/20260709000000_add_better_auth_admin_fields/migration.sql` | Proven |
| Better Auth admin plugin config is present | Source inspection | `src/lib/auth.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Public signup remains disabled | App auth config inspection | `src/lib/auth.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Telemetry remains disabled | App auth config inspection | `src/lib/auth.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| No org/team/workspace/invitation schema added | Prisma schema inspection | `prisma/schema.prisma` | Proven |
| Policy allows only admin/user default roles | Policy inspection | `src/lib/admin-policy.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Prohibited operations fail closed | Gateway proof | `src/lib/user-admin-gateway.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Normal user admin operation fails | Gateway proof | `src/lib/user-admin-gateway.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Unauthenticated admin operation fails | Gateway proof | `src/lib/user-admin-gateway.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Last-admin protection policy fails closed | Policy proof | `src/lib/admin-policy.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
| Self-lockout protection policy fails closed | Policy proof | `src/lib/admin-policy.ts`, `scripts/e011-t012-admin-schema-gateway-proof.ts` | Proven |
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
- The schema is not yet compatible with the plugin’s admin fields, so the main risk now includes a required migration before gateway design can be finished.
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
