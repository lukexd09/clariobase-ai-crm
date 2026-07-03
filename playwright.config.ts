import { defineConfig } from "@playwright/test";
import { resolvePlaywrightBaseUrl } from "./scripts/e2e-guard";

const baseURL = resolvePlaywrightBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3011");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  }
});
