import { test, expect } from "@playwright/test";

test.describe("leads", () => {
  test("@area:leads @smoke synthetic lead is visible on /leads", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.getByText("E2E Synthetic", { exact: false })).toBeVisible();
  });
});

