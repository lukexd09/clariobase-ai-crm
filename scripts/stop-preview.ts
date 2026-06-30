import process from "node:process";
import path from "node:path";

import {
  buildStopPlan,
  createPreviewSummary,
  PREVIEW_NETWORK_NAME,
  PREVIEW_VOLUME_NAME,
  assertRequestedRef,
  assertSuccessfulCommand,
  getHeadSha,
  getRepoRoot,
  runCommandWithEnv,
  parsePreviewDatabaseLifecycleMode,
  validateResetConfirmation,
  validateResolvedSha
} from "./preview-runtime-support";

type Options = {
  dryRun: boolean;
  controlCheckoutPath: string | undefined;
  requestedRef: string;
  resolvedSha: string | undefined;
  databaseMode: string;
  resetConfirmation: string;
};

function parseArgs(argv: string[]): Options {
  const parsed: Options = {
    dryRun: false,
    controlCheckoutPath: undefined,
    requestedRef: "stop-preview",
    resolvedSha: undefined,
    databaseMode: "preserve",
    resetConfirmation: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (token === "--preview-env-file") {
      // Backward-compatible no-op: stop no longer needs a secret-bearing env file.
      index += 1;
      continue;
    }

    if (token === "--control-checkout-path") {
      parsed.controlCheckoutPath = argv[index + 1];
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

    throw new Error(`Unknown argument: ${token}`);
  }

  return parsed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  assertRequestedRef(options.requestedRef);
  const databaseMode = parsePreviewDatabaseLifecycleMode(options.databaseMode);
  validateResetConfirmation(databaseMode, options.resetConfirmation);

  const controlCheckoutPath = options.controlCheckoutPath ? path.resolve(options.controlCheckoutPath) : ".";
  const resolvedSha = validateResolvedSha(getHeadSha(controlCheckoutPath), options.resolvedSha);
  const repoRoot = getRepoRoot();
  const stopPlan = buildStopPlan(path.join(repoRoot, ".env.compose.preview.stop.example"), databaseMode);
  const summary = { ...createPreviewSummary(options.requestedRef, resolvedSha), databaseMode };

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          summary,
          controlCheckoutPath,
          previewVolumeName: PREVIEW_VOLUME_NAME,
          previewNetworkName: PREVIEW_NETWORK_NAME,
          databaseMode,
          resetConfirmation: options.resetConfirmation,
          stopPlan
        },
        null,
        2
      )
    );
    return;
  }

  const result = runCommandWithEnv("docker", stopPlan.down, {});
  assertSuccessfulCommand(result, `docker compose down ${databaseMode === "reset" ? "-v " : ""}--remove-orphans`);

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        ...summary,
        databaseVolume: stopPlan.databaseVolumeAction,
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
