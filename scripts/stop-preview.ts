import process from "node:process";

import {
  buildStopPlan,
  createPreviewSummary,
  PREVIEW_NETWORK_NAME,
  PREVIEW_VOLUME_NAME,
  assertRequestedRef,
  assertSuccessfulCommand,
  getCurrentHeadSha,
  loadPreviewEnv,
  runCommand,
  validateResolvedSha
} from "./preview-runtime-support";

type Options = {
  dryRun: boolean;
  previewEnvFile: string | undefined;
  requestedRef: string;
  resolvedSha: string | undefined;
};

function parseArgs(argv: string[]): Options {
  const parsed = {
    dryRun: false,
    previewEnvFile: undefined,
    requestedRef: "stop-preview",
    resolvedSha: undefined
  } satisfies Options;

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
      parsed.requestedRef = argv[index + 1] ?? parsed.requestedRef;
      index += 1;
      continue;
    }

    if (token === "--resolved-sha") {
      parsed.resolvedSha = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return parsed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  assertRequestedRef(options.requestedRef);

  const runtimeConfig = loadPreviewEnv(options.previewEnvFile);
  const currentHeadSha = getCurrentHeadSha();
  const resolvedSha = validateResolvedSha(currentHeadSha, options.resolvedSha);
  const stopPlan = buildStopPlan(runtimeConfig.previewEnvFilePath);
  const summary = createPreviewSummary(options.requestedRef, resolvedSha);

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          summary,
          previewEnvFilePath: runtimeConfig.previewEnvFilePath,
          previewVolumeName: PREVIEW_VOLUME_NAME,
          previewNetworkName: PREVIEW_NETWORK_NAME,
          stopPlan
        },
        null,
        2
      )
    );
    return;
  }

  const result = runCommand("docker", stopPlan.down);
  assertSuccessfulCommand(result, "docker compose down -v --remove-orphans");

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        ...summary,
        cleanupTarget: "preview-only"
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
