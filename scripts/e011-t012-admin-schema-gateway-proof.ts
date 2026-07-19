import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ADMIN_GATEWAY_APPROVED_OPERATIONS,
  ADMIN_GATEWAY_PROHIBITED_OPERATIONS,
  assertLastAdminProtection,
  assertSelfLockoutProtection,
  createControlledUser,
  disableUser,
  listUserSessions,
  listUsers,
  prohibitArbitraryEndpointForwarding,
  prohibitHardDelete,
  prohibitImpersonation,
  prohibitOrganizationOperations,
  prohibitTeamOperations,
  prohibitWorkspaceOperations,
  reactivateUser,
  setUserPassword
} from "@/lib/user-admin-gateway";
import {
  CLARIOBASE_ADMIN_ROLES,
  CLARIOBASE_DEFAULT_ROLE,
  canBanUser,
  canChangeRole,
  canDisableUser,
  getApprovedAdminOperations,
  getProhibitedAdminOperations,
  isAdminRole
} from "@/lib/admin-policy";
import { buildAuthOptions } from "@/lib/auth";
import { GET as authGet, POST as authPost } from "@/app/api/auth/[...all]/route";

function read(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

function assertNoSecrets(value: string) {
  assert.doesNotMatch(value, /DATABASE_URL|BETTER_AUTH_SECRET|cookie/i);

  for (const secret of [process.env.DATABASE_URL, process.env.BETTER_AUTH_SECRET]) {
    if (secret) {
      assert.equal(value.includes(secret), false, "proof output contains a configured secret value");
    }
  }
}

async function main() {
  const schema = read("prisma/schema.prisma");
  for (const field of [
    "role          String    @default(\"user\")",
    "banned        Boolean   @default(false)",
    "banReason     String?",
    "banExpires    DateTime?",
    "impersonatedBy String?"
  ]) {
    assert(schema.includes(field), `schema missing expected admin field: ${field}`);
  }

  const migrationFiles = ["prisma/migrations/20260709000000_add_better_auth_admin_fields/migration.sql"];
  const migrationSql = read(migrationFiles[0]);
  for (const snippet of [
    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT \'user\';',
    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN NOT NULL DEFAULT false;',
    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" TEXT;',
    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMP(3);',
    'ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonatedBy" TEXT;'
  ]) {
    assert(migrationSql.includes(snippet), `migration missing expected admin field statement: ${snippet}`);
  }
  assert.equal(migrationSql.match(/ALTER TABLE/g)?.length ?? 0, 5);
  assert.deepEqual(
    [...migrationSql.matchAll(/ALTER TABLE "([^"]+)" ADD COLUMN IF NOT EXISTS "([^"]+)"/g)]
      .map((match) => `${match[1]}.${match[2]}`),
    ["user.role", "user.banned", "user.banReason", "user.banExpires", "session.impersonatedBy"]
  );
  assert.doesNotMatch(migrationSql, /\b(?:CREATE|DROP|DELETE|INSERT|UPDATE|TRUNCATE)\b/i);

  assert.doesNotMatch(
    schema,
    /^\s*model\s+(?:organization|member|invitation|team|workspace)\b/im,
    "organization/team/workspace schema is outside this slice"
  );

  const authOptions = buildAuthOptions();
  assert.equal(authOptions.emailAndPassword.enabled, true);
  assert.equal(authOptions.emailAndPassword.disableSignUp, true);
  assert.equal(authOptions.telemetry.enabled, false);
  assert.equal(authOptions.telemetry.debug, false);
  assert.ok(!("plugins" in authOptions) || !authOptions.plugins || authOptions.plugins.length === 0);

  const { admin } = await import("better-auth/plugins/admin");
  const plugin = admin({ defaultRole: "user", adminRoles: ["admin"] });
  assert.equal(plugin.id, "admin");
  assert.deepEqual(
    Object.keys(plugin.endpoints).sort(),
    [
      "adminUpdateUser",
      "banUser",
      "createUser",
      "getUser",
      "impersonateUser",
      "listUserSessions",
      "listUsers",
      "removeUser",
      "revokeUserSession",
      "revokeUserSessions",
      "setRole",
      "setUserPassword",
      "stopImpersonating",
      "unbanUser",
      "userHasPermission"
    ]
  );

  for (const endpoint of Object.values(plugin.endpoints)) {
    const route = endpoint as { path: string; options: { method: "GET" | "POST" } };
    const request = new Request(`http://localhost:3000/api/auth${route.path}`, {
      method: route.options.method,
      ...(route.options.method === "POST"
        ? { headers: { "content-type": "application/json" }, body: "{}" }
        : {})
    });
    const response = route.options.method === "GET" ? await authGet(request) : await authPost(request);
    assert.equal(response.status, 404, `public auth handler unexpectedly exposes ${route.path}`);
  }

  assert.deepEqual(CLARIOBASE_ADMIN_ROLES, ["admin"]);
  assert.equal(CLARIOBASE_DEFAULT_ROLE, "user");
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("user"), false);
  assert.deepEqual(getApprovedAdminOperations(), ADMIN_GATEWAY_APPROVED_OPERATIONS);
  assert.deepEqual(getProhibitedAdminOperations(), ADMIN_GATEWAY_PROHIBITED_OPERATIONS);

  const adminActor = { id: "user_admin", email: "admin@example.com", role: "admin", banned: false };
  const normalActor = { id: "user_normal", email: "user@example.com", role: "user", banned: false };
  const bannedAdmin = { id: "user_banned", email: "banned@example.com", role: "admin", banned: true };
  const unknownBanStateAdmin = { id: "user_unknown", email: "unknown@example.com", role: "admin", banned: null };

  assert.equal(canDisableUser(adminActor), false);
  assert.equal(canBanUser(adminActor), false);
  assert.equal(canChangeRole(adminActor), false);
  assert.equal(canDisableUser(normalActor), false);
  assert.equal(canBanUser(normalActor), false);
  assert.equal(canChangeRole(normalActor), false);
  assert.equal(canDisableUser(bannedAdmin), false);
  assert.equal(canDisableUser(unknownBanStateAdmin), false);

  assert.equal((await listUsers()).ok, false);
  assert.equal((await createControlledUser()).ok, false);
  assert.equal((await disableUser()).ok, false);
  assert.equal((await reactivateUser()).ok, false);
  assert.equal((await listUserSessions()).ok, false);
  assert.equal((await setUserPassword()).ok, false);

  assert.equal((await listUsers({ headers: new Headers() })).ok, false);
  assert.equal((await createControlledUser({ headers: new Headers() })).ok, false);
  assert.equal((await disableUser({ headers: new Headers() })).ok, false);
  assert.equal((await reactivateUser({ headers: new Headers() })).ok, false);
  assert.equal((await listUserSessions({ headers: new Headers() })).ok, false);
  assert.equal((await setUserPassword({ headers: new Headers() })).ok, false);

  const callerSuppliedActor = { headers: new Headers(), actor: adminActor } as Parameters<typeof listUsers>[0];
  const callerActorResult = await listUsers(callerSuppliedActor);
  assert.equal(callerActorResult.ok, false);
  assert.equal(callerActorResult.status, 401, "gateway must ignore caller-supplied actor data");

  assert.equal(prohibitImpersonation().ok, false);
  assert.equal(prohibitHardDelete().ok, false);
  assert.equal(prohibitArbitraryEndpointForwarding().ok, false);
  assert.equal(prohibitOrganizationOperations().ok, false);
  assert.equal(prohibitTeamOperations().ok, false);
  assert.equal(prohibitWorkspaceOperations().ok, false);

  assert.equal(assertLastAdminProtection().ok, false);
  assert.equal(assertSelfLockoutProtection().ok, false);

  const findings = {
    addedSchemaFields: 5,
    migrationFiles,
    adminCapabilities: Object.keys(plugin.endpoints).sort(),
    approvedOperations: [...ADMIN_GATEWAY_APPROVED_OPERATIONS],
    prohibitedOperations: [...ADMIN_GATEWAY_PROHIBITED_OPERATIONS],
    adminPluginRuntimeEnabled: false,
    signupDisabled: true,
    telemetryDisabled: true,
    noOrgTeamWorkspaceSchema: true,
    noSecretsPrinted: true
  };

  const proofOutput = `${JSON.stringify(findings, null, 2)}\nE011.T012 admin schema and gateway foundation proof: PASS`;
  assertNoSecrets(proofOutput);
  console.log(proofOutput);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
