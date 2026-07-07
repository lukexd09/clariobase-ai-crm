import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { createAppAuth } from "@/lib/auth";

export async function AppShellSession({
  children
}: {
  children: React.ReactNode;
}) {
  const auth = createAppAuth();
  const session = await auth.api.getSession({
    headers: await headers()
  });

  return (
    <AppShell
      session={session?.user ? { name: session.user.name, email: session.user.email } : null}
    >
      {children}
    </AppShell>
  );
}

