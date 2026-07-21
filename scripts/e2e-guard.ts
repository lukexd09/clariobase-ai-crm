import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const supportedAreas = new Set(["dashboard", "i18n"]);
const approvedE2ERuntime = "local-proof";
const approvedE2EDatabasePrefix = "clariobase_e2e_";
const approvedPlaywrightBaseUrl = "http://127.0.0.1:3011";

function assertExactHttpOrigin(rawTarget: string, context: string, expectedPort: string) {
  const target = new URL(rawTarget);

  if (target.protocol !== "http:") {
    throw new Error(`${context} must use http:, got ${rawTarget}`);
  }
  if (target.username || target.password) {
    throw new Error(`${context} must not include credentials: ${rawTarget}`);
  }
  if (target.hostname !== "127.0.0.1") {
    throw new Error(`${context} must use 127.0.0.1, got ${rawTarget}`);
  }
  if (target.port !== expectedPort) {
    throw new Error(`${context} must use port ${expectedPort}, got ${rawTarget}`);
  }
  if ((target.pathname || "/") !== "/") {
    throw new Error(`${context} must use the root path only, got ${rawTarget}`);
  }
  if (target.search || target.hash) {
    throw new Error(`${context} must not include a query string or hash: ${rawTarget}`);
  }

  return target.origin;
}

function assertDisposableDatabaseUrl(rawDatabaseUrl: string) {
  const target = new URL(rawDatabaseUrl);
  const databaseName = target.pathname.replace(/^\//, "");
  const searchParams = target.searchParams;

  if (target.protocol !== "postgresql:") {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must use postgresql:, got ${rawDatabaseUrl}`);
  }
  if (target.hostname !== "127.0.0.1") {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must use 127.0.0.1, got ${rawDatabaseUrl}`);
  }
  if (!target.port) {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must use a dynamically selected port, got ${rawDatabaseUrl}`);
  }

  const port = Number(target.port);
  if (!Number.isInteger(port) || port < 1024 || port === 5432) {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must use a non-production disposable port, got ${rawDatabaseUrl}`);
  }
  if (target.username !== "postgres") {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must use the disposable postgres user, got ${rawDatabaseUrl}`);
  }
  if (!/^[a-f0-9]{48}$/.test(target.password)) {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must use a generated hexadecimal password, got ${rawDatabaseUrl}`);
  }
  if (!/^clariobase_e2e_[a-f0-9]+$/.test(databaseName)) {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must use a database name with the ${approvedE2EDatabasePrefix} prefix, got ${rawDatabaseUrl}`);
  }
  if (searchParams.toString() !== "schema=public" || searchParams.getAll("schema").length !== 1) {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must target schema=public only, got ${rawDatabaseUrl}`);
  }
  if (target.hash) {
    throw new Error(`CLARIOBASE_E2E_DATABASE_URL must not include a hash: ${rawDatabaseUrl}`);
  }

  return rawDatabaseUrl;
}

function assertBetterAuthEnvironment(env: NodeJS.ProcessEnv) {
  const authUrl = env.BETTER_AUTH_URL;
  const authSecret = env.BETTER_AUTH_SECRET;

  if (!authUrl) {
    throw new Error("BETTER_AUTH_URL is required for the disposable E2E runtime");
  }
  if (!authSecret) {
    throw new Error("BETTER_AUTH_SECRET is required for the disposable E2E runtime");
  }
  if (authSecret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
  }

  return {
    betterAuthUrl: assertExactHttpOrigin(authUrl, "BETTER_AUTH_URL", "3011"),
    betterAuthSecret: authSecret
  };
}

export function assertSafePlaywrightTarget(rawTarget: string) {
  const target = new URL(rawTarget);
  const host = target.hostname.toLowerCase();
  const normalizedPath = target.pathname || "/";

  if (target.protocol !== "http:") {
    throw new Error(`Playwright target must use http:, got ${rawTarget}`);
  }
  if (target.username || target.password) {
    throw new Error(`Playwright target must not include credentials: ${rawTarget}`);
  }
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`Playwright target must use localhost or 127.0.0.1, got ${rawTarget}`);
  }
  if (target.port !== "3011") {
    throw new Error(`Playwright target must use port 3011, got ${rawTarget}`);
  }
  if (normalizedPath !== "/") {
    throw new Error(`Playwright target must use the root path only, got ${rawTarget}`);
  }
  if (target.search) {
    throw new Error(`Playwright target must not include a query string: ${rawTarget}`);
  }
  if (target.hash) {
    throw new Error(`Playwright target must not include a hash: ${rawTarget}`);
  }

  return target.toString();
}

