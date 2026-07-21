import { expect, test, type Browser } from "@playwright/test";

async function verifyRequestLocale(
  browser: Browser,
  acceptLanguage: string,
  expectedLocale: "pl-PL" | "en-US",
  expectedDescription: string,
  expectedSignIn: string,
  expectedDashboard: string
) {
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
    await expect(page.getByRole("heading", { name: expectedSignIn })).toBeVisible();
    await expect(page.getByRole("navigation", { name: expectedLocale === "pl-PL" ? "Główna nawigacja" : "Primary navigation" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: expectedDashboard }).first()).toBeVisible();
    expect(hydrationErrors).toEqual([]);

    const html = await response?.text();
    expect(html).toContain(`<html lang="${expectedLocale}">`);
  } finally {
    await context.close();
  }
}

test.describe("E010 request locale runtime", () => {
  test("@area:i18n Polish SSR and hydration share pl-PL", async ({ browser }) => {
    await verifyRequestLocale(browser, "pl-PL", "pl-PL", "Produkcyjny obszar pracy CRM ClarioBase", "Zaloguj się", "Pulpit");
  });

  test("@area:i18n unsupported browser language falls back to English", async ({ browser }) => {
    await verifyRequestLocale(browser, "de-DE", "en-US", "ClarioBase production CRM workspace", "Sign in", "Dashboard");
  });

  test("@area:i18n Polish sign-in loading and error states stay localized", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined, locale: "pl-PL" });
    const page = await context.newPage();
    await page.route("**/api/auth/sign-in/email", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.continue();
    });

    try {
      await page.goto("/sign-in");
      await page.getByLabel("E-mail").fill("missing-user@example.test");
      await page.getByLabel("Hasło").fill("invalid-password-value");
      const submit = page.locator('button[type="submit"]');
      await submit.click();
      await expect(submit).toHaveText("Logowanie...");
      await expect(submit).toBeDisabled();
      await expect(page.getByText("Logowanie nie powiodło się. Sprawdź dane i spróbuj ponownie.", { exact: true })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("@area:i18n authenticated Polish shell signs out without locale drift", async ({ browser }) => {
    const storageState = process.env.PLAYWRIGHT_STORAGE_STATE;
    expect(storageState).toBeTruthy();
    const context = await browser.newContext({ storageState, locale: "pl-PL" });
    const page = await context.newPage();
    const hydrationErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /hydration|did not match|server rendered html/i.test(message.text())) hydrationErrors.push(message.text());
    });

    try {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", "pl-PL");
      await expect(page.getByRole("link", { name: "Pulpit" }).first()).toBeVisible();
      const signOut = page.getByRole("button", { name: "Wyloguj się" }).first();
      await expect(signOut).toBeVisible();
      await signOut.click();
      await page.waitForURL(/\/sign-in$/);
      await expect(page.getByRole("heading", { name: "Zaloguj się" })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", "pl-PL");
      expect(hydrationErrors).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
