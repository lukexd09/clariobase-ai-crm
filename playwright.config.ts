import { defineConfig } from "@playwright/test";
import process from "node:process";
import { resolveE2ERuntimeContract, resolvePlaywrightBaseUrl } from "./scripts/e2e-guard";

const baseURL = resolvePlaywrightBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3011");
resolveE2ERuntimeContract(process.env);
const storageState = process.env.PLAYWRIGHT_STORAGE_STATE?.trim();
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL,
    ...(storageState ? { storageState } : {}),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: `${JSON.stringify(process.execPath)} --import tsx scripts/dev-e2e-server.ts`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
