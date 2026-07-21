"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useI18n } from "@/i18n/provider";

export function AccountChip() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => router.push("/sign-in")}
        className="inline-flex h-10 items-center rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm font-semibold text-[#0F172A] transition hover:border-[#B7C6D6] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {t("auth.account.signIn")}
      </button>
    );
  }

  const user = session.user;
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-sm font-semibold text-[#0F172A]" aria-hidden="true">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#0F172A]">
          {user.name ?? t("auth.account.signedInUser")}
        </span>
        <span className="block truncate text-xs uppercase tracking-[0.14em] text-[#475569]">
          {user.email ?? t("auth.account.sessionActive")}
        </span>
      </span>
      <SignOutButton />
    </div>
  );
}
