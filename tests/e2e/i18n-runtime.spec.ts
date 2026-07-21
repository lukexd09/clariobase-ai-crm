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
    test.setTimeout(120_000);
    const email = process.env.CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL;
    const password = process.env.CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD;
    const leadId = process.env.PLAYWRIGHT_E010_LEAD_ID;
    const businessName = process.env.PLAYWRIGHT_E010_BUSINESS_NAME;
    const category = process.env.PLAYWRIGHT_E010_CATEGORY;
    const importId = process.env.PLAYWRIGHT_E010_IMPORT_ID;
    const duplicateId = process.env.PLAYWRIGHT_E010_DUPLICATE_ID;
    expect(email).toBeTruthy();
    expect(password).toBeTruthy();
    expect(leadId).toBeTruthy();
    expect(businessName).toBeTruthy();
    expect(category).toBeTruthy();
    expect(importId).toBeTruthy();
    expect(duplicateId).toBeTruthy();
    if (!email || !password || !leadId || !businessName || !category || !importId || !duplicateId) {
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
      await expect(page.getByText(category, { exact: true }).first()).toBeVisible();

      await page.goto(`/leads/${leadId}`);
      await expect(page.getByRole("heading", { name: businessName })).toBeVisible();
      await expect(page.getByText(category, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(/21 lip.*12:30/).first()).toBeVisible();
      await expect(page.getByText(/1[\s\u00a0]?234,50/).first()).toBeVisible();
      await expect(page.getByText("Notatki, wiadomości i aktualizacje", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Dodaj aktywność" }).click();
      await expect(page.locator("#activity-form-feedback")).toHaveText("Tytuł aktywności jest wymagany");
      await page.goto("/imports");
      await expect(page.getByRole("heading", { name: "Partie importu" })).toBeVisible();
      await expect(page.getByText(/Źródło użytkownika/).first()).toBeVisible();
      await page.goto(`/imports/${importId}`);
      await page.getByText("Szczegóły walidacji technicznej", { exact: true }).click();
      await expect(page.getByText("RAW_VALIDATION_MESSAGE", { exact: true })).toBeVisible();
      await page.goto("/duplicates");
      await expect(page.getByRole("heading", { name: "Kandydaci na duplikaty" })).toBeVisible();
      await page.goto(`/duplicates/${duplicateId}`);
      await expect(page.getByText("Ten sam numer telefonu", { exact: true })).toBeVisible();
      await expect(page.getByText("Raw duplicate reason", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Oznacz weryfikację jako zakończoną" }).click();
      await expect(page.getByRole("status")).toHaveText("Zaktualizowano weryfikację duplikatu.");
      await page.goto("/reports/sales");
      await expect(page.getByRole("heading", { name: "Operacyjny raport lejka" })).toBeVisible();
      await page.goto("/admin/users");
      await expect(page.getByRole("heading", { name: "Dostęp użytkowników" })).toBeVisible();
      await page.goto("/health");
      await expect(page.getByRole("heading", { name: "Kontrola działania" })).toBeVisible();
      await expect(page.getByText("clariobase-ai-crm", { exact: true })).toBeVisible();
      await page.goto("/brak-takiej-strony");
      await expect(page.getByRole("heading", { name: "Ta strona jest niedostępna" })).toBeVisible();
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
        await expect(englishPage.getByText(category, { exact: true }).first()).toBeVisible();
        await englishPage.goto(`/leads/${leadId}`);
        await expect(englishPage.locator("html")).toHaveAttribute("lang", "en-US");
        await expect(englishPage.getByText(/Jul 21, 2026, 12:30 PM/).first()).toBeVisible();
        await expect(englishPage.getByText(/PLN[\s\u00a0]?1,234\.50/).first()).toBeVisible();
        await expect(englishPage.getByText("Notes, messages, and updates", { exact: true })).toBeVisible();
        await expect(englishPage.getByText(businessName, { exact: true }).first()).toBeVisible();
        await expect(englishPage.getByText(category, { exact: true }).first()).toBeVisible();
        await englishPage.goto("/imports");
        await expect(englishPage.getByRole("heading", { name: "Import batches" })).toBeVisible();
        await englishPage.goto(`/imports/${importId}`);
        await englishPage.getByText("Technical validation details", { exact: true }).click();
        await expect(englishPage.getByText("RAW_VALIDATION_MESSAGE", { exact: true })).toBeVisible();
        await englishPage.goto("/duplicates");
        await expect(englishPage.getByRole("heading", { name: "Duplicate candidates" })).toBeVisible();
        await englishPage.goto(`/duplicates/${duplicateId}`);
        await expect(englishPage.getByText("Same phone number", { exact: true })).toBeVisible();
        await expect(englishPage.getByText("Raw duplicate reason", { exact: true })).toBeVisible();
        await englishPage.goto("/reports/sales");
        await expect(englishPage.getByRole("heading", { name: "Operational pipeline report" })).toBeVisible();
        await englishPage.goto("/admin/users");
        await expect(englishPage.getByRole("heading", { name: "User access" })).toBeVisible();
        await englishPage.goto("/health");
        await expect(englishPage.getByRole("heading", { name: "Health check" })).toBeVisible();
        await englishPage.goto("/missing-page");
        await expect(englishPage.getByRole("heading", { name: "This page is unavailable" })).toBeVisible();
      } finally {
        await english.close();
      }
    } finally {
      await polish.close();
    }
  });
});