export function resolvePlaywrightBaseUrl(rawTarget: string) {
  return assertSafePlaywrightTarget(rawTarget);
}

export function resolveSelectedArea(rawArea: string | undefined) {
  if (!rawArea) {
    throw new Error("E2E area selection is required. Pass a supported area such as `dashboard`.");
  }

  const normalizedArea = rawArea.trim().toLowerCase();
  if (!supportedAreas.has(normalizedArea)) {
    throw new Error(`Unknown E2E area: ${rawArea}`);
  }

  return normalizedArea;
}

export function getSupportedAreas() {
  return [...supportedAreas];
}

export function resolveE2ERuntimeContract(env: NodeJS.ProcessEnv) {
  const runtime = env.CLARIOBASE_E2E_RUNTIME;
  const databaseUrl = env.CLARIOBASE_E2E_DATABASE_URL;
  const databaseUrlFromApp = env.DATABASE_URL;

  if (runtime !== approvedE2ERuntime) {
    throw new Error(`CLARIOBASE_E2E_RUNTIME must be ${approvedE2ERuntime}`);
  }

  if (!databaseUrl) {
    throw new Error("CLARIOBASE_E2E_DATABASE_URL is required");
  }
  if (!databaseUrlFromApp) {
    throw new Error("DATABASE_URL is required for the disposable E2E runtime");
  }
  if (databaseUrlFromApp !== databaseUrl) {
    throw new Error("DATABASE_URL and CLARIOBASE_E2E_DATABASE_URL must match exactly");
  }

  const validatedDatabaseUrl = assertDisposableDatabaseUrl(databaseUrl);

  return {
    runtime,
    databaseUrl: validatedDatabaseUrl
  };
}

export function buildE2EChildEnv(baseEnv: NodeJS.ProcessEnv) {
  const runtimeContract = resolveE2ERuntimeContract({
    ...baseEnv,
    CLARIOBASE_E2E_RUNTIME: baseEnv.CLARIOBASE_E2E_RUNTIME ?? approvedE2ERuntime
  });
  const authContract = assertBetterAuthEnvironment(baseEnv);

  const childEnv: NodeJS.ProcessEnv = {
    ...baseEnv,
    CLARIOBASE_E2E_RUNTIME: runtimeContract.runtime,
    CLARIOBASE_E2E_DATABASE_URL: runtimeContract.databaseUrl,
    DATABASE_URL: runtimeContract.databaseUrl,
    BETTER_AUTH_URL: authContract.betterAuthUrl,
    BETTER_AUTH_SECRET: authContract.betterAuthSecret,
    CRM_DEPLOYMENT_ENV: baseEnv.CRM_DEPLOYMENT_ENV ?? "preview",
    PLAYWRIGHT_BASE_URL: approvedPlaywrightBaseUrl
  };

  if (baseEnv.PLAYWRIGHT_STORAGE_STATE) {
    childEnv.PLAYWRIGHT_STORAGE_STATE = baseEnv.PLAYWRIGHT_STORAGE_STATE;
  }

  return childEnv;
}

export function assertNoProductionTargetInRepo(repoRoot: string) {
  const patterns = [
    /http:\/\/Serwer:3000/i,
    /http:\/\/Serwer:3001/i
  ];
  const filesToScan = [
    "package.json",
    "playwright.config.ts",
    "scripts/e2e-guard.ts",
    "scripts/run-e2e.ts"
  ];

  const violations: string[] = [];

  for (const relative of filesToScan) {
    const abs = path.join(repoRoot, relative);
    if (!fs.existsSync(abs)) {
      continue;
    }

    const stat = fs.statSync(abs);
    const candidates = stat.isDirectory()
      ? walk(abs)
      : [abs];

    for (const file of candidates) {
      const text = fs.readFileSync(file, "utf8");
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          violations.push(path.relative(repoRoot, file));
        }
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Production target references must not appear in the repo scan: ${[...new Set(violations)].join(", ")}`);
  }
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const output: string[] = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walk(abs));
    } else if (entry.isFile()) {
      output.push(abs);
    }
  }

  return output;
}
