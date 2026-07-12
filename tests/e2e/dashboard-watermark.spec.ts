import { expect, test, type Page } from "@playwright/test";

const oldBannerText = "TEST ENVIRONMENT — data in this environment may be reset or deleted.";

async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
    return scrollWidth > window.innerWidth;
  });

  expect(hasOverflow).toBe(false);
}

test.describe("Dashboard environment watermark", () => {
  test("@area:dashboard watermark overlay stays decorative and does not block dashboard navigation", async ({ page }) => {
    await page.goto("/");

    const watermark = page.getByTestId("environment-watermark");
    const marks = page.getByTestId("environment-watermark-mark");

    await expect(watermark).toBeVisible();
    await expect(watermark).toHaveAttribute("aria-hidden", "true");
    await expect(watermark).toHaveCSS("pointer-events", "none");
    await expect(watermark).toHaveCSS("user-select", "none");
    await expect(watermark).toHaveCSS("position", "fixed");
    await expect(page.getByText(oldBannerText)).toHaveCount(0);

    expect(await marks.count()).toBeGreaterThan(1);
    await assertNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "System status" }).click();
    await expect(page).toHaveURL(/\/health$/);
    await expect(page.getByRole("heading", { name: "Health check" })).toBeVisible();
    await expect(watermark).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("@area:dashboard watermark overlay remains usable at tablet width", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    const watermark = page.getByTestId("environment-watermark");
    const marks = page.getByTestId("environment-watermark-mark");

    await expect(watermark).toBeVisible();
    expect(await marks.count()).toBeGreaterThan(1);
    await assertNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("link", { name: "System status" }).click();
    await expect(page).toHaveURL(/\/health$/);
    await expect(page.getByRole("heading", { name: "Health check" })).toBeVisible();
    await expect(watermark).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
