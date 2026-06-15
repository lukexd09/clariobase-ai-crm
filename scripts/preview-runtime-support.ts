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
export const PROTECTED_AI_EXCHANGE_PATH = "./data/ai-exchange";
export const PREVIEW_AI_EXCHANGE_PATH = "./data/ai-exchange-preview";
export const PREVIEW_DATABASE_URL = "postgresql://clariobase_crm_preview_user:preview-password@crm-postgres:5432/clariobase_crm_preview?schema=public";

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
  buildContextPath: string;
  env: PreviewEnv;
};

export type PreviewSummary = {
  requestedRef: string;
  resolvedSha: string;
  previewUrl: string;
  projectName: string;
  volumeName: string;
  networkName: string;
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
    buildContextPath: path.resolve(process.env.CRM_BUILD_CONTEXT ?? repoRoot),
    env
  };
}

export function validateResolvedSha(currentHeadSha: string, expectedResolvedSha?: string) {
  if (!/^[0-9a-f]{40}$/i.test(currentHeadSha)) {
    throw new Error(`Current HEAD is not a full Git commit SHA: ${currentHeadSha}`);
  }

  if (!expectedResolvedSha) {
    return currentHeadSha;
  }

  if (!/^[0-9a-f]{40}$/i.test(expectedResolvedSha)) {
    throw new Error(`Resolved SHA must be a full 40-character commit SHA: ${expectedResolvedSha}`);
  }

  if (currentHeadSha.toLowerCase() !== expectedResolvedSha.toLowerCase()) {
    throw new Error(
      `Current checkout SHA ${currentHeadSha} does not match the expected resolved SHA ${expectedResolvedSha}.`
    );
  }

  return currentHeadSha;
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

export function buildDeployPlan(previewEnvFilePath: string) {
  return {
    buildApp: buildComposeArgs(previewEnvFilePath, ["build", "crm-app"]),
    startDatabase: buildComposeArgs(previewEnvFilePath, ["up", "-d", "crm-postgres"]),
    migrate: buildComposeArgs(previewEnvFilePath, [
      "run",
      "--rm",
      "crm-app",
      "sh",
      "-lc",
      "node ./node_modules/prisma/build/index.js migrate deploy"
    ]),
    startApplication: buildComposeArgs(previewEnvFilePath, ["up", "-d", "crm-app"])
  };
}

export function buildStopPlan(previewEnvFilePath: string) {
  return {
    down: buildComposeArgs(previewEnvFilePath, ["down", "-v", "--remove-orphans"])
  };
}

export function createPreviewSummary(requestedRef: string, resolvedSha: string): PreviewSummary {
  return {
    requestedRef,
    resolvedSha,
    previewUrl: PREVIEW_URL,
    projectName: PREVIEW_PROJECT_NAME,
    volumeName: PREVIEW_VOLUME_NAME,
    networkName: PREVIEW_NETWORK_NAME
  };
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

export function getCurrentHeadSha() {
  const result = runCommand("git", ["rev-parse", "HEAD"]);

  if (result.status !== 0) {
    throw new Error(`Could not resolve current HEAD SHA: ${(result.stderr ?? result.stdout ?? "").trim()}`);
  }

  return result.stdout.trim();
}

export function assertSuccessfulCommand(
  result: SpawnSyncReturns<string>,
  description: string
) {
  assert.equal(result.status, 0, `${description} should pass: ${(result.stderr ?? result.stdout ?? "").trim()}`);
}
