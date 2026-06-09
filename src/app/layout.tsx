import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClarioBase AI CRM",
  description: "ClarioBase AI CRM technical skeleton"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
