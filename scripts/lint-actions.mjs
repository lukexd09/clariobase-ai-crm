import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const image = "rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667";
const repoRoot = process.cwd();
const workflowDir = path.join(repoRoot, ".github", "workflows");

const workflowFiles = fs
  .readdirSync(workflowDir)
  .filter((file) => /\.(ya?ml)$/i.test(file))
  .sort()
  .map((file) => `.github/workflows/${file}`);

if (workflowFiles.length === 0) {
  console.error("No GitHub workflow files found.");
  process.exit(1);
}

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--mount",
    `type=bind,source=${repoRoot},target=/repo`,
    "-w",
    "/repo",
    image,
    "-color",
    ...workflowFiles
  ],
  { stdio: "inherit" }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
