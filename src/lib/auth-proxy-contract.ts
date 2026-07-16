import { parseAuthRuntimeConfig, type AuthRuntimeConfig } from "@/lib/auth-runtime-config";

type AuthRouteHandler = (request: Request) => Promise<Response>;

function hasOneExactValue(headers: Headers, name: string, expected: string) {
  const value = headers.get(name);
  return value === expected && !value.includes(",");
}

export function hasAcceptedAuthProxyHeaders(request: Request, config: AuthRuntimeConfig) {
  if (config.mode !== "private-https") return true;
  if (!config.expectedForwardedHost) return false;
  if (request.headers.has("forwarded")) return false;

  return (
    hasOneExactValue(request.headers, "host", config.expectedForwardedHost)
    && hasOneExactValue(request.headers, "x-forwarded-host", config.expectedForwardedHost)
    && hasOneExactValue(request.headers, "x-forwarded-proto", "https")
  );
}

export function withAuthProxyContract(
  handler: AuthRouteHandler,
  readConfig: () => AuthRuntimeConfig = () => parseAuthRuntimeConfig()
) {
  return (request: Request) => {
    let config: AuthRuntimeConfig;
    try {
      config = readConfig();
    } catch {
      return Promise.resolve(new Response(null, { status: 503 }));
    }

    if (!hasAcceptedAuthProxyHeaders(request, config)) {
      return Promise.resolve(new Response(null, { status: 400 }));
    }

    return handler(request);
  };
}
