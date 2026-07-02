import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { assertNoProductionTargetInRepo, buildE2EChildEnv, resolvePlaywrightBaseUrl, resolveSelectedArea } from "./e2e-guard";

const repoRoot = path.resolve(__dirname, "..");
const mode = process.argv[2];
const baseURL = resolvePlaywrightBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3011");
const childEnv = buildE2EChildEnv(process.env);

assertNoProductionTargetInRepo(repoRoot);

if (!["smoke", "area", "full"].includes(mode ?? "")) {
  throw new Error(`Unknown E2E mode: ${mode ?? "<missing>"}`);
}

const selectedArea = mode === "area" ? resolveSelectedArea(process.argv[3] ?? process.env.E2E_AREA) : undefined;
const grepByMode: Record<string, string> = {
  smoke: "@smoke",
  area: `@area:${selectedArea ?? ""}`,
  full: ""
};

const playwrightCli = path.join(repoRoot, "node_modules", "@playwright", "test", "cli.js");
const result = spawnSync(process.execPath, [playwrightCli, "test", ...(grepByMode[mode] ? ["--grep", grepByMode[mode]] : [])], {
  cwd: repoRoot,
  stdio: "inherit",
  env: {
    ...childEnv,
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
