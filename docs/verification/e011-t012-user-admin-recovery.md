---
title: E011.T012 controlled user administration and account recovery
document_id: DOC-E011-T012-USER-ADMIN-RECOVERY
document_type: verification
status: implemented
scope: clariobase-ai-crm
owner: project
last_updated: 2026-07-11
related_epic: E011
related_tasks:
  - E011.T012
tags:
  - verification
  - better-auth
  - admin
  - recovery
---

# E011.T012 controlled user administration and account recovery

## Outcome

ClarioBase uses Better Auth 1.6.23 official admin APIs behind a typed, server-owned gateway. The application provides controlled account provisioning, identity updates, disable/reactivate, session inspection/revocation, and administrator-driven password recovery. Public signup remains disabled. Successful admin lifecycle changes emit bounded durable audit rows.

## Runtime boundary

- `src/lib/auth.ts` configures one admin-enabled Better Auth instance. This keeps role/ban hydration and the plugin's banned-session creation hook consistent with public sign-in.
- `src/app/api/auth/[...all]/route.ts` applies a method-independent firewall before Better Auth. The exact `/api/auth/admin` namespace and all descendants return 404.
- Firewall proof includes every installed admin endpoint plus encoded, repeated-slash, case, and backslash-style bypass variants.
- `src/lib/user-admin-gateway.ts` calls only approved official `auth.api` methods in-process. It does not accept endpoint names and cannot call impersonation or hard delete.
- Every interactive gateway operation receives server request headers and resolves the actor from an authoritative database-backed session. Caller-supplied actor data is ignored.

## Approved operations

- list and get users;
- create a controlled user with the default `user` role;
- update only name and email;
- disable/ban and reactivate/unban;
- list sessions and revoke one or all target sessions;
- set a target user's password and revoke all target sessions in the same transaction.

The gateway does not expose impersonation, stop-impersonation, hard delete, role mutation, organization, team, workspace, or arbitrary forwarding operations.

## Authorization and lifecycle policy

- The actor must have `role === "admin"` and `banned === false` in the authoritative session record.
- Unauthenticated and signed-in normal users fail closed.
- Administrators cannot disable themselves, revoke their own sessions through the admin UI, or use the administrator recovery operation on themselves.
- Disabling a user uses official `banUser`, which deletes the target's sessions.
- Reactivation uses official `unbanUser`; it does not create a session or reveal credentials.
- Password recovery uses official `setUserPassword`, followed by official `revokeUserSessions`.

## Last-active-admin invariant

The actor lookup, active-admin count, invariant check, and official Better Auth mutation share one Prisma interactive transaction. A transaction-bound Prisma adapter is passed to a transaction-local Better Auth instance.

- Isolation level: Serializable.
- Retry limit: three attempts for Prisma serialization conflicts.
- Sustained conflicts fail the operation; the invariant is never weakened.
- The disposable-PostgreSQL proof runs two active administrators concurrently disabling each other and verifies that exactly one remains active.

## First-admin bootstrap

Run the offline command only against the intended deployment database:

```powershell
$env:CLARIOBASE_BOOTSTRAP_ENABLED = "1"
$env:CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL = "admin@example.test"
$env:CLARIOBASE_BOOTSTRAP_ADMIN_NAME = "Administrator"
# Inject CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD through the approved secret mechanism.
corepack pnpm admin:bootstrap
```

The command:

- requires the explicit enable flag and all three input variables;
- uses headerless official `auth.api.createUser` only inside the offline command;
- creates an admin only while the user table is empty;
- is atomic under Serializable isolation and idempotent for the already-active bootstrap identity;
- never prints the email or password.

## Schema and migration

The prepared Better Auth plugin fields are:

- `user.role`
- `user.banned`
- `user.banReason`
- `user.banExpires`
- `session.impersonatedBy`

Migration: `prisma/migrations/20260709000000_add_better_auth_admin_fields/migration.sql`.

The migration intentionally uses `ADD COLUMN IF NOT EXISTS` for pre-provisioned development databases. Prisma's migration ledger remains authoritative; the SQL cannot validate the type, nullability, or default of a conflicting pre-existing column.

## Administrator UI

`/admin/users` is a protected, server-rendered page. It includes labelled forms, status/alert announcements, controlled provisioning, identity updates, disable/reactivate, password recovery, and session management. Redirect feedback uses bounded `noticeCode` values that are resolved inside the app to approved messages. Gateway results and rendered forms contain only opaque session IDs; session tokens remain server-side and are resolved only for the official revoke call.

## Executable proof

Run:

```powershell
corepack pnpm e011:t012:admin-proof
```

`scripts/admin-user-access-proof.ts` creates disposable PostgreSQL and proves:

| Requirement | Evidence |
| --- | --- |
| Transaction-bound official writes | User and credential account created inside a transaction and both rolled back |
| Atomic/idempotent bootstrap | Two concurrent bootstrap calls produce one creation and one idempotent result |
| Public signup disabled | Official signup call rejects |
| Raw admin endpoints prohibited | All installed admin paths and bypass variants return 404 |
| Server-resolved actor | Forged caller actor is ignored; missing session returns 401 |
| Normal-user authorization | Real signed-in normal user receives 403 |
| Disabled-user behavior | Ban revokes sessions and subsequent sign-in rejects |
| Reactivation | Official unban permits sign-in again without issuing credentials |
| Session management | List, revoke-one by safe session ID, and revoke-all operate against persisted sessions without returning tokens |
| Recovery | Password changes through official API, old password fails, all sessions are revoked |
| Durable audit trail | Successful bootstrap, create, update, disable, reactivate, password reset, revoke-one, and revoke-all operations each create one bounded audit row |
| Self-lockout | Self-disable is rejected |
| Last active admin | Concurrent cross-disable leaves exactly one active admin |
| No custom credential writes | Production gateway/bootstrap source contains no account credential mutation |
| Secret hygiene | Proof output contains no database URL, auth secret, password, email, cookie, or token |

## Explicit exclusions

- No public signup.
- No impersonation or hard delete.
- No organizations, memberships, invitations, teams, or workspaces.
- No arbitrary RBAC/permission builder.
- No role-management UI.
- No OAuth, MFA, passkeys, social login, SSO, or email delivery.
- No production deployment in this task.

## Residual risks

- The public namespace firewall is security-critical and must be re-proven when Better Auth or routing changes.
- Existing databases must apply the checked-in migration and separately detect incompatible pre-existing columns.
- Sustained Serializable contention returns a generic operation failure after three attempts.
- Email-based recovery delivery remains deferred.
