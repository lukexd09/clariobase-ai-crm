import fs from "node:fs";
import path from "node:path";

import { createCleanupController } from "../../scripts/docker-test-support";

const mode = process.argv[2];
const targetPath = process.argv[3];
const readyFilePath = process.argv[4];

if (!mode || !targetPath || !readyFilePath) {
  throw new Error("Usage: cleanup-controller-smoke.ts <mode> <targetPath> <readyFilePath>");
}

const cleanup = createCleanupController("cleanup-controller-smoke");

cleanup.installProcessHandlers();
cleanup.registerTempPath(targetPath);

fs.mkdirSync(targetPath, { recursive: true });
fs.writeFileSync(path.join(targetPath, "marker.txt"), "runtime artifact", "utf8");
fs.writeFileSync(readyFilePath, "ready", "utf8");

if (mode === "throw") {
  setTimeout(() => {
    throw new Error("intentional cleanup smoke failure");
  }, 50);
} else if (mode === "emit-sigterm") {
  setTimeout(() => {
    process.emit("SIGTERM");
  }, 50);
} else {
  setInterval(() => {
    // Keep the process alive until the parent test interrupts it.
  }, 1000);
}
