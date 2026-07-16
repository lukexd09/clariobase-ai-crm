import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseAuthRuntimeConfig } from "@/lib/auth-runtime-config";

import { parseEnvFileContent, readText, validateFullCommitSha } from "./preview-runtime-support";

export type PrivateHttpsEnv = {
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

export type ComposePort = {
  published?: string | number;
  target?: number;
  host_ip?: string;
  protocol?: string;
};

export type ComposeService = {
  image?: unknown;
  build?: unknown;
  pull_policy?: unknown;
  ports?: ComposePort[];
  privileged?: unknown;
  network_mode?: unknown;
  volumes?: unknown[];
};

export type ComposeConfig = {
  services?: Record<string, ComposeService>;
};

export type PrivateHttpsImageLabels = {
  sourceSha: string;
  imageVariant: string;
};

export type PrivateHttpsComposeTopology = {
  app: ComposeService;
  postgres: ComposeService;
  ingress: ComposeService;
  ingressPort: ComposePort;
};

export type PrivateHttpsPreflightSummary = {
  previewOrigin: string;
  bindAddress: string;
  bindAddressMode: "loopback" | "rfc1918";
  privateHostname: string;
  privateHttpsPort: string;
  sourceSha: string;
  imageVariant: string;
  appImage: string;
  ingressImage: string;
  postgresImage: string;
  compose: {
    appPorts: number;
    postgresPorts: number;
    ingressPort: {
      published?: string | number;
      target?: number;
    };
  };
};

export type PrivateHttpsPreflightDeps = {
  runComposeConfig: (envFilePath: string, env: Record<string, string>) => SpawnSyncReturns<string>;
  inspectImageLabels: (imageRef: string) => Record<string, string>;
  logger?: (message: string) => void;
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
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    return false;
  }
  if (a === 10) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  return a === 172 && b >= 16 && b <= 31;
}

export function classifyBindAddress(address: string) {
  const normalized = address.trim();
  if (!normalized || normalized !== address) {
    throw new Error("CRM_PRIVATE_BIND_ADDRESS must be a trimmed explicit address.");
  }

  if (normalized === "0.0.0.0" || normalized === "::") {
    throw new Error("CRM_PRIVATE_BIND_ADDRESS must not use a wildcard bind address.");
  }

  const kind = net.isIP(normalized);
  if (kind === 4) {
    if (normalized.startsWith("127.")) {
      return "loopback" as const;
    }

    if (isRfc1918Ipv4(normalized)) {
      return "rfc1918" as const;
    }

    throw new Error("CRM_PRIVATE_BIND_ADDRESS must be an explicit loopback or RFC1918 IPv4 address.");
  }

  if (kind === 6) {
    if (normalized === "::1") {
      return "loopback" as const;
    }

    throw new Error("CRM_PRIVATE_BIND_ADDRESS must be an explicit loopback or RFC1918 IPv4 address.");
  }

  throw new Error("CRM_PRIVATE_BIND_ADDRESS must be a valid loopback or RFC1918 IP address.");
}

