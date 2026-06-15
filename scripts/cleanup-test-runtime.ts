import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  cleanupDisposableTempArtifacts,
  cleanupDisposableResourcesByPrefix,
  DISPOSABLE_RUNTIME_PREFIX,
  formatCleanupFailures,
  hasDocker,
  PROTECTED_DOCKER_PROJECT,
  resolveCleanupTestRuntimeStatus
} from "./docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const tmpRoot = path.join(repoRoot, ".codex-tmp");

function main() {
  const dockerAvailable = hasDocker();
  let cleanupFailures: string[] = [];
  let dockerCleanupStatus: "PASS" | "SKIPPED" | "NOT EXECUTED" = dockerAvailable ? "NOT EXECUTED" : "SKIPPED";
  let tempCleanupStatus: "PASS" | "SKIPPED" | "NOT EXECUTED" = "NOT EXECUTED";
  let removedContainers: string[] = [];
  let removedNetworks: string[] = [];
  let removedVolumes: string[] = [];
  let removedImages: string[] = [];
  let protectedResourcesEncountered = false;

  if (dockerAvailable) {
    try {
      const report = cleanupDisposableResourcesByPrefix();

      removedContainers = report.removed.containers;
      removedNetworks = report.removed.networks;
      removedVolumes = report.removed.volumes;
      removedImages = report.removed.images;
      protectedResourcesEncountered = (
        report.skippedProtected.containers.length
        + report.skippedProtected.networks.length
        + report.skippedProtected.volumes.length
        + report.skippedProtected.images.length
      ) > 0;

      if (report.failures.length > 0) {
        cleanupFailures.push(formatCleanupFailures(report.failures));
        dockerCleanupStatus = "NOT EXECUTED";
      } else {
        dockerCleanupStatus = "PASS";
      }
    } catch (error) {
      cleanupFailures.push(`docker-prefix-cleanup: ${error instanceof Error ? error.message : String(error)}`);
      dockerCleanupStatus = "NOT EXECUTED";
    }
  } else {
    console.log("SKIPPED: Docker cleanup skipped because Docker is not available.");
    dockerCleanupStatus = "SKIPPED";
  }

  const tempReport = cleanupDisposableTempArtifacts(tmpRoot);
  tempCleanupStatus = tempReport.failures.length > 0 ? "NOT EXECUTED" : "PASS";

  if (tempReport.failures.length > 0) {
    cleanupFailures.push(formatCleanupFailures(tempReport.failures));
  }

  console.log(`Protected stack preserved: ${PROTECTED_DOCKER_PROJECT}`);
  console.log(`Disposable Docker prefix: ${DISPOSABLE_RUNTIME_PREFIX}*`);
  console.log(`Removed containers: ${removedContainers.length}`);
  console.log(`Removed networks: ${removedNetworks.length}`);
  console.log(`Removed volumes: ${removedVolumes.length}`);
  console.log(`Removed images: ${removedImages.length}`);
  console.log(`Removed .codex-tmp disposable entries: ${tempReport.removed.length}`);
  console.log(`Skipped unrelated .codex-tmp entries: ${tempReport.skippedUnrelated.length}`);
  console.log(`Removed .codex-tmp root: ${!fs.existsSync(tmpRoot)}`);
  console.log(`Docker cleanup status: ${dockerCleanupStatus}`);
  console.log(`.codex-tmp cleanup status: ${tempCleanupStatus}`);

  if (protectedResourcesEncountered) {
    console.log(`SKIPPED: Protected Docker resources remained untouched under ${PROTECTED_DOCKER_PROJECT}.`);
  }

  const finalStatus = resolveCleanupTestRuntimeStatus({
    dockerAvailable,
    dockerCleanupFailures: dockerAvailable ? cleanupFailures : [],
    tempCleanupFailures: tempReport.failures.map((failure) => failure.message)
  });

  if (cleanupFailures.length > 0) {
    console.error("FAIL: cleanup:test-runtime encountered cleanup errors.");
    console.error(cleanupFailures.join("\n"));
    process.exitCode = 1;
    return;
  }

  if (finalStatus === "SKIPPED") {
    console.log("SKIPPED: cleanup:test-runtime completed .codex-tmp cleanup while Docker cleanup was unavailable.");
    return;
  }

  if (finalStatus === "PASS") {
    console.log("PASS: cleanup:test-runtime removed only approved disposable runtime artifacts.");
    return;
  }

  console.log("SKIPPED: cleanup:test-runtime completed with a partial cleanup result.");
}

main();
