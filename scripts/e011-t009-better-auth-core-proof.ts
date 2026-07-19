import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { buildAuthOptions, createAppAuth } from "@/lib/auth";

const root = process.cwd();
const schemaPath = `${root}/prisma/schema.prisma`;
const postgresPassword = "clariobase_test_password";
const postgresPort = 55432;
const databaseUrl = `postgresql://postgres:${postgresPassword}@127.0.0.1:${postgresPort}/clariobase_auth_t009?schema=public`;
const authSecret = "clariobase-t009-proof-secret-clariobase-t009-proof-secret";
const telemetryEnv = "0";

function assertSafeLogLine(line: string, forbiddenValues: string[]) {
  for (const value of forbiddenValues) {
    if (value && line.includes(value)) {
      throw new Error("Proof attempted to log a secret-bearing value");
    }
  }
}

function logSafe(line: string, forbiddenValues: string[]) {
  assertSafeLogLine(line, forbiddenValues);
  console.log(line);
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  execFileSync(cmd, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit"
  });
}

async function waitForPort() {
  for (let i = 0; i < 60; i += 1) {
    try {
      execFileSync("docker", [
        "exec",
        "clariobase-auth-t009-postgres",
        "pg_isready",
        "-U",
        "postgres"
      ], { stdio: "ignore" });
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
    "clariobase-auth-t009-postgres",
    "-e",
    `POSTGRES_PASSWORD=${postgresPassword}`,
    "-e",
    "POSTGRES_DB=clariobase_auth_t009",
    "-p",
    `${postgresPort}:5432`,
    "postgres:16-alpine"
  ], { stdio: "inherit" });

  try {
    await waitForPort();

    run("node", ["./node_modules/prisma/build/index.js", "validate", "--schema", schemaPath], {
      DATABASE_URL: databaseUrl
    });
    run("node", ["./node_modules/prisma/build/index.js", "generate", "--schema", schemaPath], {
      DATABASE_URL: databaseUrl
    });
    run("node", ["./node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", schemaPath], {
      DATABASE_URL: databaseUrl
    });

    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl })
    });

    const openAuth = betterAuth({
      appName: "ClarioBase",
      baseURL: "http://127.0.0.1:3000",
      database: prismaAdapter(prisma, { provider: "postgresql" }),
      emailAndPassword: {
        enabled: true,
        disableSignUp: false
      },
      secret: authSecret
    });
    const email = `proof-${randomUUID()}@example.com`;
    const password = "strong-proof-password-123456";
    const signUp = await openAuth.api.signUpEmail({
      body: { email, name: "Proof User", password },
      returnHeaders: true
    });
    const cookie = (signUp as { headers?: Headers }).headers?.get("set-cookie");
    if (!cookie) throw new Error("signup did not return session cookie");

    const session = await openAuth.api.getSession({
      headers: new Headers({ cookie })
    });
    if (!session?.user?.id || !session?.session?.id) throw new Error("session lookup failed");

    const restartAuth = betterAuth({
      appName: "ClarioBase",
      baseURL: "http://127.0.0.1:3000",
      database: prismaAdapter(prisma, { provider: "postgresql" }),
      emailAndPassword: {
        enabled: true,
        disableSignUp: false
      },
      secret: authSecret
    });
    const sessionAfterRestart = await restartAuth.api.getSession({
      headers: new Headers({ cookie })
    });
    if (!sessionAfterRestart?.user?.id) throw new Error("session did not survive restart");

    process.env.DATABASE_URL = databaseUrl;
    process.env.BETTER_AUTH_URL = "http://127.0.0.1:3000";
    process.env.BETTER_AUTH_SECRET = authSecret;
    process.env.BETTER_AUTH_TELEMETRY = telemetryEnv;
    const disabledAuth = createAppAuth();
    const appAuthOptions = buildAuthOptions();
    if (appAuthOptions.telemetry.enabled !== false || appAuthOptions.telemetry.debug !== false) {
      throw new Error("telemetry is not explicitly disabled in app auth config");
    }
    let signupBlocked = false;
    try {
      await disabledAuth.api.signUpEmail({
        body: { email: `blocked-${randomUUID()}@example.com`, name: "Blocked", password }
      });
    } catch {
      signupBlocked = true;
    }
    if (!signupBlocked) throw new Error("public signup was not blocked");

    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'user', 'session', 'account', 'verification',
          'organization', 'member', 'membership', 'invitation', 'team', 'workspace'
        )
      order by table_name
    `;
    const expected = ["account", "session", "user", "verification"];
    const actual = tables.map((row) => row.table_name);
    if (actual.some((table) => !expected.includes(table))) {
      throw new Error(`unexpected auth tables found: ${actual.join(", ")}`);
    }
    if (expected.some((table) => !actual.includes(table))) {
      throw new Error(`missing expected auth tables: ${actual.join(", ")}`);
    }

    await prisma.$executeRawUnsafe("drop schema public cascade");
    await prisma.$executeRawUnsafe("create schema public");
    await run("node", ["./node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", schemaPath], {
      DATABASE_URL: databaseUrl
    });

    process.env.BETTER_AUTH_SECRET = "";
    const missingSecret = () => createAppAuth();
    let failedSafe = false;
    try {
      missingSecret();
    } catch {
      failedSafe = true;
    }
    if (!failedSafe) throw new Error("missing secret did not fail safely");

    process.env.BETTER_AUTH_SECRET = "short";
    const badSecret = () => createAppAuth();
    let badSecretFailed = false;
    try {
      badSecret();
    } catch {
      badSecretFailed = true;
    }
    if (!badSecretFailed) throw new Error("malformed secret did not fail safely");

    const forbiddenValues = [databaseUrl, postgresPassword, authSecret];
    const safeLines = [
      "DISPOSABLE_POSTGRES: PASS",
      "PRISMA_VALIDATE: PASS",
      "PRISMA_GENERATE: PASS",
      "AUTH_RECORDS: PASS",
      "SIGNUP_DISABLED: PASS",
      "MISSING_SECRET_FAILS_SAFE: PASS",
      "MALFORMED_SECRET_FAILS_SAFE: PASS",
      "RESTART_SESSION_PERSISTS: PASS",
      `AUTH_TABLES: ${actual.join(", ")}`
    ];
    for (const line of safeLines) {
      assertSafeLogLine(line, forbiddenValues);
      console.log(line);
    }
  } finally {
    try {
      execFileSync("docker", ["rm", "-f", "clariobase-auth-t009-postgres"], { stdio: "ignore" });
    } catch {}
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
