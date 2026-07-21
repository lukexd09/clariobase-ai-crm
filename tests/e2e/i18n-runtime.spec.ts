import { expect, test, type Browser } from "@playwright/test";

async function verifyRequestLocale(browser: Browser, acceptLanguage: string, expectedLocale: "pl-PL" | "en-US", expectedDescription: string) {
  const context = await browser.newContext({
    storageState: undefined,
    locale: acceptLanguage,
    extraHTTPHeaders: { "Accept-Language": acceptLanguage }
  });
  const page = await context.newPage();
  const hydrationErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|did not match|server rendered html/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (/hydration|did not match|server rendered html/i.test(error.message)) hydrationErrors.push(error.message);
  });

  try {
    const response = await page.goto("/sign-in");
    expect(response?.ok()).toBe(true);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("lang", expectedLocale);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", expectedDescription);
    expect(hydrationErrors).toEqual([]);

    const html = await response?.text();
    expect(html).toContain(`<html lang="${expectedLocale}">`);
  } finally {
    await context.close();
  }
}

test.describe("E010 request locale runtime", () => {
  test("@area:i18n Polish SSR and hydration share pl-PL", async ({ browser }) => {
    await verifyRequestLocale(browser, "pl-PL", "pl-PL", "Produkcyjny obszar pracy CRM ClarioBase");
  });

  test("@area:i18n unsupported browser language falls back to English", async ({ browser }) => {
    await verifyRequestLocale(browser, "de-DE", "en-US", "ClarioBase production CRM workspace");
  });
});
