import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";

import { PrismaClient } from "@/generated/prisma/client";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

const root = process.cwd();
const postgresPassword = "clariobase_test_password";
const postgresPort = 55433;
const databaseUrl = `postgresql://postgres:${postgresPassword}@127.0.0.1:${postgresPort}/clariobase_auth_t010?schema=public`;
const authSecret = "clariobase-t010-proof-secret-clariobase-t010-proof-secret";
const appBaseUrl = "http://127.0.0.1:3000";

function run(command: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    shell: true
  });
}

function assertSafeLogLine(line: string, forbidden: string[]) {
  for (const item of forbidden) {
    if (item && line.includes(item)) {
      throw new Error(`proof attempted to expose secret-bearing value: ${item}`);
    }
  }
}

async function waitForPort() {
  for (let i = 0; i < 60; i += 1) {
    try {
      execFileSync("docker", ["exec", "clariobase-auth-t010-postgres", "pg_isready", "-U", "postgres"], {
        stdio: "ignore"
      });
      return;
    } catch {
      await delay(1000);
    }
  }
  throw new Error("PostgreSQL did not become ready");
}

async function main() {
  execFileSync("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    "clariobase-auth-t010-postgres",
    "-e",
    `POSTGRES_PASSWORD=${postgresPassword}`,
    "-e",
    "POSTGRES_DB=clariobase_auth_t010",
    "-p",
    `${postgresPort}:5432`,
    "postgres:16-alpine"
  ], { stdio: "ignore" });

  try {
    await waitForPort();

    const env = {
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_URL: appBaseUrl,
      BETTER_AUTH_SECRET: authSecret
    };

    const validate = run("node", ["./node_modules/prisma/build/index.js", "validate", "--schema", "prisma/schema.prisma"], env);
    assert.equal(validate.status, 0, validate.stderr);

    const generate = run("node", ["./node_modules/prisma/build/index.js", "generate", "--schema", "prisma/schema.prisma"], env);
    assert.equal(generate.status, 0, generate.stderr);

    const migrate = run("node", ["./node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "prisma/schema.prisma"], env);
    assert.equal(migrate.status, 0, migrate.stderr);

    process.env.DATABASE_URL = databaseUrl;
    process.env.BETTER_AUTH_URL = appBaseUrl;
    process.env.BETTER_AUTH_SECRET = authSecret;

    const { createAppAuth } = await import("@/lib/auth");
    const appAuth = createAppAuth();
    const proofDb = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl })
    });
    const proofEmail = `proof-${randomUUID()}@example.test`;
    const proofPassword = "proof-password-123456";

    const bootstrapAuth = betterAuth({
      appName: "ClarioBase",
      baseURL: appBaseUrl,
      database: prismaAdapter(proofDb, { provider: "postgresql" }),
      emailAndPassword: {
        enabled: true,
        disableSignUp: false
      },
      secret: authSecret
    });

    const signUp = await appAuth.api.signUpEmail({
      body: {
        email: proofEmail,
        name: "Proof User",
        password: proofPassword
      }
    }).catch(() => null);
    assert.equal(signUp, null, "app runtime signup should be rejected");

    const created = await bootstrapAuth.api.signUpEmail({
      body: {
        email: proofEmail,
        name: "Proof User",
        password: proofPassword
      },
      returnHeaders: true
    });
    const createdHeaders = (created as { headers?: Headers }).headers;
    assert(createdHeaders);

    const cookieHeader = createdHeaders.get("set-cookie");
    assert(cookieHeader);
    const forbidden = [databaseUrl, postgresPassword, authSecret, proofPassword, proofEmail];
    assertSafeLogLine("CONTROLLED_USER_CREATED", forbidden);

    const freshAuth = createAppAuth();
    const invalid = await freshAuth.api.signInEmail({
      body: {
        email: proofEmail,
        password: "wrong-password"
      }
    }).catch((error) => error);
    assert(invalid, "invalid credentials should fail");

    const signIn = await appAuth.api.signInEmail({
      body: {
        email: proofEmail,
        password: proofPassword,
        rememberMe: true
      },
      returnHeaders: true
    });
    const signInHeaders = (signIn as { headers?: Headers }).headers;
    assert(signInHeaders);
    const setCookie = signInHeaders.get("set-cookie");
    assert(setCookie);
    assertSafeLogLine("SIGN_IN_OK", forbidden);

    const sessionCookie = setCookie.split(";")[0];
    const sessionHeaders = new Headers({ cookie: sessionCookie });

    const session = await appAuth.api.getSession({ headers: sessionHeaders });
    assert(session?.user?.id);
    assert(session?.session?.id);

    const appRestartAuth = createAppAuth();
    const sessionAfterRestart = await appRestartAuth.api.getSession({ headers: sessionHeaders });
    assert(sessionAfterRestart?.user?.id);

    const unsafeRedirects = [
      "https://evil.example.com",
      "//evil.example.com",
      "javascript:alert(1)",
      "http://evil.example.com/path"
    ];
    for (const target of unsafeRedirects) {
      assert.equal(getSafeRedirectPath(target), "/");
    }

    await appRestartAuth.api.signOut({ headers: sessionHeaders });
    const afterSignOut = await appRestartAuth.api.getSession({ headers: sessionHeaders });
    assert.equal(afterSignOut, null);

    const sessionCount = await proofDb.$queryRaw<Array<{ count: bigint }>>`
      select count(*)::bigint as count
      from "session"
    `;
    assert.equal(Number(sessionCount[0]?.count ?? 0n), 1);

    const signOutRestartAuth = createAppAuth();
    const afterRestartSignOut = await signOutRestartAuth.api.getSession({ headers: sessionHeaders });
    assert.equal(afterRestartSignOut, null);

    const rendered = JSON.stringify({
      sessionPresent: Boolean(session),
      sessionAfterRestartPresent: Boolean(sessionAfterRestart),
      signOutClearedSession: afterSignOut === null
    });
    assertSafeLogLine(rendered, forbidden);

    console.log("E011.T010 live auth proof: PASS");
  } finally {
    try {
      await new PrismaClient().$disconnect();
    } catch {}
    try {
      execFileSync("docker", ["rm", "-f", "clariobase-auth-t010-postgres"], { stdio: "ignore" });
    } catch {}
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
