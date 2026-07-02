import { spawnSync } from "node:child_process";
import { buildE2EChildEnv } from "./e2e-guard";

const childEnv = buildE2EChildEnv(process.env);

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
