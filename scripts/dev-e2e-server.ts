import { spawnSync } from "node:child_process";
import { resolveE2ERuntimeContract } from "./e2e-guard";

const e2eEnv = {
  ...process.env,
  CLARIOBASE_E2E_RUNTIME: process.env.CLARIOBASE_E2E_RUNTIME ?? "local-proof",
  CLARIOBASE_E2E_DATABASE_URL:
    process.env.CLARIOBASE_E2E_DATABASE_URL ?? "postgresql://127.0.0.1:65535/clariobase_e2e_proof?schema=public"
};
const contract = resolveE2ERuntimeContract(e2eEnv);

const result = spawnSync(
  process.execPath,
  [
    "./node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3011"
  ],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...e2eEnv,
      CLARIOBASE_E2E_RUNTIME: contract.runtime,
      CLARIOBASE_E2E_DATABASE_URL: contract.databaseUrl,
      PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3011"
    }
  }
);

process.exit(result.status ?? 1);
