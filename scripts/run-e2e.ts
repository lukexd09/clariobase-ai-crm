import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { assertNoProductionTargetInRepo, resolveE2ERuntimeContract, resolvePlaywrightBaseUrl, resolveSelectedArea } from "./e2e-guard";

const repoRoot = path.resolve(__dirname, "..");
const mode = process.argv[2];
const e2eEnv = {
  ...process.env,
  CLARIOBASE_E2E_RUNTIME: process.env.CLARIOBASE_E2E_RUNTIME ?? "local-proof",
  CLARIOBASE_E2E_DATABASE_URL:
    process.env.CLARIOBASE_E2E_DATABASE_URL ?? "postgresql://127.0.0.1:65535/clariobase_e2e_proof?schema=public"
};
const baseURL = resolvePlaywrightBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3011");
const runtimeContract = resolveE2ERuntimeContract(e2eEnv);

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
    ...e2eEnv,
    PLAYWRIGHT_BASE_URL: baseURL,
    CLARIOBASE_E2E_RUNTIME: runtimeContract.runtime,
    CLARIOBASE_E2E_DATABASE_URL: runtimeContract.databaseUrl
  }
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error(`Playwright exited with status ${result.status}`);
}

process.exit(result.status ?? 1);
