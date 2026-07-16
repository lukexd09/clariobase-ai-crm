type AuthRuntimeEnvironment = Record<string, string | undefined>;

export type AuthRuntimeMode = "private-https" | "localhost-dev" | "disposable-test";

export type AuthRuntimeConfig = {
  mode: AuthRuntimeMode;
  baseURL: string;
  origin: string;
  trustedOrigins: string[];
  secret: string;
  secureCookies: boolean;
  privateHostname: string | null;
  privateHttpsPort: number | null;
  expectedForwardedHost: string | null;
};

const forbiddenBetterAuthOverrides = [
  "BETTER_AUTH_SECRETS",
  "BETTER_AUTH_TRUSTED_ORIGINS",
  "BETTER_AUTH_TELEMETRY",
  "BETTER_AUTH_TELEMETRY_DEBUG",
  "BETTER_AUTH_TELEMETRY_ENDPOINT"
] as const;

function fail(message: string): never {
  throw new Error(message);
}

function readRequired(env: AuthRuntimeEnvironment, name: string) {
  const value = env[name];
  if (!value) fail(`${name} is required for the authentication runtime`);
  return value;
}

function parseMode(env: AuthRuntimeEnvironment): AuthRuntimeMode {
  const mode = env.CRM_AUTH_RUNTIME_MODE;

  if (mode === "private-https" || mode === "localhost-dev" || mode === "disposable-test") {
    return mode;
  }

  if (!mode && env.NODE_ENV !== "production") {
    return "localhost-dev";
  }

  return fail("CRM_AUTH_RUNTIME_MODE must select an approved authentication runtime mode");
}

function assertNoHiddenOverrides(env: AuthRuntimeEnvironment) {
  for (const name of forbiddenBetterAuthOverrides) {
    const value = env[name];
    if (value === undefined || value === "") continue;
    if ((name === "BETTER_AUTH_TELEMETRY" || name === "BETTER_AUTH_TELEMETRY_DEBUG") && value === "0") {
      continue;
    }
    fail(`${name} is not accepted by the repository-owned authentication runtime`);
  }
}

function parseSecret(env: AuthRuntimeEnvironment, rejectPlaceholders: boolean) {
  const secret = readRequired(env, "BETTER_AUTH_SECRET");
  if (secret.length < 32) fail("BETTER_AUTH_SECRET must be at least 32 characters long");
  if (rejectPlaceholders && /replace|change[-_ ]?me|example|known[-_ ]?static/i.test(secret)) {
    fail("BETTER_AUTH_SECRET must not be a placeholder value");
  }
  return secret;
}

function parseOrigin(value: string, name: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return fail(`${name} must be a valid absolute origin`);
  }

  if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    fail(`${name} must be an origin without credentials, path, query, or fragment`);
  }

  if (parsed.hostname.includes("*") || parsed.hostname.includes("?")) {
    fail(`${name} must not contain wildcard hosts`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    fail(`${name} must use http or https`);
  }

  return parsed;
}

function isLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "::1" || /^127(?:\.\d{1,3}){3}$/.test(normalized);
}

function parsePrivateHostname(env: AuthRuntimeEnvironment) {
  const hostname = readRequired(env, "CRM_PRIVATE_HOSTNAME").toLowerCase();
  if (
    hostname !== hostname.trim()
    || hostname.includes("*")
    || hostname.includes(":")
    || isLoopbackHostname(hostname)
    || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/.test(hostname)
  ) {
    fail("CRM_PRIVATE_HOSTNAME must be one sanitized non-loopback DNS hostname");
  }
  return hostname;
}

function parsePrivatePort(env: AuthRuntimeEnvironment) {
  const raw = readRequired(env, "CRM_PRIVATE_HTTPS_PORT");
  if (!/^\d+$/.test(raw)) fail("CRM_PRIVATE_HTTPS_PORT must be an integer between 1 and 65535");
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    fail("CRM_PRIVATE_HTTPS_PORT must be an integer between 1 and 65535");
  }
  return port;
}

function effectivePort(url: URL) {
  if (url.port) return Number(url.port);
  return url.protocol === "https:" ? 443 : 80;
}

function parsePrivateTrustedOrigins(env: AuthRuntimeEnvironment, expectedOrigin: string) {
  const raw = readRequired(env, "CRM_AUTH_TRUSTED_ORIGINS");
  const values = raw.split(",");
  if (values.some((value) => value === "" || value !== value.trim())) {
    fail("CRM_AUTH_TRUSTED_ORIGINS must contain canonical comma-separated origins");
  }

  const origins = [...new Set(values.map((value) => parseOrigin(value, "CRM_AUTH_TRUSTED_ORIGINS").origin))];
  if (origins.length !== 1 || origins[0] !== expectedOrigin) {
    fail("CRM_AUTH_TRUSTED_ORIGINS must equal the configured private HTTPS origin");
  }
  return origins;
}

export function parseAuthRuntimeConfig(env: AuthRuntimeEnvironment = process.env) {
  assertNoHiddenOverrides(env);
  const mode = parseMode(env);
  const secret = parseSecret(env, mode === "private-https");
  const baseURL = parseOrigin(readRequired(env, "BETTER_AUTH_URL"), "BETTER_AUTH_URL");

  if (mode === "private-https") {
    const privateHostname = parsePrivateHostname(env);
    const privateHttpsPort = parsePrivatePort(env);
    if (baseURL.protocol !== "https:") fail("BETTER_AUTH_URL must use HTTPS in private-https mode");
    if (baseURL.hostname.toLowerCase() !== privateHostname) {
      fail("BETTER_AUTH_URL hostname must equal CRM_PRIVATE_HOSTNAME");
    }
    if (effectivePort(baseURL) !== privateHttpsPort) {
      fail("BETTER_AUTH_URL port must equal CRM_PRIVATE_HTTPS_PORT");
    }

    const trustedOrigins = parsePrivateTrustedOrigins(env, baseURL.origin);
    return {
      mode,
      baseURL: baseURL.origin,
      origin: baseURL.origin,
      trustedOrigins,
      secret,
      secureCookies: true,
      privateHostname,
      privateHttpsPort,
      expectedForwardedHost: baseURL.host
    } satisfies AuthRuntimeConfig;
  }

  if (baseURL.protocol !== "http:" || !isLoopbackHostname(baseURL.hostname)) {
    fail("Insecure authentication exceptions require an HTTP loopback BETTER_AUTH_URL");
  }
  if (mode === "disposable-test" && env.CRM_ALLOW_INSECURE_AUTH_TESTS !== "1") {
    fail("Disposable HTTP authentication requires CRM_ALLOW_INSECURE_AUTH_TESTS=1");
  }

  return {
    mode,
    baseURL: baseURL.origin,
    origin: baseURL.origin,
    trustedOrigins: [baseURL.origin],
    secret,
    secureCookies: false,
    privateHostname: null,
    privateHttpsPort: null,
    expectedForwardedHost: null
  } satisfies AuthRuntimeConfig;
}
