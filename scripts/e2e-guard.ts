import { URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

const forbiddenTargets = new Set(["serwer:3000", "serwer:3001"]);

export function assertSafePlaywrightTarget(rawTarget: string) {
  const target = new URL(rawTarget);
  const host = target.hostname.toLowerCase();
  const hostPort = `${host}:${target.port || (target.protocol === "https:" ? "443" : "80")}`;

  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`Playwright target must use localhost or 127.0.0.1, got ${rawTarget}`);
  }

  if (forbiddenTargets.has(hostPort)) {
    throw new Error(`Playwright target must not use a protected production or preview port: ${rawTarget}`);
  }

  return target.toString();
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
