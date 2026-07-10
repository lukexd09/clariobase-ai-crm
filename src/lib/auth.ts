import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";

import { prisma } from "@/lib/prisma";

function readAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for Better Auth");
  }

  if (secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
  }

  return secret;
}

function readAuthBaseUrl() {
  const baseURL = process.env.BETTER_AUTH_URL;

  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL is required for Better Auth");
  }

  const parsed = new URL(baseURL);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use http or https");
  }

  return baseURL;
}

type AuthDatabaseClient = Parameters<typeof prismaAdapter>[0];

export function buildAuthOptions(databaseClient: AuthDatabaseClient = prisma) {
  const baseURL = readAuthBaseUrl();

  return {
    appName: "ClarioBase",
    baseURL,
    database: prismaAdapter(databaseClient, {
      provider: "postgresql"
    }),
    plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
    trustedOrigins: [new URL(baseURL).origin],
    emailAndPassword: { enabled: true, disableSignUp: true },
    secret: readAuthSecret(),
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
