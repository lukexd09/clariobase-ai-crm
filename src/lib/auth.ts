import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { createAccessControl } from "better-auth/plugins/access";
import { admin } from "better-auth/plugins/admin";

import { prisma } from "@/lib/prisma";
import { parseAuthRuntimeConfig } from "@/lib/auth-runtime-config";

const adminStatements = {
  user: ["create", "list", "set-role", "ban", "set-password", "set-email", "get", "update"],
  session: ["list", "revoke", "delete"]
} as const;
const adminAccessControl = createAccessControl(adminStatements);
const adminRoles = {
  admin: adminAccessControl.newRole(adminStatements),
  user: adminAccessControl.newRole({ user: [], session: [] })
};

type AuthDatabaseClient = Parameters<typeof prismaAdapter>[0];

export function buildAuthOptions(
  databaseClient: AuthDatabaseClient = prisma,
  environment: Record<string, string | undefined> = process.env
) {
  const runtime = parseAuthRuntimeConfig(environment);

  return {
    appName: "ClarioBase",
    baseURL: runtime.baseURL,
    database: prismaAdapter(databaseClient, {
      provider: "postgresql"
    }),
    plugins: [admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      ac: adminAccessControl,
      roles: adminRoles
    })],
    trustedOrigins: runtime.trustedOrigins,
    emailAndPassword: { enabled: true, disableSignUp: true },
    disabledPaths: ["/sign-up/email"],
    secret: runtime.secret,
    advanced: {
      useSecureCookies: runtime.secureCookies,
      trustedProxyHeaders: false,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: runtime.secureCookies,
        path: "/"
      }
    },
    telemetry: {
      enabled: false,
      debug: false
    }
  };
}

export function createAppAuth(databaseClient: AuthDatabaseClient = prisma) {
  return betterAuth(buildAuthOptions(databaseClient));
}

export const auth = createAppAuth();
