import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PrismaClient } from "@/generated/prisma/client";
import { ADMIN_AUDIT_OPERATIONS, ADMIN_AUDIT_OUTCOMES } from "@/lib/admin-audit";
import { resolveAdminUserNoticeMessage } from "@/lib/admin-user-notices";

const containerName = `clariobase-auth-t012-${process.pid}`;
const databaseName = "clariobase_auth_t012";
const postgresPassword = "clariobase_test_password";
const postgresPort = 55434;
const databaseUrl = `postgresql://postgres:${postgresPassword}@127.0.0.1:${postgresPort}/${databaseName}?schema=public`;
const authSecret = "clariobase-t012-proof-secret-clariobase-t012-proof-secret";
const schemaPath = `${process.cwd()}/prisma/schema.prisma`;
const sensitiveProofValues = [databaseUrl, postgresPassword, authSecret];

class ExpectedRollback extends Error {}

function run(command: string, args: string[], env: Partial<NodeJS.ProcessEnv> = {}) {
  execFileSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "ignore"
  });
}

async function waitForPostgres() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      run("docker", ["exec", containerName, "pg_isready", "-U", "postgres"]);
      return;
    } catch {
      await delay(500);
    }
  }

  throw new Error("Disposable PostgreSQL did not become ready");
}

async function proveTransactionBoundAdapter(prisma: PrismaClient) {
  const proofEmail = `transaction-${randomUUID()}@example.test`;

  await assert.rejects(
    prisma.$transaction(async (transaction) => {
      const transactionAuth = betterAuth({
        appName: "ClarioBase transaction proof",
        baseURL: "http://127.0.0.1:3000",
        database: prismaAdapter(transaction, { provider: "postgresql" }),
        emailAndPassword: { enabled: true, disableSignUp: true },
        plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
        secret: authSecret,
        telemetry: { enabled: false, debug: false }
      });

      const created = await transactionAuth.api.createUser({
        body: {
          email: proofEmail,
          name: "Transaction Proof",
          password: "transaction-proof-password-123456",
          role: "admin"
        }
      });

      assert.equal(created.user.role, "admin");
      assert.equal(await transaction.user.count({ where: { email: proofEmail } }), 1);
      assert.equal(await transaction.account.count({ where: { userId: created.user.id } }), 1);
      throw new ExpectedRollback("rollback proves the adapter used the transaction client");
    }, { isolationLevel: "Serializable" }),
    ExpectedRollback
  );

  assert.equal(await prisma.user.count({ where: { email: proofEmail } }), 0);
  assert.equal(await prisma.account.count({ where: { user: { email: proofEmail } } }), 0);
}

async function installAdminAuditInsertFailureTrigger(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.fail_admin_audit_event_insert()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION 'admin_audit_events insert blocked for proof';
    END;
    $$;
  `);
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS admin_audit_events_fail_insert ON public.admin_audit_events;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER admin_audit_events_fail_insert
    BEFORE INSERT ON public.admin_audit_events
    FOR EACH ROW
    EXECUTE FUNCTION public.fail_admin_audit_event_insert();
  `);
}

