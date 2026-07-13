import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";

import { PROTECTED_DOCKER_PROJECT } from "./docker-test-support";

export const PREVIEW_PROJECT_NAME = "clariobase-crm-preview";
export const PREVIEW_HOST_PORT = "3001";
export const PREVIEW_DB_NAME = "clariobase_crm_preview";
export const PREVIEW_DB_USER = "clariobase_crm_preview_user";
export const PREVIEW_URL = "http://Serwer:3001";
export const PREVIEW_VOLUME_NAME = "clariobase-crm-preview-postgres-data";
export const PREVIEW_NETWORK_NAME = "clariobase-crm-preview-network";
export const PROTECTED_ENV_FILE_NAME = ".env.compose.local";
export const PREVIEW_ENV_FILE_NAME = ".env.compose.preview.local";
export const PREVIEW_ENV_EXAMPLE_FILE = ".env.compose.preview.example";
export const PREVIEW_STOP_ENV_EXAMPLE_FILE = ".env.compose.preview.stop.example";
export const PROTECTED_AI_EXCHANGE_PATH = "./data/ai-exchange";
export const PREVIEW_AI_EXCHANGE_PATH = "./data/ai-exchange-preview";
export const PREVIEW_DATABASE_URL = "postgresql://clariobase_crm_preview_user:preview-password@crm-postgres:5432/clariobase_crm_preview?schema=public";
export const PREVIEW_DATABASE_LIFECYCLE_MODES = ["preserve", "reset"] as const;
export type PreviewDatabaseLifecycleMode = (typeof PREVIEW_DATABASE_LIFECYCLE_MODES)[number];

const repoRoot = path.resolve(__dirname, "..");
const defaultPreviewEnvFilePath = path.join(repoRoot, PREVIEW_ENV_FILE_NAME);
const protectedEnvFilePath = path.join(repoRoot, PROTECTED_ENV_FILE_NAME);
const protectedAiExchangeAbsolutePath = path.resolve(repoRoot, PROTECTED_AI_EXCHANGE_PATH);

export type PreviewEnv = {
  CRM_BIND_ADDRESS: string;
  CRM_HOST_PORT: string;
  AI_EXCHANGE_HOST_PATH: string;
  CRM_POSTGRES_DB: string;
  CRM_POSTGRES_USER: string;
  CRM_POSTGRES_PASSWORD: string;
  CRM_DATABASE_URL: string;
};

export type PreviewRuntimeConfig = {
  previewEnvFilePath: string;
  previewAiExchangeAbsolutePath: string;
  previewLocalReadyUrl: string;
  previewUrl: string;
  previewImageRef: string;
  env: PreviewEnv;
};

export type PreviewSummary = {
  sourceMode: "open_pr" | "main" | "unknown";
  requestedRef: string;
  resolvedSha: string;
  databaseMode: PreviewDatabaseLifecycleMode;
  previewUrl: string;
  projectName: string;
  volumeName: string;
  networkName: string;
};

export type PreviewLifecycleDecision = {
  mode: PreviewDatabaseLifecycleMode;
  removeVolume: boolean;
};

export function getRepoRoot() {
  return repoRoot;
}

export function getDefaultPreviewEnvFilePath() {
  return defaultPreviewEnvFilePath;
}

