# Better Auth Authentication

- Exact proof version: `better-auth@1.6.23`
- Adapter: `@better-auth/prisma-adapter@1.6.23`
- Helper CLI used for schema generation: `@better-auth/cli@1.4.21`

## Runtime contract

- Better Auth is self-hosted inside ClarioBase.
- No Better Auth-operated runtime service is required.
- `@better-auth/infra` is not installed or required.
- Telemetry is disabled in the proof harness.
- Public registration is disabled in the proof runtime.
- Organization plugin is not enabled.

## Session and credential ownership

- Password hashing and verification are owned by Better Auth.
- Session records are database-backed.
- Server-side session validation uses the proof database connection directly.
- Logout / revoke invalidates the existing session.

## Cookie and origin policy

- Session cookies are captured from server headers and not logged with values.
- Trusted origins are explicitly set in the proof runtime.
- Origin and redirect protection remain enabled.

## Known limitations

- The proof harness is isolated and is not the production CRM auth flow.
- The proof schema is a reviewable snapshot for E011.T008 only.
- Offline source rebuild was not proven here; only the offline restore path was proven.
