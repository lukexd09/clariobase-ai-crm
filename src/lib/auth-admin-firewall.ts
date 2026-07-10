export function isPublicAdminAuthPath(request: Request) {
  let pathname = new URL(request.url).pathname;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const decoded = decodeURIComponent(pathname);
      if (decoded === pathname) break;
      pathname = decoded;
    } catch {
      return true;
    }
  }

  const normalized = pathname.replaceAll("\\", "/").replace(/\/{2,}/g, "/").toLowerCase();
  const basePath = "/api/auth";
  if (!normalized.startsWith(basePath)) return false;

  const authPath = normalized.slice(basePath.length);
  return authPath === "/admin" || authPath.startsWith("/admin/");
}

export function withAdminNamespaceFirewall(handler: (request: Request) => Promise<Response>) {
  return (request: Request) => {
    if (isPublicAdminAuthPath(request)) {
      return Promise.resolve(new Response(null, { status: 404 }));
    }

    return handler(request);
  };
}
