import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createCleanupController, createDockerRunId, createVerificationFailure, reserveFreePort } from "./docker-test-support";
import { assertNoProductionTargetInRepo, buildE2EChildEnv, resolvePlaywrightBaseUrl, resolveSelectedArea } from "./e2e-guard";

const repoRoot = path.resolve(__dirname, "..");
const mode = process.argv[2];
const baseURL = resolvePlaywrightBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3011");
const playwrightBaseUrl = baseURL.replace(/\/$/, "");
const cleanup = createCleanupController("run-e2e");
const sensitiveValues: string[] = [];
type ParsedCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax" | "Strict" | "None";
};

function redactSensitiveText(value: string) {
  let redacted = value;

  for (const sensitiveValue of [...new Set(sensitiveValues)].filter(Boolean).sort((a, b) => b.length - a.length)) {
    redacted = redacted.split(sensitiveValue).join("[redacted]");
  }

  return redacted
    .replace(/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[redacted-database-url]")
    .replace(/(password|secret|token|cookie)=([^&\s"'<>]+)/gi, "$1=[redacted]")
    .replace(/BETTER_AUTH_[A-Z_]+/g, "[redacted-auth-env]");
}

async function runChecked(command: string, args: string[], env: NodeJS.ProcessEnv, description: string) {
  return await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const output = [stdout, stderr]
        .filter(Boolean)
        .join("\n")
        .trim();
      reject(new Error(`${description} failed: ${redactSensitiveText(output || "unknown error")}`));
    });
  });
}

