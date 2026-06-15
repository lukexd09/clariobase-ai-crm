import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export function ensureRepoTmpRoot(repoRoot: string) {
  const tmpRoot = path.join(repoRoot, ".codex-tmp");
  fs.mkdirSync(tmpRoot, { recursive: true });
  return tmpRoot;
}

export function createRepoTmpDir(repoRoot: string, prefix: string) {
  return fs.mkdtempSync(path.join(ensureRepoTmpRoot(repoRoot), prefix));
}

export function createSystemTmpDir(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}
