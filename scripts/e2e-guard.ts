import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const supportedAreas = new Set(["dashboard"]);
const approvedE2ERuntime = "local-proof";
const approvedE2EDatabaseName = "clariobase_e2e_proof";
const approvedE2EDatabaseHostnames = new Set(["127.0.0.1", "localhost"]);

export function assertSafePlaywrightTarget(rawTarget: string) {
  const target = new URL(rawTarget);
  const host = target.hostname.toLowerCase();
  const normalizedPath = target.pathname || "/";

  if (target.protocol !== "http:") {
    throw new Error(`Playwright target must use http:, got ${rawTarget}`);
  }
  if (!approvedE2ERuntime) {
    throw new Error("E2E runtime marker is missing");
  }
  if (target.username || target.password) {
    throw new Error(`Playwright target must not include credentials: ${rawTarget}`);
  }
  if (!approvedE2EDatabaseHostnames.has(host)) {
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

  if (runtime !== approvedE2ERuntime) {
    throw new Error(`CLARIOBASE_E2E_RUNTIME must be ${approvedE2ERuntime}`);
  }

  if (!databaseUrl) {
    throw new Error("CLARIOBASE_E2E_DATABASE_URL is required");
  }

  const target = new URL(databaseUrl);
  if (!approvedE2EDatabaseHostnames.has(target.hostname.toLowerCase())) {
    throw new Error("E2E database host must be loopback");
  }
  if (target.pathname.replace(/^\//, "") !== approvedE2EDatabaseName) {
    throw new Error(`E2E database name must be ${approvedE2EDatabaseName}`);
  }
  if (target.username || target.password) {
    throw new Error("E2E database URL must not include credentials");
  }
  if (["clariobase_crm", "clariobase_crm_preview", "clariobase_harvester"].some((blocked) => target.pathname.includes(blocked))) {
    throw new Error("E2E database target must not match a known CRM, preview or production identity");
  }

  return {
    runtime,
    databaseUrl: target.toString()
  };
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
