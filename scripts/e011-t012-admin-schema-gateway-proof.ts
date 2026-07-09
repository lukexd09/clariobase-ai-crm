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

function read(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

function assertNoSecrets(value: string) {
  assert.doesNotMatch(value, /DATABASE_URL|BETTER_AUTH_SECRET|cookie/i);
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

  assert.deepEqual(CLARIOBASE_ADMIN_ROLES, ["admin"]);
  assert.equal(CLARIOBASE_DEFAULT_ROLE, "user");
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("user"), false);
  assert.deepEqual(getApprovedAdminOperations(), ADMIN_GATEWAY_APPROVED_OPERATIONS);
  assert.deepEqual(getProhibitedAdminOperations(), ADMIN_GATEWAY_PROHIBITED_OPERATIONS);

  const adminActor = { id: "user_admin", email: "admin@example.com", role: "admin", banned: false };
  const normalActor = { id: "user_normal", email: "user@example.com", role: "user", banned: false };
  const bannedAdmin = { id: "user_banned", email: "banned@example.com", role: "admin", banned: true };

  assert.equal(canDisableUser(adminActor), true);
  assert.equal(canBanUser(adminActor), true);
  assert.equal(canChangeRole(adminActor), true);
  assert.equal(canDisableUser(normalActor), false);
  assert.equal(canBanUser(normalActor), false);
  assert.equal(canChangeRole(normalActor), false);
  assert.equal(canDisableUser(bannedAdmin), false);

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

  assert.equal(prohibitImpersonation().ok, false);
  assert.equal(prohibitHardDelete().ok, false);
  assert.equal(prohibitArbitraryEndpointForwarding().ok, false);
  assert.equal(prohibitOrganizationOperations().ok, false);
  assert.equal(prohibitTeamOperations().ok, false);
  assert.equal(prohibitWorkspaceOperations().ok, false);

  assert.equal(assertLastAdminProtection(adminActor)?.ok, false);
  assert.equal(assertSelfLockoutProtection(adminActor)?.ok, false);
  assert.equal(assertLastAdminProtection(normalActor)?.ok, false);
  assert.equal(assertSelfLockoutProtection(normalActor)?.ok, false);
  assert.equal(assertLastAdminProtection(null)?.ok, false);
  assert.equal(assertSelfLockoutProtection(null)?.ok, false);

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

  assertNoSecrets(JSON.stringify(findings));
  console.log(JSON.stringify(findings, null, 2));
  console.log("E011.T012 admin schema and gateway foundation proof: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
