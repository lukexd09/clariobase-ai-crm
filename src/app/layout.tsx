import type { Metadata } from "next";
import { AppShellSession } from "@/components/app-shell-session";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClarioBase AI CRM",
  description: "ClarioBase production CRM workspace"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShellSession>
          {children}
        </AppShellSession>
      </body>
    </html>
  );
}
