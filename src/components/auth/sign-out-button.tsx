"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function SignOutButton({ className = "" }: { className?: string }) {
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
      className={cn("inline-flex h-9 items-center justify-center rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 text-sm font-semibold text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)]/25 hover:bg-[color:var(--cb-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-surface)]", className)}
    >
      {t("auth.account.signOut")}
    </button>
  );
}