async function removeAdminAuditInsertFailureTrigger(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS admin_audit_events_fail_insert ON public.admin_audit_events;
  `);
  await prisma.$executeRawUnsafe(`
    DROP FUNCTION IF EXISTS public.fail_admin_audit_event_insert();
  `);
}

function cookieFrom(response: { headers?: Headers }) {
  const cookie = response.headers?.get("set-cookie");
  assert.ok(cookie, "authentication response did not include a session cookie");
  sensitiveProofValues.push(cookie);
  return cookie;
}

async function captureInternalOutput(operation: () => Promise<void>) {
  const captured: string[] = [];
  const original = { log: console.log, warn: console.warn, error: console.error };
  const capture = (...values: unknown[]) => captured.push(values.map((value) => String(value)).join(" "));
  console.log = capture;
  console.warn = capture;
  console.error = capture;
  try {
    await operation();
  } finally {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  }

  const serialized = captured.join("\n");
  for (const value of sensitiveProofValues) assert.equal(serialized.includes(value), false);
  assert.doesNotMatch(serialized, /postgres(?:ql)?:\/\/|BETTER_AUTH_SECRET|DATABASE_URL|set-cookie/i);
}

async function rejects(operation: () => Promise<unknown>) {
  try {
    await operation();
    return false;
  } catch {
    return true;
  }
}

function headersWithCookie(cookie: string) {
  return new Headers({ cookie });
}

async function proveCompleteAdminFlow(prisma: PrismaClient) {
  process.env.DATABASE_URL = databaseUrl;
  process.env.BETTER_AUTH_URL = "http://127.0.0.1:3000";
  process.env.BETTER_AUTH_SECRET = authSecret;

  const [{ auth }, { bootstrapFirstAdmin }, gateway, publicRoute, firewall] = await Promise.all([
    import("@/lib/auth"),
    import("@/lib/admin-bootstrap"),
    import("@/lib/user-admin-gateway"),
    import("@/app/api/auth/[...all]/route"),
    import("@/lib/auth-admin-firewall")
  ]);

  const adminEmail = `admin-${randomUUID()}@example.test`;
  const adminPassword = "admin-proof-password-123456";
  sensitiveProofValues.push(adminEmail, adminPassword);
  const bootstrapInput = { email: adminEmail, name: "Proof Admin", password: adminPassword };
  const bootstrapResults = await Promise.all([
    bootstrapFirstAdmin(bootstrapInput),
    bootstrapFirstAdmin(bootstrapInput)
  ]);
  assert.deepEqual(bootstrapResults.map((result) => result.created).sort(), [false, true]);
  assert.equal((await bootstrapFirstAdmin(bootstrapInput)).created, false);
  assert.equal(await prisma.user.count(), 1);
  const bootstrapAudit = await prisma.adminAuditEvent.findMany({
    select: {
      id: true,
      actorUserId: true,
      targetUserId: true,
      operation: true,
      outcome: true,
      createdAt: true
    }
  });
  assert.equal(bootstrapAudit.length, 1);
  assert.deepEqual(Object.keys(bootstrapAudit[0]).sort(), [
    "actorUserId",
    "createdAt",
    "id",
    "operation",
    "outcome",
    "targetUserId"
  ]);
  assert.equal(bootstrapAudit[0].actorUserId, null);
  assert.equal(bootstrapAudit[0].targetUserId.length > 0, true);
  assert.equal(bootstrapAudit[0].operation, ADMIN_AUDIT_OPERATIONS[0]);
  assert.equal(bootstrapAudit[0].outcome, ADMIN_AUDIT_OUTCOMES[0]);

  const approvedNotice = resolveAdminUserNoticeMessage("user_created");
  assert.equal(approvedNotice, "User created");
  assert.equal(
    renderToStaticMarkup(createElement("div", { role: "alert" }, approvedNotice)),
    '<div role="alert">User created</div>'
  );

  for (const noticeCode of [
    `<img src=x onerror=alert("${randomUUID()}")>`,
    "constructor",
    "toString",
    "__proto__",
    "hasOwnProperty",
    "",
    "unknown_notice_code"
  ]) {
    const resolvedNotice = resolveAdminUserNoticeMessage(noticeCode);
    const renderedNotice = renderToStaticMarkup(createElement("div", { role: "alert" }, resolvedNotice));
    assert.equal(typeof resolvedNotice, "string");
    assert.equal(resolvedNotice, "Administrator operation failed");
    assert.equal(renderedNotice, '<div role="alert">Administrator operation failed</div>');
    if (noticeCode.length > 0) {
      assert.notEqual(resolvedNotice, noticeCode);
      assert.equal(renderedNotice.includes(noticeCode), false);
    }
    assert.doesNotMatch(renderedNotice, /<img|onerror|alert\(/i);
    assert.doesNotMatch(renderedNotice, /provider/i);
  }

  const adminSignIn = await auth.api.signInEmail({
    body: { email: adminEmail, password: adminPassword },
    returnHeaders: true
  });
  const adminCookie = cookieFrom(adminSignIn);
  const adminHeaders = headersWithCookie(adminCookie);
  const adminId = adminSignIn.response.user.id;

  assert.equal(await rejects(() => auth.api.signUpEmail({
    body: {
      email: `public-${randomUUID()}@example.test`,
      name: "Public signup",
      password: "public-signup-password-123456"
    }
  })), true);

  const installedAdminPaths = [
    "/admin/set-role", "/admin/get-user", "/admin/create-user", "/admin/update-user",
    "/admin/list-users", "/admin/list-user-sessions", "/admin/unban-user", "/admin/ban-user",
    "/admin/impersonate-user", "/admin/stop-impersonating", "/admin/revoke-user-session",
    "/admin/revoke-user-sessions", "/admin/remove-user", "/admin/set-user-password",
    "/admin/has-permission"
  ];
  for (const path of installedAdminPaths) {
    const response = await publicRoute.POST(new Request(`http://127.0.0.1:3000/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    }));
    assert.equal(response.status, 404, `public handler exposed ${path}`);
  }
  for (const [method, handler] of [
    ["GET", publicRoute.GET], ["POST", publicRoute.POST], ["PUT", publicRoute.PUT],
    ["PATCH", publicRoute.PATCH], ["DELETE", publicRoute.DELETE]
  ] as const) {
    const response = await handler(new Request("http://127.0.0.1:3000/api/auth/admin/list-users", { method }));
    assert.equal(response.status, 404, `${method} bypassed the public admin namespace firewall`);
  }
  for (const path of [
    "/api/auth/admin", "/api/auth/ADMIN/list-users", "/api/auth/%61dmin/list-users",
    "/api/auth/%2561dmin/list-users", "/api/auth/admin%2flist-users", "/api//auth//admin//list-users",
    "/api/auth\\admin\\list-users"
  ]) {
    assert.equal(firewall.isPublicAdminAuthPath(new Request(`http://127.0.0.1:3000${path}`)), true);
  }

  const forged = await gateway.listUsers({ headers: new Headers(), actor: { id: adminId } } as never);
  assert.equal(forged.ok, false);
  if (!forged.ok) assert.equal(forged.status, 401);

  const auditProofEmail = `audit-rollback-${randomUUID()}@example.test`;
  const auditProofPassword = "audit-rollback-proof-password-123456";
  sensitiveProofValues.push(auditProofEmail, auditProofPassword);
  const auditRowsBeforeFailure = await prisma.adminAuditEvent.count();
  try {
    await installAdminAuditInsertFailureTrigger(prisma);
    const failure = await gateway.createControlledUser(
      { headers: adminHeaders },
      { email: auditProofEmail, name: "Audit Rollback Proof", password: auditProofPassword }
    );
    assert.equal(failure.ok, false);
    if (!failure.ok) {
      assert.equal(failure.status, 500);
      assert.equal(failure.message, "Administrator operation failed");
      assert.match(failure.code, /^admin_(?:provider_error|operation_failed)$/);
    }
    assert.equal(await prisma.user.count({ where: { email: auditProofEmail } }), 0);
    assert.equal(await prisma.account.count({ where: { user: { email: auditProofEmail } } }), 0);
    assert.equal(await prisma.adminAuditEvent.count(), auditRowsBeforeFailure);
  } finally {
    await removeAdminAuditInsertFailureTrigger(prisma);
  }

  const userEmail = `user-${randomUUID()}@example.test`;
  const updatedUserEmail = `user-updated-${randomUUID()}@example.test`;
  const oldPassword = "user-proof-password-123456";
  const newPassword = "user-new-password-123456";
  sensitiveProofValues.push(userEmail, updatedUserEmail, oldPassword, newPassword);
  const created = await gateway.createControlledUser(
    { headers: adminHeaders },
    { email: userEmail, name: "Proof User", password: oldPassword }
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("controlled user creation failed");
  const userId = created.data.id;

  const updated = await gateway.updateBasicIdentity(
    { headers: adminHeaders },
    { userId, email: updatedUserEmail, name: "Updated Proof User" }
  );
  assert.equal(updated.ok, true);
  const fetched = await gateway.getUser({ headers: adminHeaders }, userId);
  assert.equal(fetched.ok, true);
  if (!fetched.ok) throw new Error("updated user lookup failed");
  assert.equal(fetched.data.email, updatedUserEmail);
  assert.equal(fetched.data.name, "Updated Proof User");

  const normalSignIn = await auth.api.signInEmail({
    body: { email: updatedUserEmail, password: oldPassword },
    returnHeaders: true
  });
  const normalCookie = cookieFrom(normalSignIn);
  const normalHeaders = headersWithCookie(normalCookie);
  const normalAttempt = await gateway.listUsers({ headers: normalHeaders });
  assert.equal(normalAttempt.ok, false);
  if (!normalAttempt.ok) assert.equal(normalAttempt.status, 403);

  const deniedOperations = (headers: Headers) => [
    gateway.getUser({ headers }, userId),
    gateway.createControlledUser({ headers }, {
      email: `denied-${randomUUID()}@example.test`,
      name: "Denied User",
      password: "denied-user-password-123456"
    }),
    gateway.updateBasicIdentity({ headers }, { userId, email: updatedUserEmail, name: "Denied Update" }),
    gateway.disableUser({ headers }, { userId }),
    gateway.reactivateUser({ headers }, userId),
    gateway.listUserSessions({ headers }, userId),
    gateway.revokeUserSession({ headers }, "missing-session-id"),
    gateway.revokeUserSessions({ headers }, userId),
    gateway.setUserPassword({ headers }, { userId, newPassword: "denied-reset-password-123456" })
  ];
  for (const result of await Promise.all(deniedOperations(normalHeaders))) {
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 403);
  }
  for (const result of await Promise.all(deniedOperations(new Headers()))) {
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 401);
  }

  const sessionsBeforeDisable = await gateway.listUserSessions({ headers: adminHeaders }, userId);
  assert.equal(sessionsBeforeDisable.ok, true);
  if (!sessionsBeforeDisable.ok) throw new Error("session listing failed");
  assert.ok(sessionsBeforeDisable.data.length >= 1);

  const disabled = await gateway.disableUser({ headers: adminHeaders }, { userId, reason: "proof" });
  assert.equal(disabled.ok, true);
  assert.equal(await prisma.session.count({ where: { userId } }), 0);
  assert.equal(await auth.api.getSession({ headers: normalHeaders }), null);
  assert.equal(await rejects(() => auth.api.signInEmail({
    body: { email: updatedUserEmail, password: oldPassword }
  })), true);

  const reactivated = await gateway.reactivateUser({ headers: adminHeaders }, userId);
  assert.equal(reactivated.ok, true);
  const sessionOne = cookieFrom(await auth.api.signInEmail({
    body: { email: updatedUserEmail, password: oldPassword },
    returnHeaders: true
  }));
  const sessionTwo = cookieFrom(await auth.api.signInEmail({
    body: { email: updatedUserEmail, password: oldPassword },
    returnHeaders: true
  }));
  const listedSessions = await gateway.listUserSessions({ headers: adminHeaders }, userId);
  assert.equal(listedSessions.ok, true);
  if (!listedSessions.ok) throw new Error("session listing after reactivation failed");
  assert.ok(listedSessions.data.length >= 2);
  const revokedOne = await gateway.revokeUserSession(
    { headers: adminHeaders },
    listedSessions.data[0].id
  );
  assert.equal(revokedOne.ok, true);
  assert.equal(await prisma.session.count({ where: { userId } }), listedSessions.data.length - 1);
  const revokedAll = await gateway.revokeUserSessions({ headers: adminHeaders }, userId);
  assert.equal(revokedAll.ok, true);
  assert.equal(await prisma.session.count({ where: { userId } }), 0);
  assert.equal(await auth.api.getSession({ headers: headersWithCookie(sessionOne) }), null);
  assert.equal(await auth.api.getSession({ headers: headersWithCookie(sessionTwo) }), null);

  await auth.api.signInEmail({ body: { email: updatedUserEmail, password: oldPassword } });
  const reset = await gateway.setUserPassword(
    { headers: adminHeaders },
    { userId, newPassword }
  );
  assert.equal(reset.ok, true);
  assert.equal(await prisma.session.count({ where: { userId } }), 0);
  assert.equal(await rejects(() => auth.api.signInEmail({
    body: { email: updatedUserEmail, password: oldPassword }
  })), true);
  await auth.api.signInEmail({ body: { email: updatedUserEmail, password: newPassword } });

  const selfDisable = await gateway.disableUser({ headers: adminHeaders }, { userId: adminId });
  assert.equal(selfDisable.ok, false);
  if (!selfDisable.ok) assert.equal(selfDisable.code, "self_lockout");

  const ownSessions = await gateway.listUserSessions({ headers: adminHeaders }, adminId);
  assert.equal(ownSessions.ok, true);
  if (!ownSessions.ok || ownSessions.data.length === 0) throw new Error("administrator session fixture missing");
  const selfSessionRevoke = await gateway.revokeUserSession({ headers: adminHeaders }, ownSessions.data[0].id);
  assert.equal(selfSessionRevoke.ok, false);
  if (!selfSessionRevoke.ok) assert.equal(selfSessionRevoke.code, "self_lockout");
  const selfAllSessionsRevoke = await gateway.revokeUserSessions({ headers: adminHeaders }, adminId);
  assert.equal(selfAllSessionsRevoke.ok, false);
  if (!selfAllSessionsRevoke.ok) assert.equal(selfAllSessionsRevoke.code, "self_lockout");
  const selfPasswordReset = await gateway.setUserPassword(
    { headers: adminHeaders },
    { userId: adminId, newPassword }
  );
  assert.equal(selfPasswordReset.ok, false);
  if (!selfPasswordReset.ok) assert.equal(selfPasswordReset.code, "self_lockout");

  const secondAdminEmail = `admin-two-${randomUUID()}@example.test`;
  const secondAdminPassword = "admin-two-password-123456";
  sensitiveProofValues.push(secondAdminEmail, secondAdminPassword);
  const secondAdmin = await gateway.createControlledUser(
    { headers: adminHeaders },
    { email: secondAdminEmail, name: "Second Admin", password: secondAdminPassword }
  );
  assert.equal(secondAdmin.ok, true);
  if (!secondAdmin.ok) throw new Error("second admin fixture creation failed");
  await auth.api.setRole({
    headers: adminHeaders,
    body: { userId: secondAdmin.data.id, role: "admin" }
  });
  const secondAdminSignIn = await auth.api.signInEmail({
    body: { email: secondAdminEmail, password: secondAdminPassword },
    returnHeaders: true
  });
  const secondAdminHeaders = headersWithCookie(cookieFrom(secondAdminSignIn));
  const secondAdminId = secondAdminSignIn.response.user.id;

  const competingDisables = await Promise.all([
    gateway.disableUser({ headers: adminHeaders }, { userId: secondAdmin.data.id }),
    gateway.disableUser({ headers: secondAdminHeaders }, { userId: adminId })
  ]);
  assert.equal(competingDisables.filter((result) => result.ok).length, 1);
  assert.equal(await prisma.user.count({ where: { role: "admin", banned: false } }), 1);

  const productionSources = [
    readFileSync("src/lib/user-admin-gateway.ts", "utf8"),
    readFileSync("src/lib/admin-bootstrap.ts", "utf8"),
    readFileSync("scripts/bootstrap-admin.ts", "utf8"),
    readFileSync("src/app/admin/users/actions.ts", "utf8"),
    readFileSync("src/app/admin/users/page.tsx", "utf8")
  ].join("\n");
  assert.doesNotMatch(productionSources, /\b(?:prisma|transaction)\.account\.(?:create|update|upsert|delete)/);
  assert.doesNotMatch(productionSources, /impersonateUser\s*\(|removeUser\s*\(/);
  assert.doesNotMatch(productionSources, /console\.error\([^)]*(?:error|password|secret|email)/i);
  assert.doesNotMatch(productionSources, /result\.message/);
  assert.doesNotMatch(productionSources, /notice=/);
  assert.match(productionSources, /noticeCode/);
  assert.doesNotMatch(productionSources, /error\.body\?\.message/);
  assert.equal("token" in listedSessions.data[0], false, "gateway session results must not expose tokens");
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.doesNotMatch(schema, /^\s*model\s+(?:organization|member|membership|invitation|team|workspace)\b/im);

  const auditRows = await prisma.adminAuditEvent.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      actorUserId: true,
      targetUserId: true,
      operation: true,
      outcome: true,
      createdAt: true
    }
  });
  assert.equal(auditRows.length, 10);
  assert.deepEqual(
    auditRows.map((row) => row.operation),
    [
      "BOOTSTRAP_FIRST_ADMIN",
      "CREATE_CONTROLLED_USER",
      "UPDATE_BASIC_IDENTITY",
      "DISABLE_USER",
      "REACTIVATE_USER",
      "REVOKE_USER_SESSION",
      "REVOKE_USER_SESSIONS",
      "RESET_USER_PASSWORD",
      "CREATE_CONTROLLED_USER",
      "DISABLE_USER"
    ]
  );
  assert.deepEqual(auditRows.map((row) => row.outcome), new Array(10).fill("SUCCESS"));
  assert.equal(auditRows[0].actorUserId, null);
  assert.equal(auditRows[1].actorUserId, adminId);
  assert.equal(auditRows[2].actorUserId, adminId);
  assert.equal(auditRows[3].actorUserId, adminId);
  assert.equal(auditRows[4].actorUserId, adminId);
  assert.equal(auditRows[5].actorUserId, adminId);
  assert.equal(auditRows[6].actorUserId, adminId);
  assert.equal(auditRows[7].actorUserId, adminId);
  assert.equal(auditRows[8].actorUserId, adminId);
  assert.ok([secondAdmin.data.id, secondAdminId].includes(auditRows[8].targetUserId));
  const auditRowsNineActorId = auditRows[9].actorUserId;
  assert.notEqual(auditRowsNineActorId, null);
  assert.ok([adminId, secondAdminId].includes(auditRowsNineActorId!));
  assert.equal(auditRows[1].targetUserId, userId);
  assert.equal(auditRows[2].targetUserId, userId);
  assert.equal(auditRows[3].targetUserId, userId);
  assert.equal(auditRows[4].targetUserId, userId);
  assert.equal(auditRows[5].targetUserId, userId);
  assert.equal(auditRows[6].targetUserId, userId);
  assert.equal(auditRows[7].targetUserId, userId);
  assert.ok([adminId, secondAdmin.data.id].includes(auditRows[9].targetUserId));
}

