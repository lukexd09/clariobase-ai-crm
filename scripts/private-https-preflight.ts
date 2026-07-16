import { spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

import { parseAuthRuntimeConfig } from "@/lib/auth-runtime-config";

import { parseEnvFileContent, readText, validateFullCommitSha } from "./preview-runtime-support";

type PrivateHttpsEnv = {
  CRM_PRIVATE_BIND_ADDRESS: string;
  CRM_PRIVATE_HOSTNAME: string;
  CRM_PRIVATE_HTTPS_PORT: string;
  CRM_AUTH_RUNTIME_MODE: string;
  CRM_AUTH_TRUSTED_ORIGINS: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  AI_EXCHANGE_HOST_PATH: string;
  CRM_POSTGRES_DB: string;
  CRM_POSTGRES_USER: string;
  CRM_POSTGRES_PASSWORD: string;
  CRM_DATABASE_URL: string;
  CRM_PRIVATE_APP_IMAGE: string;
  CRM_PRIVATE_INGRESS_IMAGE: string;
  CRM_POSTGRES_IMAGE: string;
};

type ComposePort = {
  published?: string | number;
  target?: number;
  host_ip?: string;
  protocol?: string;
};

type ComposeService = {
  image?: unknown;
  build?: unknown;
  pull_policy?: unknown;
  ports?: ComposePort[];
  privileged?: unknown;
  network_mode?: unknown;
  volumes?: unknown[];
};

type ComposeConfig = {
  services?: Record<string, ComposeService>;
};

const repoRoot = path.resolve(__dirname, "..");
const composeEnvFileFlag = "--env-file";
const composeConfigFiles = ["compose.yaml", "compose.private-https.yaml"];
const immutableImageReferencePattern = /^(?:sha256:[0-9a-f]{64}|[^\s@]+(?:\:[^\s@]+)?@sha256:[0-9a-f]{64})$/i;

function usage() {
  return [
    "Usage:",
    "  corepack pnpm private-https:preflight -- --env-file <path> [--expected-source-sha <sha>]",
    "",
    "Checks:",
    "  - explicit loopback or RFC1918 bind address",
    "  - immutable app, ingress, and PostgreSQL image references",
    "  - exact application source SHA label and validated image variant",
    "  - private HTTPS compose topology with no app or PostgreSQL host ports"
  ].join("\n");
}

function parseArgs(argv: string[]) {
  let envFile = "";
  let expectedSourceSha = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-h" || arg === "--help") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === composeEnvFileFlag) {
      envFile = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--expected-source-sha") {
      expectedSourceSha = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (/^[-/]/.test(arg)) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    if (arg.endsWith(".ts") || arg.endsWith(".tsx") || arg.endsWith(".js") || arg.endsWith(".mjs")) {
      continue;
    }

    if (!envFile) {
      envFile = arg;
      continue;
    }

    throw new Error(`Unexpected positional argument: ${arg}`);
  }

  return {
    envFile,
    expectedSourceSha
  };
}

function asRecord(env: Map<string, string>) {
  return Object.fromEntries(env.entries()) as Record<string, string>;
}

function requireEnv(env: Map<string, string>, name: keyof PrivateHttpsEnv) {
  const value = env.get(name) ?? "";
  if (!value.trim()) {
    throw new Error(`Private HTTPS env field ${name} must be non-empty.`);
  }
  return value;
}

function isRfc1918Ipv4(address: string) {
  const [a, b] = address.split(".").map((part) => Number(part));
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  return a === 172 && b >= 16 && b <= 31;
}

function classifyBindAddress(address: string) {
  const normalized = address.trim();
  if (!normalized || normalized !== address) {
    throw new Error("CRM_PRIVATE_BIND_ADDRESS must be a trimmed explicit address.");
  }

  if (normalized === "0.0.0.0" || normalized === "::") {
    throw new Error("CRM_PRIVATE_BIND_ADDRESS must not use a wildcard bind address.");
  }

  const kind = net.isIP(normalized);
  if (kind === 4) {
    if (normalized.startsWith("127.")) return "loopback";
    if (isRfc1918Ipv4(normalized)) return "rfc1918";
    throw new Error("CRM_PRIVATE_BIND_ADDRESS must be an explicit loopback or RFC1918 IPv4 address.");
  }

  if (kind === 6) {
    if (normalized === "::1") return "loopback";
    throw new Error("CRM_PRIVATE_BIND_ADDRESS must be an explicit loopback or RFC1918 IPv4 address.");
  }

  throw new Error("CRM_PRIVATE_BIND_ADDRESS must be a valid loopback or RFC1918 IP address.");
}

