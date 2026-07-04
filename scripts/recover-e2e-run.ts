import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { inspectRunOwnership, terminateProcessTree } from "./docker-test-support";

const manifestPath = process.argv[2];

if (!manifestPath) {
  throw new Error("Usage: recover-e2e-run.ts <manifest-path>");
}

const resolvedManifestPath = path.resolve(manifestPath);
if (!fs.existsSync(resolvedManifestPath)) {
  throw new Error(`Recovery manifest does not exist: ${resolvedManifestPath}`);
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(resolvedManifestPath, "utf8")) as {
    runId: string;
    containerName: string;
    networkName: string;
    hostPort?: number;
    nextPid?: number;
  };

  const snapshot = inspectRunOwnership({
    runId: manifest.runId,
    containerName: manifest.containerName,
    networkName: manifest.networkName,
    manifestPath: resolvedManifestPath,
    hostPort: manifest.hostPort,
    nextPid: manifest.nextPid
  });

  console.log(JSON.stringify({ phase: "ownership-check", snapshot }, null, 2));

  if (manifest.nextPid) {
    try {
      terminateProcessTree(manifest.nextPid);
    } catch {
      // Best-effort; stale resources are still removed below if present.
    }
  }

  const { spawnSync } = await import("node:child_process");

  if (snapshot.containerExists) {
    const result = spawnSync("docker", ["rm", "-f", manifest.containerName], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`Failed to remove container: ${(result.stderr ?? result.stdout ?? "").trim()}`);
    }
  }

  if (snapshot.networkExists) {
    const result = spawnSync("docker", ["network", "rm", manifest.networkName], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`Failed to remove network: ${(result.stderr ?? result.stdout ?? "").trim()}`);
    }
  }

  fs.rmSync(resolvedManifestPath, { force: true });

  const postCleanup = inspectRunOwnership({
    runId: manifest.runId,
    containerName: manifest.containerName,
    networkName: manifest.networkName,
    manifestPath: resolvedManifestPath,
    hostPort: manifest.hostPort,
    nextPid: manifest.nextPid
  });

  console.log(JSON.stringify({ phase: "post-cleanup", postCleanup }, null, 2));

  if (postCleanup.containerExists || postCleanup.networkExists || postCleanup.manifestExists) {
    throw new Error("Interrupted-run recovery left owned resources behind.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
