import type { Metadata } from "next";
import { EnvironmentIndicator } from "@/components/environment-indicator";
import { AppShell } from "@/components/app-shell";
import { I18nProvider } from "@/i18n/provider";
import { getI18n } from "@/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("metadata.title"), description: t("metadata.description") };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getI18n();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          <EnvironmentIndicator />
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