async function main() {
  run("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    containerName,
    "-e",
    `POSTGRES_PASSWORD=${postgresPassword}`,
    "-e",
    `POSTGRES_DB=${databaseName}`,
    "-p",
    `${postgresPort}:5432`,
    "postgres:16-alpine"
  ]);

  let prisma: PrismaClient | undefined;
  try {
    await waitForPostgres();
    run("node", ["./node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", schemaPath], {
      DATABASE_URL: databaseUrl
    });

    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl })
    });
    await captureInternalOutput(async () => {
      await proveTransactionBoundAdapter(prisma!);
      await proveCompleteAdminFlow(prisma!);
    });

    console.log("TRANSACTION_BOUND_PRISMA_ADAPTER: PASS");
    console.log("ADMIN_AUTHORIZATION_AND_LIFECYCLE: PASS");
    console.log("PUBLIC_ADMIN_NAMESPACE_FIREWALL: PASS");
    console.log("BOOTSTRAP_AND_RECOVERY: PASS");
    console.log("DURABLE_ADMIN_AUDIT_AND_BOUNDED_NOTICES: PASS");
    console.log("NO_CUSTOM_CREDENTIAL_WRITES_OR_SECRET_OUTPUT: PASS");
  } finally {
    await prisma?.$disconnect();
    try {
      run("docker", ["rm", "-f", containerName]);
    } catch {}
  }
}

main().catch((error) => {
  const detail = error instanceof Error ? error.message : "unknown failure";
  const redacted = detail
    .replaceAll(databaseUrl, "[redacted-database-url]")
    .replaceAll(postgresPassword, "[redacted-password]")
    .replaceAll(authSecret, "[redacted-auth-secret]")
    .replace(/[\w.+-]+@[\w.-]+/g, "[redacted-email]");
  console.error(`Admin user access proof failed: ${redacted}`);
  process.exitCode = 1;
});