function readSetCookies(headers: Headers) {
  const getter = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;

  if (typeof getter === "function") {
    return getter.call(headers);
  }

  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function parseSameSite(rawValue: string | undefined): ParsedCookie["sameSite"] {
  if (rawValue === "Strict" || rawValue === "None") {
    return rawValue;
  }

  return "Lax";
}

function parseSetCookie(setCookie: string) {
  const [nameValue, ...attributes] = setCookie.split(";").map((part) => part.trim()).filter(Boolean);
  const [name, ...valueParts] = nameValue.split("=");
  const cookieValue = valueParts.join("=");

  if (!name || !cookieValue) {
    throw new Error("Unable to parse Better Auth session cookie");
  }

  const cookie: ParsedCookie = {
    name,
    value: cookieValue,
    domain: "127.0.0.1",
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const
  };

  for (const attribute of attributes) {
    const [rawKey, ...rawValueParts] = attribute.split("=");
    const key = rawKey.toLowerCase();
    const rawValue = rawValueParts.join("=");

    if (key === "domain" && rawValue) {
      cookie.domain = rawValue.replace(/^\./, "");
    } else if (key === "path" && rawValue) {
      cookie.path = rawValue;
    } else if (key === "expires" && rawValue) {
      const expires = Date.parse(rawValue);
      if (!Number.isNaN(expires)) {
        cookie.expires = Math.floor(expires / 1000);
      }
    } else if (key === "max-age" && rawValue) {
      const maxAge = Number(rawValue);
      if (Number.isFinite(maxAge)) {
        cookie.expires = Math.floor(Date.now() / 1000) + maxAge;
      }
    } else if (key === "httponly") {
      cookie.httpOnly = true;
    } else if (key === "secure") {
      cookie.secure = true;
    } else if (key === "samesite" && rawValue) {
      cookie.sameSite = parseSameSite(rawValue);
    }
  }

  return cookie;
}

function writeStorageState(storageStatePath: string, cookies: ReturnType<typeof parseSetCookie>[]) {
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  fs.writeFileSync(
    storageStatePath,
    JSON.stringify({
      cookies,
      origins: []
    }, null, 2),
    "utf8"
  );
}

async function waitForPostgres(containerName: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = await new Promise<{ code: number | null; stdout: string; stderr: string; pid?: number }>((resolve, reject) => {
      const child = spawn("docker", ["exec", containerName, "pg_isready", "-U", "postgres"], {
        cwd: repoRoot,
        env: process.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
      child.once("error", reject);
      child.once("close", (code) => {
        resolve({ code, stdout, stderr, pid: child.pid });
      });
    });

    if (result.code === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Disposable PostgreSQL did not become ready in time");
}

async function runPlaywright(modeName: "smoke" | "area" | "full", selectedArea: string | undefined, env: NodeJS.ProcessEnv) {
  const playwrightCli = path.join(repoRoot, "node_modules", "@playwright", "test", "cli.js");
  const args = [playwrightCli, "test"];

  if (modeName === "smoke") {
    args.push("--grep", "@smoke");
  } else if (modeName === "area" && selectedArea) {
    args.push("--grep", `@area:${selectedArea}`);
  }

  return await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot,
      stdio: "inherit",
      env
    });

    if (child.pid) {
      cleanup.registerProcessTree(child.pid);
    }

    child.once("error", reject);
    child.once("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function main() {
  if (!["smoke", "area", "full"].includes(mode ?? "")) {
    throw new Error(`Unknown E2E mode: ${mode ?? "<missing>"}`);
  }

  cleanup.installProcessHandlers();
  assertNoProductionTargetInRepo(repoRoot);

  const selectedArea = mode === "area" ? resolveSelectedArea(process.argv[3] ?? process.env.E2E_AREA) : undefined;
  const disposableRunId = createDockerRunId("e2e");
  const postgresContainerName = `${disposableRunId}-postgres`;
  const storageStatePath = path.join(repoRoot, ".codex-tmp", `${disposableRunId}-storage-state.json`);
  const databaseName = `clariobase_e2e_${randomBytes(8).toString("hex")}`;
  const postgresPassword = randomBytes(24).toString("hex");
  const authSecret = randomBytes(32).toString("hex");
  const bootstrapEmail = `clariobase-e2e-${randomUUID()}@example.test`;
  const bootstrapPassword = randomBytes(16).toString("hex");
  const postgresPort = await reserveFreePort();
  const databaseUrl = `postgresql://postgres:${postgresPassword}@127.0.0.1:${postgresPort}/${databaseName}?schema=public`;
  const bootstrapEnv: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_URL: playwrightBaseUrl,
    BETTER_AUTH_SECRET: authSecret,
    BETTER_AUTH_TELEMETRY: "0",
    CRM_AUTH_RUNTIME_MODE: "disposable-test",
    CRM_ALLOW_INSECURE_AUTH_TESTS: "1",
    CLARIOBASE_BOOTSTRAP_ENABLED: "1",
    CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL: bootstrapEmail,
    CLARIOBASE_BOOTSTRAP_ADMIN_NAME: "Disposable E2E Admin",
    CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD: bootstrapPassword
  };

  sensitiveValues.push(databaseUrl, postgresPassword, authSecret, bootstrapEmail, bootstrapPassword);

  cleanup.registerDockerContainer(postgresContainerName);
  cleanup.registerTempPath(storageStatePath);

  let mainError: unknown;

  try {
    await runChecked(
      "docker",
      [
        "run",
        "-d",
        "--rm",
        "--name",
        postgresContainerName,
        "--label",
        "io.clariobase.disposable=e2e",
        "-e",
        `POSTGRES_PASSWORD=${postgresPassword}`,
        "-e",
        `POSTGRES_DB=${databaseName}`,
        "-p",
        `127.0.0.1:${postgresPort}:5432`,
        "postgres:16-alpine"
      ],
      process.env,
      "start disposable PostgreSQL"
    );

    await waitForPostgres(postgresContainerName);

    const migrateEnv = {
      ...bootstrapEnv,
      CLARIOBASE_E2E_RUNTIME: "local-proof",
      CLARIOBASE_E2E_DATABASE_URL: databaseUrl
    };

    await runChecked(
      process.execPath,
      ["./node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
      migrateEnv,
      "apply checked-in Prisma migrations"
    );

    await runChecked(
      process.execPath,
      ["./node_modules/tsx/dist/cli.mjs", "scripts/bootstrap-admin.ts"],
      bootstrapEnv,
      "bootstrap disposable administrator"
    );

    const appEnv = {
      ...bootstrapEnv,
      CLARIOBASE_E2E_RUNTIME: "local-proof",
      CLARIOBASE_E2E_DATABASE_URL: databaseUrl,
      PLAYWRIGHT_BASE_URL: baseURL,
      PLAYWRIGHT_STORAGE_STATE: storageStatePath,
      CRM_DEPLOYMENT_ENV: "preview"
    };

    const childEnv = buildE2EChildEnv(appEnv);

    process.env.DATABASE_URL = databaseUrl;
    process.env.CLARIOBASE_E2E_RUNTIME = "local-proof";
    process.env.CLARIOBASE_E2E_DATABASE_URL = databaseUrl;
    process.env.BETTER_AUTH_URL = playwrightBaseUrl;
    process.env.BETTER_AUTH_SECRET = authSecret;
    process.env.BETTER_AUTH_TELEMETRY = "0";
    process.env.CRM_AUTH_RUNTIME_MODE = "disposable-test";
    process.env.CRM_ALLOW_INSECURE_AUTH_TESTS = "1";
    process.env.CRM_DEPLOYMENT_ENV = "preview";

    const { createAppAuth } = await import("@/lib/auth");
    const auth = createAppAuth();
    const signIn = await auth.api.signInEmail({
      body: {
        email: bootstrapEmail,
        password: bootstrapPassword,
        rememberMe: true
      },
      returnHeaders: true
    });
    const headers = (signIn as { headers?: Headers }).headers;

    assert(headers, "Better Auth sign-in did not return response headers");

    const setCookies = readSetCookies(headers);
    assert(setCookies.length > 0, "Better Auth sign-in did not return a session cookie");

    const parsedCookies = setCookies.map(parseSetCookie);
    const sessionHeaders = new Headers({
      cookie: parsedCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
    });
    const session = await auth.api.getSession({ headers: sessionHeaders });

    assert(session?.user?.id, "Better Auth session could not be resolved from the disposable cookie");
    writeStorageState(storageStatePath, parsedCookies);

    if (mode === "area" && selectedArea === "i18n") {
      const marker = randomUUID();
      const businessName = `Firma Żółw ${marker.slice(0, 8)}`;
      const category = "Imported category stays verbatim";
      const { prisma } = await import("@/lib/prisma");
      const lead = await prisma.lead.create({
        data: {
          customerId: `e010-${marker}`,
          businessName,
          category,
          city: "Łódź",
          leadStatus: "CONTACTED",
          priority: "HIGH",
          packageFit: "CLARITY",
          scoreTotal: 81,
          nextActionAt: new Date("2026-07-21T10:30:00.000Z"),
          offerDrafts: {
            create: {
              status: "DRAFT",
              title: "Verbatim offer title",
              packageFit: "CLARITY",
              priceNet: "1234.50",
              currency: "PLN"
            }
          }
        }
      });
      childEnv.PLAYWRIGHT_E010_LEAD_ID = lead.id;
      childEnv.PLAYWRIGHT_E010_BUSINESS_NAME = businessName;
      childEnv.PLAYWRIGHT_E010_CATEGORY = category;
    }

    const exitCode = await runPlaywright(mode as "smoke" | "area" | "full", selectedArea, childEnv);

    if (exitCode !== 0) {
      throw new Error(`Playwright exited with status ${exitCode}`);
    }
  } catch (error) {
    mainError = error;
  } finally {
    const cleanupReport = cleanup.cleanup(mainError ? "failed verification" : "successful verification");

    if (cleanupReport.failures.length > 0) {
      const cleanupError = new Error(`E2E cleanup failed: ${cleanupReport.failures.map((failure) => `${failure.label}: ${failure.message}`).join("\n")}`);

      if (mainError) {
        mainError = createVerificationFailure(mainError, cleanupReport.failures, "run-e2e");
      } else {
        mainError = cleanupError;
      }
    }
  }

  if (mainError) {
    const message = mainError instanceof Error ? redactSensitiveText(mainError.message) : redactSensitiveText(String(mainError));
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(redactSensitiveText(error instanceof Error ? error.stack ?? error.message : String(error)));
  process.exitCode = 1;
});
