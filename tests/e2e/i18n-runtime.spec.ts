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

  test("@area:i18n core workflow stays localized and preserves imported content", async ({ browser }) => {
    const email = process.env.CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL;
    const password = process.env.CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD;
    const leadId = process.env.PLAYWRIGHT_E010_LEAD_ID;
    const businessName = process.env.PLAYWRIGHT_E010_BUSINESS_NAME;
    const category = process.env.PLAYWRIGHT_E010_CATEGORY;
    expect(email).toBeTruthy();
    expect(password).toBeTruthy();
    expect(leadId).toBeTruthy();
    expect(businessName).toBeTruthy();
    expect(category).toBeTruthy();
    if (!email || !password || !leadId || !businessName || !category) {
      throw new Error("Missing disposable E010 fixture");
    }

    const hydrationErrors: string[] = [];
    const polish = await browser.newContext({
      storageState: undefined,
      locale: "pl-PL",
      extraHTTPHeaders: { "Accept-Language": "pl-PL" }
    });
    const page = await polish.newPage();
    page.on("console", (message) => {
      if (message.type() === "error" && /hydration|did not match|server rendered html/i.test(message.text())) hydrationErrors.push(message.text());
    });

    try {
      await page.goto("/sign-in");
      await page.getByLabel("E-mail").fill(email);
      await page.getByLabel("Hasło").fill(password);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/$/);
      await expect(page.getByRole("heading", { name: "Pulpit" })).toBeVisible();
      await expect(page.getByText("Dzisiejsze priorytety", { exact: true })).toBeVisible();

      await page.goto("/work");
      await expect(page.getByRole("heading", { name: "Kolejka pracy" })).toBeVisible();
      await expect(page.getByText(businessName, { exact: true })).toBeVisible();

      await page.goto("/leads");
      await expect(page.getByRole("heading", { name: "Leady" })).toBeVisible();
      await expect(page.getByText(businessName, { exact: true })).toBeVisible();
      await expect(page.getByText(category, { exact: true })).toBeVisible();

      await page.goto(`/leads/${leadId}`);
      await expect(page.getByRole("heading", { name: businessName })).toBeVisible();
      await expect(page.getByText(category, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(/21 lip.*12:30/).first()).toBeVisible();
      await expect(page.getByText(/1[\s\u00a0]?234,50/).first()).toBeVisible();
      await expect(page.getByText("Notatki, wiadomości i aktualizacje", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Dodaj aktywność" }).click();
      await expect(page.locator("#activity-form-feedback")).toHaveText("Tytuł aktywności jest wymagany");
      await expect(page.locator("html")).toHaveAttribute("lang", "pl-PL");
      expect(hydrationErrors).toEqual([]);

      const english = await browser.newContext({
        storageState: await polish.storageState(),
        locale: "en-US",
        extraHTTPHeaders: { "Accept-Language": "en-US" }
      });
      const englishPage = await english.newPage();
      try {
        await englishPage.goto("/");
        await expect(englishPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();
        await expect(englishPage.getByText("Today's priorities", { exact: true })).toBeVisible();
        await englishPage.goto("/work");
        await expect(englishPage.getByRole("heading", { name: "Work queue" })).toBeVisible();
        await expect(englishPage.getByText(businessName, { exact: true })).toBeVisible();
        await englishPage.goto("/leads");
        await expect(englishPage.getByRole("heading", { name: "Leads" })).toBeVisible();
        await expect(englishPage.getByText(category, { exact: true })).toBeVisible();
        await englishPage.goto(`/leads/${leadId}`);
        await expect(englishPage.locator("html")).toHaveAttribute("lang", "en-US");
        await expect(englishPage.getByText(/Jul 21, 2026, 12:30 PM/).first()).toBeVisible();
        await expect(englishPage.getByText(/PLN[\s\u00a0]?1,234\.50/).first()).toBeVisible();
        await expect(englishPage.getByText("Notes, messages, and updates", { exact: true })).toBeVisible();
        await expect(englishPage.getByText(businessName, { exact: true }).first()).toBeVisible();
        await expect(englishPage.getByText(category, { exact: true }).first()).toBeVisible();
      } finally {
        await english.close();
      }
    } finally {
      await polish.close();
    }
  });
});
