import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAppAuth } from "@/lib/auth";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  banned: boolean | null;
};

export type AccessContext = {
  user: CurrentUser;
  organizationId: null;
  workspaceId: null;
};

export type UnauthorizedResult = {
  ok: false;
  message: string;
  status: 401;
};

const auth = createAppAuth();

function toCurrentUser(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  if (!session?.user?.id) {
    return null;
  }

  const sessionUser = session.user as unknown as Record<string, unknown>;

  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    role: typeof sessionUser.role === "string"
      ? sessionUser.role
      : null,
    banned: typeof sessionUser.banned === "boolean"
      ? sessionUser.banned
      : null
  } satisfies CurrentUser;
}

export async function getCurrentUser(input?: { headers?: Headers }) {
  const requestHeaders = input?.headers ?? (await getRequestHeadersOrNull());
  if (!requestHeaders) {
    return null;
  }

  const session = await auth.api.getSession({
    headers: requestHeaders
  });

  return toCurrentUser(session);
}

export async function requireUser(options?: {
  headers?: Headers;
  mode?: "error" | "redirect";
  returnTo?: string | null;
}) {
  const currentUser = await getCurrentUser({ headers: options?.headers });
  if (currentUser) {
    return currentUser;
  }

  if (options?.mode === "redirect") {
    const target = getSafeRedirectPath(options.returnTo, "/");
    redirect(`/sign-in?returnTo=${encodeURIComponent(target)}`);
  }

  throw new Error("Unauthorized");
}

async function getRequestHeadersOrNull() {
  try {
    return await headers();
  } catch {
    return null;
  }
}

export async function getAccessContext(input?: { headers?: Headers }) {
  const user = await getCurrentUser(input);

  if (!user) {
    return null;
  }

  return {
    user,
    organizationId: null,
    workspaceId: null
  } satisfies AccessContext;
}

export function unauthorizedResult(message = "Unauthorized"): UnauthorizedResult {
  return {
    ok: false,
    message,
    status: 401
  };
}