export function assertImmutableImageReference(imageRef: string, fieldName: string) {
  if (!immutableImageReferencePattern.test(imageRef)) {
    throw new Error(`${fieldName} must use an immutable image reference or full image ID.`);
  }
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

function validateDockerSocket(serviceName: string, service: ComposeService | undefined) {
  const volumeString = JSON.stringify(service?.volumes ?? []);
  if (/docker\.sock/i.test(volumeString)) {
    throw new Error(`Private HTTPS compose model must not mount the Docker socket in ${serviceName}.`);
  }
}

function validatePrivilegedAndHostNetwork(serviceName: string, service: ComposeService | undefined) {
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

export function validateComposeModel(config: ComposeConfig, env: PrivateHttpsEnv): PrivateHttpsComposeTopology {
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

  assertImmutableImageReference(String(app.image ?? ""), "CRM_PRIVATE_APP_IMAGE");
  assertImmutableImageReference(String(ingress.image ?? ""), "CRM_PRIVATE_INGRESS_IMAGE");
  assertImmutableImageReference(String(postgres.image ?? ""), "CRM_POSTGRES_IMAGE");

  if (String(app.image ?? "") !== env.CRM_PRIVATE_APP_IMAGE) {
    throw new Error("CRM_PRIVATE_APP_IMAGE must match the application image in the compose model.");
  }

  if (String(ingress.image ?? "") !== env.CRM_PRIVATE_INGRESS_IMAGE) {
    throw new Error("CRM_PRIVATE_INGRESS_IMAGE must match the ingress image in the compose model.");
  }

  if (String(postgres.image ?? "") !== env.CRM_POSTGRES_IMAGE) {
    throw new Error("CRM_POSTGRES_IMAGE must match the PostgreSQL image in the compose model.");
  }

  if ((app.ports ?? []).length !== 0) {
    throw new Error("Private HTTPS compose model must not publish any host ports for crm-app.");
  }

  if ((postgres.ports ?? []).length !== 0) {
    throw new Error("Private HTTPS compose model must not publish any host ports for crm-postgres.");
  }

  const ingressPorts = ingress.ports ?? [];
  if (ingressPorts.length === 0) {
    throw new Error("Private HTTPS compose model must define a published ingress port.");
  }

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

  validatePrivilegedAndHostNetwork("crm-app", app);
  validatePrivilegedAndHostNetwork("crm-postgres", postgres);
  validatePrivilegedAndHostNetwork("crm-private-ingress", ingress);
  validateDockerSocket("crm-app", app);
  validateDockerSocket("crm-postgres", postgres);
  validateDockerSocket("crm-private-ingress", ingress);

  return {
    app,
    postgres,
    ingress,
    ingressPort
  };
}

export function validateImageLabels(labels: Record<string, string>, expectedSourceSha: string): PrivateHttpsImageLabels {
  const sourceShaLabel = labels["io.clariobase.source-sha"] ?? "";
  if (!sourceShaLabel.trim()) {
    throw new Error("io.clariobase.source-sha label must be present.");
  }

  const sourceSha = validateFullCommitSha(sourceShaLabel, "io.clariobase.source-sha");
  if (sourceSha !== expectedSourceSha) {
    throw new Error("io.clariobase.source-sha must equal the explicit expected source SHA.");
  }

  const imageVariant = labels["io.clariobase.image-variant"] ?? "";
  if (!imageVariant.trim()) {
    throw new Error("io.clariobase.image-variant label must be present.");
  }

  if (imageVariant !== "validated") {
    throw new Error("io.clariobase.image-variant must equal validated.");
  }

  return {
    sourceSha,
    imageVariant
  };
}

export function loadPrivateHttpsEnv(envFilePath: string) {
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
    CRM_PRIVATE_INGRESS_IMAGE: requireEnv(rawEnv, "CRM_PRIVATE_INGRESS_IMAGE"),
    CRM_POSTGRES_IMAGE: requireEnv(rawEnv, "CRM_POSTGRES_IMAGE")
  };

  assert.equal(env.CRM_AUTH_RUNTIME_MODE, "private-https", "CRM_AUTH_RUNTIME_MODE must be private-https for private HTTPS preflight.");
  classifyBindAddress(env.CRM_PRIVATE_BIND_ADDRESS);
  assertImmutableImageReference(env.CRM_PRIVATE_APP_IMAGE, "CRM_PRIVATE_APP_IMAGE");
  assertImmutableImageReference(env.CRM_PRIVATE_INGRESS_IMAGE, "CRM_PRIVATE_INGRESS_IMAGE");
  assertImmutableImageReference(env.CRM_POSTGRES_IMAGE, "CRM_POSTGRES_IMAGE");
  validateDatabaseUrl(env);
  parseAuthRuntimeConfig(env);

  return env;
}

export function runComposeConfig(envFilePath: string, env: Record<string, string>) {
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

export function inspectImageLabels(imageRef: string) {
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

export function validatePrivateHttpsPreflight(args: {
  env: PrivateHttpsEnv;
  composeConfigJson: string;
  imageLabels: Record<string, string>;
  expectedSourceSha: string;
}) {
  classifyBindAddress(args.env.CRM_PRIVATE_BIND_ADDRESS);
  validateDatabaseUrl(args.env);
  const authRuntime = parseAuthRuntimeConfig(args.env);
  const topology = validateComposeModel(JSON.parse(args.composeConfigJson) as ComposeConfig, args.env);
  const imageLabels = validateImageLabels(args.imageLabels, args.expectedSourceSha);

  return {
    previewOrigin: authRuntime.origin,
    bindAddress: args.env.CRM_PRIVATE_BIND_ADDRESS,
    bindAddressMode: classifyBindAddress(args.env.CRM_PRIVATE_BIND_ADDRESS),
    privateHostname: args.env.CRM_PRIVATE_HOSTNAME,
    privateHttpsPort: args.env.CRM_PRIVATE_HTTPS_PORT,
    sourceSha: imageLabels.sourceSha,
    imageVariant: imageLabels.imageVariant,
    appImage: args.env.CRM_PRIVATE_APP_IMAGE,
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
  } satisfies PrivateHttpsPreflightSummary;
}

function printSuccess(summary: PrivateHttpsPreflightSummary) {
  console.log(JSON.stringify({ result: "PASS", ...summary }, null, 2));
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
  const env = loadPrivateHttpsEnv(envFilePath);
  const composeResult = runComposeConfig(envFilePath, asRecord(parseEnvFileContent(readText(envFilePath))));

  if (composeResult.status !== 0) {
    throw new Error(`docker compose config failed: ${(composeResult.stderr ?? composeResult.stdout ?? "").trim()}`);
  }

  const imageLabels = inspectImageLabels(env.CRM_PRIVATE_APP_IMAGE);
  const summary = validatePrivateHttpsPreflight({
    env,
    composeConfigJson: String(composeResult.stdout ?? ""),
    imageLabels,
    expectedSourceSha: validatedExpectedSourceSha
  });

  printSuccess({
    ...summary,
    previewOrigin: summary.previewOrigin
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
