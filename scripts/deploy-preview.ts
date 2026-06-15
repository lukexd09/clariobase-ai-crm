import process from "node:process";
import fs from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

import {
  assertRequestedRef,
  assertSuccessfulCommand,
  buildDeployPlan,
  createPreviewSummary,
  getCurrentHeadSha,
  loadPreviewEnv,
  PREVIEW_NETWORK_NAME,
  PREVIEW_VOLUME_NAME,
  runCommand,
  validateResolvedSha
} from "./preview-runtime-support";

type Options = {
  dryRun: boolean;
  previewEnvFile: string | undefined;
  requestedRef: string;
  resolvedSha: string | undefined;
  timeoutSeconds: number;
};

function parseArgs(argv: string[]): Options {
  const parsed: Options = {
    dryRun: false,
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
  const currentHeadSha = getCurrentHeadSha();
  const resolvedSha = validateResolvedSha(currentHeadSha, options.resolvedSha);
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

  let result = runCommand("docker", deployPlan.buildApp);
  assertSuccessfulCommand(result, "docker compose build crm-app");

  result = runCommand("docker", deployPlan.startDatabase);
  assertSuccessfulCommand(result, "docker compose up -d crm-postgres");

  result = runCommand("docker", deployPlan.migrate);
  assertSuccessfulCommand(result, "preview prisma migrate deploy");

  result = runCommand("docker", deployPlan.startApplication);
  assertSuccessfulCommand(result, "docker compose up -d crm-app");

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
