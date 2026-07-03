import { expect, test } from "@playwright/test";

test.describe("ClarioBase Playwright proof", () => {
  test("@smoke home page exposes the operator dashboard heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today's priorities" })).toBeVisible();
  });

  test("@area:dashboard dashboard priorities remain visible as an explicit area proof", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Today's priorities" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pipeline snapshot" })).toBeVisible();
  });
});
