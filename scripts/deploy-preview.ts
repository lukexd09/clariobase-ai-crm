import fs from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import {
  assertRequestedRef,
  buildComposeArgs,
  buildDeployPlan,
  createPreviewSummary,
  executeDeployPlanWithEnv,
  getHeadSha,
  loadPreviewEnv,
  PREVIEW_NETWORK_NAME,
  PREVIEW_VOLUME_NAME,
  parsePreviewDatabaseLifecycleMode,
  validateFullCommitSha,
  validatePreviewComposeModel,
  validateResolvedSha,
  validateResetConfirmation
} from "./preview-runtime-support";

type Options = {
  dryRun: boolean;
  controlCheckoutPath: string | undefined;
  sourceCheckoutPath: string | undefined;
  sourceMode: "open_pr" | "main" | "unknown";
  previewEnvFile: string | undefined;
  requestedRef: string;
  resolvedSha: string | undefined;
  databaseMode: string;
  resetConfirmation: string;
  timeoutSeconds: number;
};

type ReadyPayload = {
  checks?: {
    database?: string;
    authentication?: string;
  };
};

function parseArgs(argv: string[]): Options {
  const parsed: Options = {
    dryRun: false,
    controlCheckoutPath: undefined,
    sourceCheckoutPath: undefined,
    sourceMode: "unknown",
    previewEnvFile: undefined,
    requestedRef: "",
    resolvedSha: undefined,
    databaseMode: "preserve",
    resetConfirmation: "",
    timeoutSeconds: 180
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (token === "--preview-env-file") {
      parsed.previewEnvFile = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--control-checkout-path") {
      parsed.controlCheckoutPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--source-checkout-path") {
      parsed.sourceCheckoutPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--source-mode") {
      parsed.sourceMode = (argv[index + 1] as Options["sourceMode"]) ?? "unknown";
      index += 1;
      continue;
    }

    if (token === "--requested-ref") {
      parsed.requestedRef = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--resolved-sha") {
      parsed.resolvedSha = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--database-mode") {
      parsed.databaseMode = argv[index + 1] ?? "preserve";
      index += 1;
      continue;
    }

    if (token === "--reset-confirmation") {
      parsed.resetConfirmation = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--timeout-seconds") {
      parsed.timeoutSeconds = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (!Number.isFinite(parsed.timeoutSeconds) || parsed.timeoutSeconds <= 0) {
    throw new Error(`Timeout seconds must be a positive number, got: ${parsed.timeoutSeconds}`);
  }

  if (!["open_pr", "main", "unknown"].includes(parsed.sourceMode)) {
    throw new Error("Source mode must be one of: open_pr, main, unknown");
  }

  return parsed;
}

function runDockerCompose(args: string[], env: Record<string, string>) {
  return spawnSync("docker", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
    env: {
      ...process.env,
      ...env
    }
  });
}

function readHttpsJson(options: { connectHost: string; servername: string; port: number; ca: Buffer }) {
  const target = new URL(`https://${options.servername}:${options.port}/api/ready`);

  return new Promise<{ status: number; payload: ReadyPayload }>((resolve, reject) => {
    const request = https.request(
      {
        hostname: options.connectHost,
        port: options.port,
        path: target.pathname + target.search,
        method: "GET",
        servername: options.servername,
        ca: options.ca,
        rejectUnauthorized: true,
        headers: {
          host: `${options.servername}:${options.port}`,
          "Cache-Control": "no-store"
        }
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          try {
            resolve({
              status: response.statusCode ?? 0,
              payload: body ? (JSON.parse(body) as ReadyPayload) : {}
            });
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", reject);
    request.end();
  });
}

async function waitForPrivateHttpsReady(
  previewUrl: string,
  previewEnvFilePath: string,
  previewImageRef: string,
  timeoutSeconds: number
) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  const caRootDir = fs.mkdtempSync(path.join(os.tmpdir(), "clariobase-preview-ca-"));
  const caPath = path.join(caRootDir, "root.crt");
  const target = new URL(previewUrl);

  try {
    while (Date.now() < deadline) {
      const copyResult = runDockerCompose(
        buildComposeArgs(previewEnvFilePath, [
          "cp",
          "crm-private-ingress:/data/caddy/pki/authorities/local/root.crt",
          caPath
        ]),
        {
          CRM_PREVIEW_IMAGE_REF: previewImageRef
        }
      );

      if (copyResult.status !== 0 || !fs.existsSync(caPath)) {
        await delay(1000);
        continue;
      }

      try {
        const ca = fs.readFileSync(caPath);
        const response = await readHttpsJson({
          connectHost: "127.0.0.1",
          servername: target.hostname,
          port: Number(target.port || "443"),
          ca
        });
        if (response.status === 200) {
          const database = response.payload.checks?.database;
          const authentication = response.payload.checks?.authentication;
          if (database === "ok" && authentication === "ok") {
            return;
          }
        }
      } catch {
        // Retry until timeout.
      }

      await delay(1000);
    }

    throw new Error(`${previewUrl} did not reach HTTPS readiness within ${timeoutSeconds} seconds.`);
  } finally {
    fs.rmSync(caRootDir, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  assertRequestedRef(options.requestedRef);
  const databaseMode = parsePreviewDatabaseLifecycleMode(options.databaseMode);
  validateResetConfirmation(databaseMode, options.resetConfirmation);

  const runtimeConfig = loadPreviewEnv(options.previewEnvFile);
  const controlCheckoutPath = options.controlCheckoutPath ? path.resolve(options.controlCheckoutPath) : path.dirname(runtimeConfig.previewEnvFilePath);
  const controlHeadSha = getHeadSha(controlCheckoutPath);
  const explicitSourceCheckoutPath = options.sourceCheckoutPath ? path.resolve(options.sourceCheckoutPath) : undefined;
  const sourceHeadSha = explicitSourceCheckoutPath ? getHeadSha(explicitSourceCheckoutPath) : undefined;
  let resolvedSha: string;

  if (sourceHeadSha) {
    resolvedSha = validateResolvedSha(sourceHeadSha, options.resolvedSha);
  } else if (options.resolvedSha) {
    resolvedSha = validateFullCommitSha(options.resolvedSha, "Resolved SHA");
  } else {
    resolvedSha = validateFullCommitSha(controlHeadSha, "Control checkout HEAD");
  }

  const deployPlan = buildDeployPlan(runtimeConfig.previewEnvFilePath, runtimeConfig.previewImageRef, databaseMode);
  const summary = {
    ...createPreviewSummary(options.requestedRef, resolvedSha, options.sourceMode, runtimeConfig.previewUrl),
    databaseMode
  };

  fs.mkdirSync(runtimeConfig.previewAiExchangeAbsolutePath, { recursive: true });

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          summary,
          previewEnvFilePath: runtimeConfig.previewEnvFilePath,
          previewAiExchangePath: runtimeConfig.previewAiExchangeAbsolutePath,
          previewImageRef: runtimeConfig.previewImageRef,
          controlCheckoutPath,
          controlHeadSha,
          sourceCheckoutPath: explicitSourceCheckoutPath,
          sourceHeadSha,
          sourceCheckoutProvided: Boolean(explicitSourceCheckoutPath),
          sourceMode: options.sourceMode,
          resolvedSha,
          previewVolumeName: PREVIEW_VOLUME_NAME,
          previewNetworkName: PREVIEW_NETWORK_NAME,
          databaseMode,
          deployPlan
        },
        null,
        2
      )
    );
    return;
  }

  const validationResult = runDockerCompose(deployPlan.validateComposeModel, {
    CRM_PREVIEW_IMAGE_REF: runtimeConfig.previewImageRef
  });

  if (validationResult.status !== 0) {
    throw new Error(`Preview compose model validation failed: ${(validationResult.stderr ?? validationResult.stdout ?? "").trim()}`);
  }

  validatePreviewComposeModel(validationResult.stdout, runtimeConfig.previewImageRef);

  executeDeployPlanWithEnv(deployPlan, {
    CRM_PREVIEW_IMAGE_REF: runtimeConfig.previewImageRef
  });

  await waitForPrivateHttpsReady(runtimeConfig.previewUrl, runtimeConfig.previewEnvFilePath, runtimeConfig.previewImageRef, options.timeoutSeconds);

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        ...summary,
        databaseVolume: deployPlan.databaseVolumeAction
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
