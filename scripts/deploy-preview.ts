import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import {
  assertRequestedRef,
  buildDeployPlan,
  createPreviewSummary,
  executeDeployPlanWithEnv,
  getHeadSha,
  loadPreviewEnv,
  PREVIEW_NETWORK_NAME,
  PREVIEW_VOLUME_NAME,
  validatePreviewComposeModel,
  validateFullCommitSha,
  validateResolvedSha
} from "./preview-runtime-support";

type Options = {
  dryRun: boolean;
  controlCheckoutPath: string | undefined;
  sourceCheckoutPath: string | undefined;
  previewEnvFile: string | undefined;
  requestedRef: string;
  resolvedSha: string | undefined;
  timeoutSeconds: number;
};

function parseArgs(argv: string[]): Options {
  const parsed: Options = {
    dryRun: false,
    controlCheckoutPath: undefined,
    sourceCheckoutPath: undefined,
    previewEnvFile: undefined,
    requestedRef: "",
    resolvedSha: undefined,
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

  return parsed;
}

async function waitForHttpReady(url: string, timeoutSeconds: number) {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-store"
        }
      });

      if (response.status === 200) {
        const payload = await response.json() as {
          checks?: { database?: string };
        };

        if (payload.checks?.database === "ok") {
          return;
        }
      }
    } catch {
      // Retry until timeout.
    }

    await delay(1000);
  }

  throw new Error(`${url} did not reach HTTP 200 with database: ok within ${timeoutSeconds} seconds.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  assertRequestedRef(options.requestedRef);

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

  const deployPlan = buildDeployPlan(runtimeConfig.previewEnvFilePath);
  const summary = createPreviewSummary(options.requestedRef, resolvedSha);

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
          resolvedSha,
          previewVolumeName: PREVIEW_VOLUME_NAME,
          previewNetworkName: PREVIEW_NETWORK_NAME,
          deployPlan
        },
        null,
        2
      )
    );
    return;
  }

  const validationResult = spawnSync("docker", deployPlan.validateComposeModel, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
    env: {
      ...process.env,
      CRM_PREVIEW_IMAGE_REF: runtimeConfig.previewImageRef
    }
  });

  if (validationResult.status !== 0) {
    throw new Error(`Preview compose model validation failed: ${(validationResult.stderr ?? validationResult.stdout ?? "").trim()}`);
  }

  validatePreviewComposeModel(validationResult.stdout, runtimeConfig.previewImageRef);

  executeDeployPlanWithEnv(deployPlan, {
    CRM_PREVIEW_IMAGE_REF: runtimeConfig.previewImageRef
  });

  await waitForHttpReady(runtimeConfig.previewLocalReadyUrl, options.timeoutSeconds);

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        ...summary
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
