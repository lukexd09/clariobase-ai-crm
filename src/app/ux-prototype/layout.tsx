import type { Metadata } from "next";
import { UxPrototypeShell } from "@/components/ux-prototype-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "UX prototype",
  robots: { index: false, follow: false }
};

export default function UxPrototypeLayout({ children }: { children: React.ReactNode }) {
  return <UxPrototypeShell>{children}</UxPrototypeShell>;
}
