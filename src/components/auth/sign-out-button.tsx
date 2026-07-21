"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/i18n/provider";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/sign-in");
              router.refresh();
            }
          }
        });
      }}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm font-semibold text-[#0F172A] transition hover:border-[#B7C6D6] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      {t("auth.account.signOut")}
    </button>
  );
}

