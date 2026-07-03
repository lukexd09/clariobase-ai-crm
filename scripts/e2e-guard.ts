import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const supportedAreas = new Set(["dashboard", "leads"]);
const approvedE2ERuntime = "local-proof";
const approvedE2EDatabaseNamePrefix = "clariobase_e021_t002_";
const approvedAppBaseUrl = "http://127.0.0.1:3011";

export type RuntimeManifest = {
  runId: string;
  containerName: string;
  networkName: string;
  hostPort: number;
  databaseName: string;
  nextPid?: number;
  appBaseUrl: string;
};

export function createRuntimeRunId() {
  return `e021-t002-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function assertSafePlaywrightTarget(rawTarget: string) {
  const target = new URL(rawTarget);

  if (target.protocol !== "http:") {
    throw new Error(`Playwright target must use http:, got ${rawTarget}`);
  }
  if (target.username || target.password) {
    throw new Error(`Playwright target must not include credentials: ${rawTarget}`);
  }
  if (!["127.0.0.1", "localhost"].includes(target.hostname.toLowerCase())) {
    throw new Error(`Playwright target must use localhost or 127.0.0.1, got ${rawTarget}`);
  }
  if (target.port !== "3011") {
    throw new Error(`Playwright target must use port 3011, got ${rawTarget}`);
  }
  if ((target.pathname || "/") !== "/") {
    throw new Error(`Playwright target must use the root path only, got ${rawTarget}`);
  }
  if (target.search || target.hash) {
    throw new Error(`Playwright target must not include query strings or hashes: ${rawTarget}`);
  }

  return target.toString();
}

export function resolvePlaywrightBaseUrl(rawTarget: string) {
  return assertSafePlaywrightTarget(rawTarget);
}

export function resolveSelectedArea(rawArea: string | undefined) {
  if (!rawArea) {
    throw new Error("E2E area selection is required.");
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

export function createRuntimeManifest(input: Omit<RuntimeManifest, "appBaseUrl"> & { appBaseUrl?: string }): RuntimeManifest {
  if (!input.runId || !/^[a-z0-9-]+$/.test(input.runId)) {
    throw new Error("Runtime run ID must contain only lowercase letters, digits and hyphens.");
  }
  if (!input.containerName.startsWith(input.runId)) {
    throw new Error("Runtime container name must be owned by the current run.");
  }
  if (!input.networkName.startsWith(input.runId)) {
    throw new Error("Runtime network name must be owned by the current run.");
  }
  if (!Number.isInteger(input.hostPort) || input.hostPort <= 0) {
    throw new Error("Runtime host port must be a positive integer.");
  }
  if (!input.databaseName.startsWith(approvedE2EDatabaseNamePrefix)) {
    throw new Error("Runtime database name must be synthetic.");
  }

  return {
    ...input,
    appBaseUrl: input.appBaseUrl ?? approvedAppBaseUrl
  };
}

export function validateRuntimeManifest(manifest: RuntimeManifest) {
  return createRuntimeManifest(manifest);
}

export function resolveE2ERuntimeContract(env: NodeJS.ProcessEnv) {
  const runtime = env.CLARIOBASE_E2E_RUNTIME;
  const databaseUrl = env.DATABASE_URL;

  if (runtime !== approvedE2ERuntime) {
    throw new Error(`CLARIOBASE_E2E_RUNTIME must be ${approvedE2ERuntime}`);
  }
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const target = new URL(databaseUrl);
  const normalized = target.toString();
  const hasLocalLoopback = normalized.includes("127.0.0.1:");
  const hasPublicSchema = normalized.includes("?schema=public");
  const hasNoCredentials = !target.username && !target.password;
  const isPostgres = target.protocol === "postgresql:";

  if (!(isPostgres && hasLocalLoopback && hasPublicSchema && hasNoCredentials)) {
    throw new Error("DATABASE_URL must point to the current disposable local PostgreSQL run.");
  }

  return {
    runtime,
    databaseUrl: target.toString()
  };
}

export function buildE2EChildEnv(baseEnv: NodeJS.ProcessEnv, manifest: RuntimeManifest, databaseUrl: string) {
  return {
    ...baseEnv,
    CLARIOBASE_E2E_RUNTIME: approvedE2ERuntime,
    DATABASE_URL: databaseUrl,
    E2E_RUN_ID: manifest.runId,
    PLAYWRIGHT_BASE_URL: manifest.appBaseUrl,
    E2E_EXPECTED_LEAD_NAME: `E2E Synthetic ${manifest.runId}`
  };
}

export function assertNoProductionTargetInRepo(repoRoot: string) {
  const patterns = [/http:\/\/Serwer:3000/i, /http:\/\/Serwer:3001/i];
  const filesToScan = ["package.json", "playwright.config.ts", "scripts/e2e-guard.ts", "scripts/run-e2e.ts"];
  const violations: string[] = [];

  for (const relative of filesToScan) {
    const abs = path.join(repoRoot, relative);
    if (!fs.existsSync(abs)) {
      continue;
    }

    const stat = fs.statSync(abs);
    const candidates = stat.isDirectory() ? walk(abs) : [abs];

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
