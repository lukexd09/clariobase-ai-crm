import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

type ProofClient = {
  $disconnect: () => Promise<void>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
};

export function createProofAuth(prisma: ProofClient, disableSignUp: boolean) {
  return betterAuth({
    appName: "ClarioBase Proof",
    basePath: "/api/auth",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000",
    secret: process.env.BETTER_AUTH_SECRET ?? "better-auth-proof-secret-better-auth-proof-secret",
    database: prismaAdapter(prisma as never, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp,
      minPasswordLength: 12,
      autoSignIn: false
    },
    trustedOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"],
    telemetry: {
      enabled: false
    },
    rateLimit: {
      enabled: true,
      window: 10,
      max: 20
    }
  });
}

