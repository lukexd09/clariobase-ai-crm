const ALLOWED_INTERNAL_PATHS = new Set(["/", "/leads"]);

function normalizePathname(pathname: string) {
  const collapsed = pathname.replace(/\/+/g, "/");
  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }
  return collapsed;
}

export function getSafeRedirectPath(input: string | null | undefined, fallback = "/") {
  const fallbackPath = ALLOWED_INTERNAL_PATHS.has(fallback) ? fallback : "/";

  if (!input) {
    return fallbackPath;
  }

  const candidate = input.trim();
  if (
    candidate.startsWith("http://") ||
    candidate.startsWith("https://") ||
    candidate.startsWith("//") ||
    candidate.includes("://")
  ) {
    return fallbackPath;
  }

  try {
    const parsed = new URL(candidate, "http://clariobase.local");
    if (parsed.origin !== "http://clariobase.local") {
      return fallbackPath;
    }

    const normalizedPath = normalizePathname(parsed.pathname || "/");
    if (!ALLOWED_INTERNAL_PATHS.has(normalizedPath)) {
      return fallbackPath;
    }

    return normalizedPath;
  } catch {
    return fallbackPath;
  }
}
