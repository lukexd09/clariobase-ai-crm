import { spawnSync } from "node:child_process";
import { createRuntimeManifest } from "./e2e-guard";
import { buildE2EChildEnv } from "./e2e-guard";

const childEnv = buildE2EChildEnv(
  process.env,
  createRuntimeManifest({
    runId: "e021-t002-dev",
    containerName: "e021-t002-dev-postgres",
    networkName: "e021-t002-dev-network",
    hostPort: 54321,
    databaseName: "clariobase_e021_t002_dev",
    appBaseUrl: "http://127.0.0.1:3011"
  }),
  process.env.DATABASE_URL ?? "postgresql://127.0.0.1:54321/clariobase_e021_t002_dev?schema=public"
);

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
    env: childEnv
  }
);

process.exit(result.status ?? 1);
