import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildAuthOptions } from "@/lib/auth";

function read(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

function assertNoSecrets(value: string) {
  assert.doesNotMatch(value, /DATABASE_URL|BETTER_AUTH_SECRET|cookie/i);
}

async function main() {
  const authOptions = buildAuthOptions();
  assert.equal(authOptions.emailAndPassword.enabled, true);
  assert.equal(authOptions.emailAndPassword.disableSignUp, true);
  assert.equal(authOptions.telemetry.enabled, false);
  assert.equal(authOptions.telemetry.debug, false);
  assert.equal(authOptions.advanced.useSecureCookies, false);
  assert.equal(authOptions.advanced.trustedProxyHeaders, false);
  assert.deepEqual(authOptions.disabledPaths, ["/sign-up/email"]);

  const { admin } = await import("better-auth/plugins/admin");
  const plugin = admin({ defaultRole: "user", adminRoles: ["admin"] });

  assert.equal(plugin.id, "admin");
  const endpointNames = Object.keys(plugin.endpoints).sort();
  assert.deepEqual(endpointNames, [
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
  ]);

  assert.deepEqual(Object.keys(plugin.schema.user.fields).sort(), [
    "banExpires",
    "banReason",
    "banned",
    "role"
  ]);
  assert.deepEqual(Object.keys(plugin.schema.session.fields).sort(), ["impersonatedBy"]);

  const schema = read("prisma/schema.prisma");
  const requiredSchemaFields = [
    "role          String    @default(\"user\")",
    "banned        Boolean   @default(false)",
    "banReason     String?",
    "banExpires    DateTime?",
    "impersonatedBy String?"
  ];
  const currentSchemaHasAdminFields = requiredSchemaFields.every((field) => schema.includes(field));
  const currentSchemaMissingAdminFields = requiredSchemaFields.filter((field) => !schema.includes(field));

  const authRoute = read("src/app/api/auth/[...all]/route.ts");
  assert(authRoute.includes("toNextJsHandler(auth)"));
  assert(authRoute.includes("withAuthProxyContract"));

  const appAuth = read("src/lib/auth.ts");
  assert(appAuth.includes("disableSignUp: true"));
  assert(appAuth.includes("telemetry: {"));

  const inventory = read("docs/verification/e011-t011-boundary-inventory.md");
  assert(inventory.includes("/imports"));

  const findings = {
    adminCapabilityCount: endpointNames.length,
    defaultRoles: ["admin", "user"],
    requiredSchemaFields: {
      user: Object.keys(plugin.schema.user.fields).length,
      session: Object.keys(plugin.schema.session.fields).length
    },
    currentSchemaHasAdminFields,
    currentSchemaMissingAdminFields,
    schemaImpact: currentSchemaHasAdminFields
      ? "no migration required for the core Better Auth admin surface"
      : "schema changes required before gateway implementation",
    signupDisabled: true,
    telemetryDisabled: true
  };

  assertNoSecrets(JSON.stringify(findings));
  console.log(JSON.stringify(findings, null, 2));
  console.log("E011.T012 discovery proof: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