export function readText(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

export function parseEnvFileContent(content: string) {
  const env = new Map<string, string>();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      throw new Error(`Invalid env line without '=' separator: ${line}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    env.set(key, value);
  }

  return env;
}

function normalizeComparablePath(targetPath: string) {
  return path.resolve(targetPath).replace(/\\/g, "/").toLowerCase();
}

function assertNonEmpty(value: string, fieldName: keyof PreviewEnv) {
  if (!value.trim()) {
    throw new Error(`Preview env field ${fieldName} must be non-empty.`);
  }
}

function assertDistinctComparablePath(targetPath: string, protectedPath: string, context: string) {
  if (normalizeComparablePath(targetPath) === normalizeComparablePath(protectedPath)) {
    throw new Error(`${context} must not target the protected production path ${protectedPath}.`);
  }
}

function assertPreviewDatabaseUrl(databaseUrl: string) {
  if (!databaseUrl) {
    return;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("CRM_DATABASE_URL must be a valid postgresql URL.");
  }

  if (parsedUrl.protocol !== "postgresql:") {
    throw new Error("CRM_DATABASE_URL must use the postgresql protocol.");
  }

  if (parsedUrl.hostname !== "crm-postgres") {
    throw new Error("CRM_DATABASE_URL must target the preview host crm-postgres.");
  }

  if (parsedUrl.port !== "5432") {
    throw new Error("CRM_DATABASE_URL must target port 5432.");
  }

  if (parsedUrl.username !== PREVIEW_DB_USER) {
    throw new Error(`CRM_DATABASE_URL must use the preview user ${PREVIEW_DB_USER}.`);
  }

  if (!parsedUrl.password) {
    throw new Error("CRM_DATABASE_URL must include an encoded preview password.");
  }

  const databaseName = parsedUrl.pathname.replace(/^\//, "");

  if (databaseName !== PREVIEW_DB_NAME) {
    throw new Error(`CRM_DATABASE_URL must target the preview database ${PREVIEW_DB_NAME}.`);
  }
}

export function parsePreviewDatabaseLifecycleMode(value: string | undefined | null): PreviewDatabaseLifecycleMode {
  if (value === "preserve" || value === "reset") {
    return value;
  }

  throw new Error(`database_mode must be one of: ${PREVIEW_DATABASE_LIFECYCLE_MODES.join(", ")}`);
}

export function validateResetConfirmation(mode: PreviewDatabaseLifecycleMode, confirmation: string | undefined | null) {
  if (mode === "preserve") {
    return;
  }

  if (confirmation !== "RESET PREVIEW DATABASE") {
    throw new Error("reset_confirmation must exactly equal RESET PREVIEW DATABASE when database_mode=reset.");
  }
}

export function resolvePreviewDatabaseLifecycle(mode: PreviewDatabaseLifecycleMode): PreviewLifecycleDecision {
  return {
    mode,
    removeVolume: mode === "reset"
  };
}

export function loadPreviewEnv(previewEnvFilePath = defaultPreviewEnvFilePath): PreviewRuntimeConfig {
  if (!fs.existsSync(previewEnvFilePath)) {
    throw new Error(`Preview env file not found: ${previewEnvFilePath}`);
  }

  assertDistinctComparablePath(previewEnvFilePath, protectedEnvFilePath, "Preview env file");

  const parsedEnv = parseEnvFileContent(readText(previewEnvFilePath));
  const env: PreviewEnv = {
    CRM_BIND_ADDRESS: parsedEnv.get("CRM_BIND_ADDRESS") ?? "",
    CRM_HOST_PORT: parsedEnv.get("CRM_HOST_PORT") ?? "",
    AI_EXCHANGE_HOST_PATH: parsedEnv.get("AI_EXCHANGE_HOST_PATH") ?? "",
    CRM_POSTGRES_DB: parsedEnv.get("CRM_POSTGRES_DB") ?? "",
    CRM_POSTGRES_USER: parsedEnv.get("CRM_POSTGRES_USER") ?? "",
    CRM_POSTGRES_PASSWORD: parsedEnv.get("CRM_POSTGRES_PASSWORD") ?? "",
    CRM_DATABASE_URL: parsedEnv.get("CRM_DATABASE_URL") ?? ""
  };

  assertNonEmpty(env.CRM_BIND_ADDRESS, "CRM_BIND_ADDRESS");
  assertNonEmpty(env.CRM_HOST_PORT, "CRM_HOST_PORT");
  assertNonEmpty(env.AI_EXCHANGE_HOST_PATH, "AI_EXCHANGE_HOST_PATH");
  assertNonEmpty(env.CRM_POSTGRES_DB, "CRM_POSTGRES_DB");
  assertNonEmpty(env.CRM_POSTGRES_USER, "CRM_POSTGRES_USER");
  assertNonEmpty(env.CRM_POSTGRES_PASSWORD, "CRM_POSTGRES_PASSWORD");

  assert.equal(
    env.CRM_HOST_PORT,
    PREVIEW_HOST_PORT,
    `Preview host port must stay pinned to ${PREVIEW_HOST_PORT}.`
  );
  assert.equal(env.CRM_POSTGRES_DB, PREVIEW_DB_NAME, `Preview database must stay pinned to ${PREVIEW_DB_NAME}.`);
  assert.equal(env.CRM_POSTGRES_USER, PREVIEW_DB_USER, `Preview PostgreSQL user must stay pinned to ${PREVIEW_DB_USER}.`);

  if (env.CRM_BIND_ADDRESS !== "0.0.0.0") {
    throw new Error("Preview bind address must stay pinned to 0.0.0.0 for the approved LAN preview contract.");
  }

  if (env.AI_EXCHANGE_HOST_PATH !== PREVIEW_AI_EXCHANGE_PATH) {
    throw new Error(`Preview AI exchange path must stay pinned to ${PREVIEW_AI_EXCHANGE_PATH}.`);
  }

  const previewImageRef = process.env.CRM_PREVIEW_IMAGE_REF ?? "";

  if (!previewImageRef.trim()) {
    throw new Error("CRM_PREVIEW_IMAGE_REF must be provided for immutable preview deployments.");
  }

  if (!/^ghcr\.io\/lukexd09\/clariobase-ai-crm@sha256:[0-9a-f]{64}$/.test(previewImageRef)) {
    throw new Error(
      "CRM_PREVIEW_IMAGE_REF must match ghcr.io/lukexd09/clariobase-ai-crm@sha256:<64 lowercase hex characters>."
    );
  }

  const previewAiExchangeAbsolutePath = path.resolve(repoRoot, env.AI_EXCHANGE_HOST_PATH);

  assertDistinctComparablePath(
    previewAiExchangeAbsolutePath,
    protectedAiExchangeAbsolutePath,
    "Preview AI exchange path"
  );
  assertPreviewDatabaseUrl(env.CRM_DATABASE_URL);

  return {
    previewEnvFilePath: path.resolve(previewEnvFilePath),
    previewAiExchangeAbsolutePath,
    previewLocalReadyUrl: `http://127.0.0.1:${PREVIEW_HOST_PORT}/api/ready`,
    previewUrl: PREVIEW_URL,
    previewImageRef,
    env
  };
}

export function validateResolvedSha(currentHeadSha: string, expectedResolvedSha?: string) {
  if (!expectedResolvedSha) {
    return validateFullCommitSha(currentHeadSha, "Current HEAD");
  }

  const validatedCurrentHeadSha = validateFullCommitSha(currentHeadSha, "Current HEAD");
  const validatedExpectedResolvedSha = validateFullCommitSha(expectedResolvedSha, "Resolved SHA");

  if (validatedCurrentHeadSha.toLowerCase() !== validatedExpectedResolvedSha.toLowerCase()) {
    throw new Error(
      `Current checkout SHA ${validatedCurrentHeadSha} does not match the expected resolved SHA ${validatedExpectedResolvedSha}.`
    );
  }

  return validatedExpectedResolvedSha;
}

export function validateFullCommitSha(value: string, label: string) {
  if (!/^[0-9a-f]{40}$/i.test(value)) {
    throw new Error(`${label} must be a full 40-character Git commit SHA: ${value}`);
  }

  return value.toLowerCase();
}

export function assertRequestedRef(requestedRef: string) {
  if (!requestedRef.trim()) {
    throw new Error("Requested ref must be provided.");
  }

  if (/^\.\.?$/.test(requestedRef) || /[\s~^:?*\[]/.test(requestedRef)) {
    throw new Error(`Requested ref contains disallowed characters: ${requestedRef}`);
  }
}

export function buildComposeArgs(previewEnvFilePath: string, composeArgs: string[]) {
  return [
    "compose",
    "--project-name",
    PREVIEW_PROJECT_NAME,
    "--env-file",
    previewEnvFilePath,
    "-f",
    "compose.yaml",
    "-f",
    "compose.preview.yaml",
    ...composeArgs
  ];
}

export function buildDeployPlan(previewEnvFilePath: string, previewImageRef: string, lifecycleMode: PreviewDatabaseLifecycleMode = "preserve") {
  const lifecycle = resolvePreviewDatabaseLifecycle(lifecycleMode);
  const pullExactImage = ["pull", previewImageRef];
  return {
    validateComposeModel: buildComposeArgs(previewEnvFilePath, ["config", "--format", "json"]),
    pullExactImage,
    replaceExistingPreview: buildComposeArgs(previewEnvFilePath, lifecycle.removeVolume ? ["down", "-v", "--remove-orphans"] : ["down", "--remove-orphans"]),
    startDatabase: buildComposeArgs(previewEnvFilePath, ["up", "-d", "crm-postgres"]),
    migrate: buildComposeArgs(previewEnvFilePath, [
      "run",
      "--rm",
      "--pull",
      "never",
      "crm-app",
      "sh",
      "-lc",
      "node ./node_modules/prisma/build/index.js migrate deploy"
    ]),
    startApplication: buildComposeArgs(previewEnvFilePath, ["up", "-d", "--no-build", "--pull", "never", "crm-app"]),
    databaseLifecycleMode: lifecycle.mode,
    databaseVolumeAction: lifecycle.removeVolume ? "reset" : "preserve"
  };
}

export function buildStopPlan(previewEnvFilePath: string, lifecycleMode: PreviewDatabaseLifecycleMode = "preserve") {
  const lifecycle = resolvePreviewDatabaseLifecycle(lifecycleMode);
  return {
    down: buildComposeArgs(previewEnvFilePath, lifecycle.removeVolume ? ["down", "-v", "--remove-orphans"] : ["down", "--remove-orphans"]),
    databaseLifecycleMode: lifecycle.mode,
    databaseVolumeAction: lifecycle.removeVolume ? "reset" : "preserve"
  };
}

export function createPreviewSummary(
  requestedRef: string,
  resolvedSha: string,
  sourceMode: "open_pr" | "main" | "unknown" = "unknown"
): PreviewSummary {
  return {
    sourceMode,
    requestedRef,
    resolvedSha,
    databaseMode: "preserve",
    previewUrl: PREVIEW_URL,
    projectName: PREVIEW_PROJECT_NAME,
    volumeName: PREVIEW_VOLUME_NAME,
    networkName: PREVIEW_NETWORK_NAME
  };
}

export function validatePreviewComposeModel(configJson: string, expectedImageRef: string) {
  type PreviewComposeService = { image?: unknown; build?: unknown; pull_policy?: unknown };
  type PreviewComposeConfig = {
    services?: Record<string, PreviewComposeService>;
  };

  let parsed: PreviewComposeConfig;

  try {
    parsed = JSON.parse(configJson) as PreviewComposeConfig;
  } catch (error) {
    throw new Error(`Failed to parse preview compose model as JSON: ${(error as Error).message}`);
  }

  const services = parsed.services;
  const app: PreviewComposeService | undefined = services?.["crm-app"];

  if (!app) {
    throw new Error("Preview compose model must define crm-app.");
  }

  if (app.image !== expectedImageRef) {
    throw new Error(`Preview compose model image must match ${expectedImageRef}.`);
  }

  if (Object.prototype.hasOwnProperty.call(app, "build")) {
    throw new Error("Preview compose model must not include crm-app.build.");
  }

  if (app.pull_policy !== "never") {
    throw new Error("Preview compose model must set crm-app.pull_policy to never.");
  }
}

export function runCommand(command: string, args: string[]) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });
}

