import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { assertNoProductionTargetInRepo, assertSafePlaywrightTarget } from "./e2e-guard";

const repoRoot = path.resolve(__dirname, "..");
const mode = process.argv[2];
const selectedArea = process.argv[3] ?? process.env.E2E_AREA;
const baseURL = assertSafePlaywrightTarget(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3011");

assertNoProductionTargetInRepo(repoRoot);

const grepByMode: Record<string, string> = {
  smoke: "smoke",
  area: selectedArea ? `@area:${selectedArea}` : "",
  full: ""
};

if (!(mode in grepByMode)) {
  throw new Error(`Unknown E2E mode: ${mode ?? "<missing>"}`);
}

if (mode === "area" && !selectedArea) {
  throw new Error("E2E_AREA is required for pnpm test:e2e:area");
}

const playwrightCli = path.join(repoRoot, "node_modules", "@playwright", "test", "cli.js");
const result = spawnSync(process.execPath, [playwrightCli, "test", ...(grepByMode[mode] ? ["--grep", grepByMode[mode]] : [])], {
  cwd: repoRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    PLAYWRIGHT_BASE_URL: baseURL
  }
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error(`Playwright exited with status ${result.status}`);
}

process.exit(result.status ?? 1);
