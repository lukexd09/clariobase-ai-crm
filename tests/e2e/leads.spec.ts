import { test, expect } from "@playwright/test";

test.describe("leads", () => {
  test("@area:leads @smoke synthetic lead is visible on /leads", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
    await expect(page.getByText(process.env.E2E_EXPECTED_LEAD_NAME ?? "E2E Synthetic", { exact: false })).toBeVisible();
  });
});