export function runCommandWithEnv(command: string, args: string[], extraEnv: Record<string, string>) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    env: {
      ...process.env,
      ...extraEnv
    }
  });
}

export function runCommandWithMergedEnv(
  command: string,
  args: string[],
  extraEnv: Record<string, string>,
  cwd = repoRoot
) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    env: {
      ...process.env,
      ...extraEnv
    }
  });
}

export function getCurrentHeadSha() {
  const result = runCommand("git", ["rev-parse", "HEAD"]);

  if (result.status !== 0) {
    throw new Error(`Could not resolve current HEAD SHA: ${(result.stderr ?? result.stdout ?? "").trim()}`);
  }

  return result.stdout.trim();
}

export function getHeadSha(checkoutPath: string) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: path.resolve(checkoutPath),
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.status !== 0) {
    throw new Error(`Could not resolve HEAD SHA for ${checkoutPath}: ${(result.stderr ?? result.stdout ?? "").trim()}`);
  }

  return result.stdout.trim();
}

export function assertSuccessfulCommand(
  result: SpawnSyncReturns<string>,
  description: string
) {
  assert.equal(result.status, 0, `${description} should pass: ${(result.stderr ?? result.stdout ?? "").trim()}`);
}

export function executeDeployPlanWithEnv(
  deployPlan: ReturnType<typeof buildDeployPlan>,
  extraEnv: Record<string, string>,
  runner: (command: string, args: string[], env: Record<string, string>) => SpawnSyncReturns<string> = (
    command,
    args,
    env
  ) => runCommandWithMergedEnv(command, args, env)
) {
  const steps = [
    ["validate preview compose model", deployPlan.validateComposeModel],
    ["docker pull exact immutable preview image", deployPlan.pullExactImage],
    ["replace existing preview stack", deployPlan.replaceExistingPreview],
    ["docker compose up -d crm-postgres", deployPlan.startDatabase],
    ["preview prisma migrate deploy", deployPlan.migrate],
    ["docker compose up -d crm-app", deployPlan.startApplication]
  ] as const;

  for (const [description, args] of steps) {
    const result = runner("docker", [...args], extraEnv);
    assertSuccessfulCommand(result, description);
  }
}
