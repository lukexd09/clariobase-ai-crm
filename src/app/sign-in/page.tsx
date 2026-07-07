"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeRedirectPath(searchParams.get("returnTo"), "/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-10">
      <div className="w-full rounded-xl border border-[#CBD5E1] bg-white p-6 min-[768px]:p-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">ClarioBase</p>
          <h1 className="text-3xl font-semibold text-[#0F172A]">Sign in</h1>
          <p className="max-w-prose text-sm text-[#475569]">
            Use your active account to continue into the workspace.
          </p>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError(null);

            const { error: signInError } = await authClient.signIn.email({
              email,
              password,
              callbackURL: returnTo
            });

            setLoading(false);

            if (signInError) {
              setError("Sign in failed. Check your credentials and try again.");
              return;
            }

            router.push(returnTo);
            router.refresh();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#0F172A]">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#475569] focus:border-[#B7C6D6] focus:ring-2 focus:ring-[#006194]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#0F172A]">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#475569] focus:border-[#B7C6D6] focus:ring-2 focus:ring-[#006194]"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A]">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#475569]">Protected by Better Auth session cookies.</p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#006194] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

