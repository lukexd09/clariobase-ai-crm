import { expect, test, type Browser, type Page } from "@playwright/test";

async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
    return scrollWidth > window.innerWidth;
  });

  expect(hasOverflow).toBe(false);
}

async function newAnonymousPage(browser: Browser) {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();

  return { context, page };
}

test.describe("Anonymous sign-in surface", () => {
  test("@smoke anonymous root shows sign-in and no dashboard content", async ({ browser }) => {
    const { context, page } = await newAnonymousPage(browser);

    try {
      await page.goto("/");

      const watermark = page.getByTestId("environment-watermark");
      const marks = page.getByTestId("environment-watermark-mark");

      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Today's priorities" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Pipeline snapshot" })).toHaveCount(0);
      await expect(page.getByText(/sign up/i)).toHaveCount(0);
      await expect(watermark).toBeVisible();
      await expect(watermark).toHaveAttribute("aria-hidden", "true");
      await expect(watermark).toHaveCSS("pointer-events", "none");
      await expect(watermark).toHaveCSS("user-select", "none");
      expect(await marks.count()).toBeGreaterThan(1);
      await assertNoHorizontalOverflow(page);
    } finally {
      await context.close().catch(() => undefined);
    }
  });

  test("@smoke protected routes redirect to sign-in with bounded returnTo", async ({ browser }) => {
    const { context, page } = await newAnonymousPage(browser);

    try {
      await page.goto("/leads");
      await page.waitForURL(/\/sign-in\?returnTo=/);

      const signInUrl = new URL(page.url());

      expect(signInUrl.pathname).toBe("/sign-in");
      expect(signInUrl.searchParams.get("returnTo")).toBe("/leads");
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Today's priorities" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Pipeline snapshot" })).toHaveCount(0);
      await expect(page.getByText(/sign up/i)).toHaveCount(0);
      await assertNoHorizontalOverflow(page);
    } finally {
      await context.close().catch(() => undefined);
    }
  });
});