function assertImmutableImageReference(imageRef: string, fieldName: string) {
  if (!immutableImageReferencePattern.test(imageRef)) {
    throw new Error(`${fieldName} must use an immutable image reference or full image ID.`);
  }
}

function inspectImageLabels(imageRef: string) {
  const result = spawnSync("docker", ["image", "inspect", imageRef, "--format", "{{json .Config.Labels}}"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.status !== 0) {
    throw new Error(`Unable to inspect ${imageRef} for immutable label validation: ${(result.stderr ?? result.stdout ?? "").trim()}`);
  }

  let labels: Record<string, string> | null;
  try {
    labels = JSON.parse(String(result.stdout ?? "").trim()) as Record<string, string> | null;
  } catch {
    throw new Error(`Unable to parse labels for ${imageRef}.`);
  }

  return labels ?? {};
}

function validateDatabaseUrl(env: PrivateHttpsEnv) {
  if (!env.CRM_DATABASE_URL) {
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(env.CRM_DATABASE_URL);
  } catch {
    throw new Error("CRM_DATABASE_URL must be a valid postgresql URL when provided.");
  }

  if (parsed.protocol !== "postgresql:") {
    throw new Error("CRM_DATABASE_URL must use the postgresql protocol when provided.");
  }

  if (parsed.hostname !== "crm-postgres") {
    throw new Error("CRM_DATABASE_URL must target the private PostgreSQL host crm-postgres.");
  }

  if (parsed.port !== "5432") {
    throw new Error("CRM_DATABASE_URL must target PostgreSQL port 5432.");
  }

  if (parsed.username !== env.CRM_POSTGRES_USER) {
    throw new Error("CRM_DATABASE_URL user must equal CRM_POSTGRES_USER.");
  }

  const databaseName = parsed.pathname.replace(/^\//, "");
  if (databaseName !== env.CRM_POSTGRES_DB) {
    throw new Error("CRM_DATABASE_URL database must equal CRM_POSTGRES_DB.");
  }
}

function loadPrivateHttpsEnv(envFilePath: string) {
  const rawEnv = parseEnvFileContent(readText(envFilePath));
  const env: PrivateHttpsEnv = {
    CRM_PRIVATE_BIND_ADDRESS: requireEnv(rawEnv, "CRM_PRIVATE_BIND_ADDRESS"),
    CRM_PRIVATE_HOSTNAME: requireEnv(rawEnv, "CRM_PRIVATE_HOSTNAME"),
    CRM_PRIVATE_HTTPS_PORT: requireEnv(rawEnv, "CRM_PRIVATE_HTTPS_PORT"),
    CRM_AUTH_RUNTIME_MODE: requireEnv(rawEnv, "CRM_AUTH_RUNTIME_MODE"),
    CRM_AUTH_TRUSTED_ORIGINS: requireEnv(rawEnv, "CRM_AUTH_TRUSTED_ORIGINS"),
    BETTER_AUTH_URL: requireEnv(rawEnv, "BETTER_AUTH_URL"),
    BETTER_AUTH_SECRET: requireEnv(rawEnv, "BETTER_AUTH_SECRET"),
    AI_EXCHANGE_HOST_PATH: requireEnv(rawEnv, "AI_EXCHANGE_HOST_PATH"),
    CRM_POSTGRES_DB: requireEnv(rawEnv, "CRM_POSTGRES_DB"),
    CRM_POSTGRES_USER: requireEnv(rawEnv, "CRM_POSTGRES_USER"),
    CRM_POSTGRES_PASSWORD: requireEnv(rawEnv, "CRM_POSTGRES_PASSWORD"),
    CRM_DATABASE_URL: rawEnv.get("CRM_DATABASE_URL") ?? "",
    CRM_PRIVATE_APP_IMAGE: requireEnv(rawEnv, "CRM_PRIVATE_APP_IMAGE"),
    CRM_PRIVATE_INGRESS_IMAGE: rawEnv.get("CRM_PRIVATE_INGRESS_IMAGE") ?? "",
    CRM_POSTGRES_IMAGE: rawEnv.get("CRM_POSTGRES_IMAGE") ?? ""
  };

  if (env.CRM_AUTH_RUNTIME_MODE !== "private-https") {
    throw new Error("CRM_AUTH_RUNTIME_MODE must be private-https for private HTTPS preflight.");
  }

  classifyBindAddress(env.CRM_PRIVATE_BIND_ADDRESS);
  validateDatabaseUrl(env);
  parseAuthRuntimeConfig(env);

  return {
    env,
    rawEnv
  };
}

function runComposeConfig(envFilePath: string, env: Record<string, string>) {
  return spawnSync(
    "docker",
    [
      "compose",
      "--env-file",
      envFilePath,
      "-f",
      composeConfigFiles[0],
      "-f",
      composeConfigFiles[1],
      "config",
      "--format",
      "json"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
      env: {
        ...process.env,
        ...env
      }
    }
  );
}

function validatePorts(serviceName: string, service: ComposeService | undefined) {
  if (!service) {
    throw new Error(`Private HTTPS compose model must define ${serviceName}.`);
  }

  const ports = service.ports ?? [];
  return ports;
}

function assertNoDockerSocket(serviceName: string, service: ComposeService | undefined) {
  const volumeString = JSON.stringify(service?.volumes ?? []);
  if (/docker\.sock/i.test(volumeString)) {
    throw new Error(`Private HTTPS compose model must not mount the Docker socket in ${serviceName}.`);
  }
}

function assertNoPrivilegedOrHostNetwork(serviceName: string, service: ComposeService | undefined) {
  if (!service) {
    throw new Error(`Private HTTPS compose model must define ${serviceName}.`);
  }

  if (service.privileged === true) {
    throw new Error(`Private HTTPS compose model must not enable privileged mode for ${serviceName}.`);
  }

  if (service.network_mode === "host") {
    throw new Error(`Private HTTPS compose model must not use host networking for ${serviceName}.`);
  }
}

function validateComposeModel(config: ComposeConfig, env: PrivateHttpsEnv) {
  const services = config.services ?? {};
  const app = services["crm-app"];
  const postgres = services["crm-postgres"];
  const ingress = services["crm-private-ingress"];

  if (!app) {
    throw new Error("Private HTTPS compose model must define crm-app.");
  }

  if (!postgres) {
    throw new Error("Private HTTPS compose model must define crm-postgres.");
  }

  if (!ingress) {
    throw new Error("Private HTTPS compose model must define crm-private-ingress.");
  }

  if (app.build !== undefined) {
    throw new Error("Private HTTPS compose model must not include crm-app.build.");
  }

  if (app.pull_policy !== "never") {
    throw new Error("Private HTTPS compose model must set crm-app.pull_policy to never.");
  }

  assertImmutableImageReference(String(app.image ?? ""), "crm-app.image");
  assertImmutableImageReference(String(postgres.image ?? ""), "crm-postgres.image");
  assertImmutableImageReference(String(ingress.image ?? ""), "crm-private-ingress.image");

  if (String(app.image ?? "") !== env.CRM_PRIVATE_APP_IMAGE) {
    throw new Error("crm-app.image must equal CRM_PRIVATE_APP_IMAGE.");
  }

  if ((validatePorts("crm-app", app)).length !== 0) {
    throw new Error("Private HTTPS compose model must not publish any host ports for crm-app.");
  }

  if ((validatePorts("crm-postgres", postgres)).length !== 0) {
    throw new Error("Private HTTPS compose model must not publish any host ports for crm-postgres.");
  }

  const ingressPorts = validatePorts("crm-private-ingress", ingress);
  if (ingressPorts.length !== 1) {
    throw new Error("Private HTTPS compose model must publish exactly one ingress port.");
  }

  const ingressPort = ingressPorts[0];
  if (String(ingressPort.published ?? "") !== env.CRM_PRIVATE_HTTPS_PORT) {
    throw new Error("Private HTTPS ingress must publish the configured HTTPS port.");
  }

  if (ingressPort.target !== 443) {
    throw new Error("Private HTTPS ingress must target container port 443.");
  }

  if (String(ingressPort.host_ip ?? "") !== env.CRM_PRIVATE_BIND_ADDRESS) {
    throw new Error("Private HTTPS ingress must bind to the configured host address.");
  }

  assertNoPrivilegedOrHostNetwork("crm-app", app);
  assertNoPrivilegedOrHostNetwork("crm-postgres", postgres);
  assertNoPrivilegedOrHostNetwork("crm-private-ingress", ingress);
  assertNoDockerSocket("crm-app", app);
  assertNoDockerSocket("crm-postgres", postgres);
  assertNoDockerSocket("crm-private-ingress", ingress);

  return { app, postgres, ingress, ingressPort };
}

function printSuccess(summary: Record<string, unknown>) {
  console.log(JSON.stringify(summary, null, 2));
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.envFile) {
    throw new Error(usage());
  }

  const envFilePath = path.resolve(parsed.envFile);
  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Private HTTPS env file not found: ${envFilePath}`);
  }

  const expectedSourceSha = parsed.expectedSourceSha
    || process.env.EXPECTED_SOURCE_SHA
    || process.env.CRM_EXPECTED_SOURCE_SHA
    || "";

  if (!expectedSourceSha) {
    throw new Error("An explicit expected source SHA is required via --expected-source-sha or EXPECTED_SOURCE_SHA.");
  }

  const validatedExpectedSourceSha = validateFullCommitSha(expectedSourceSha, "Expected source SHA");
  const { env, rawEnv } = loadPrivateHttpsEnv(envFilePath);
  const composeResult = runComposeConfig(envFilePath, {
    ...asRecord(rawEnv),
    CRM_PRIVATE_APP_IMAGE: env.CRM_PRIVATE_APP_IMAGE
  });

  if (composeResult.status !== 0) {
    throw new Error(`docker compose config failed: ${(composeResult.stderr ?? composeResult.stdout ?? "").trim()}`);
  }

  let composeConfig: ComposeConfig;
  try {
    composeConfig = JSON.parse(String(composeResult.stdout ?? "")) as ComposeConfig;
  } catch (error) {
    throw new Error(`Failed to parse docker compose config JSON: ${(error as Error).message}`);
  }

  const topology = validateComposeModel(composeConfig, env);
  const labels = inspectImageLabels(env.CRM_PRIVATE_APP_IMAGE);
  const sourceSha = validateFullCommitSha(String(labels["io.clariobase.source-sha"] ?? ""), "io.clariobase.source-sha");
  const imageVariant = String(labels["io.clariobase.image-variant"] ?? "");

  if (sourceSha !== validatedExpectedSourceSha) {
    throw new Error("io.clariobase.source-sha must equal the explicit expected source SHA.");
  }

  if (imageVariant !== "validated") {
    throw new Error("io.clariobase.image-variant must equal validated.");
  }

  printSuccess({
    result: "PASS",
    envFile: envFilePath,
    bindAddress: env.CRM_PRIVATE_BIND_ADDRESS,
    bindAddressMode: classifyBindAddress(env.CRM_PRIVATE_BIND_ADDRESS),
    privateHostname: env.CRM_PRIVATE_HOSTNAME,
    privateHttpsPort: env.CRM_PRIVATE_HTTPS_PORT,
    sourceSha,
    imageVariant,
    appImage: env.CRM_PRIVATE_APP_IMAGE,
    ingressImage: String(topology.ingress.image ?? ""),
    postgresImage: String(topology.postgres.image ?? ""),
    compose: {
      appPorts: topology.app.ports?.length ?? 0,
      postgresPorts: topology.postgres.ports?.length ?? 0,
      ingressPort: {
        published: topology.ingressPort.published,
        target: topology.ingressPort.target
      }
    }
  });
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
