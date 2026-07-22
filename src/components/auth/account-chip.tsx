"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useI18n } from "@/i18n/provider";

export function AccountChip() {
  const router = useRouter();
  const emailDescriptionId = useId();
  const { t } = useI18n();
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => router.push("/sign-in")}
        className="inline-flex h-10 items-center rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 text-sm font-semibold text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)]/25 hover:bg-[color:var(--cb-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-elevated-surface)]"
      >
        {t("auth.account.signIn")}
      </button>
    );
  }

  const user = session.user;
  const displayName = user.name ?? t("auth.account.signedInUser");
  const email = user.email ?? t("auth.account.sessionActive");
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <details className="group rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)]">
      <summary
        title={displayName}
        aria-label={t("auth.account.menuFor", { name: displayName })}
        aria-describedby={emailDescriptionId}
        className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-[var(--cb-radius-lg)] px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-elevated-surface)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--cb-background)] text-sm font-semibold text-[color:var(--cb-foreground)]" aria-hidden="true">
          {initials}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold text-[color:var(--cb-foreground)]">{displayName}</span>
          <span id={emailDescriptionId} className="block truncate text-xs text-[color:var(--cb-muted-foreground)]">{email}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--cb-muted-foreground)] transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-[color:var(--cb-border)] p-2">
        <SignOutButton className="w-full" />
      </div>
    </details>
  );
}
