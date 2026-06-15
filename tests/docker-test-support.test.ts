import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import {
  cleanupDisposableTempArtifacts,
  createCleanupController,
  createVerificationFailure,
  createRuntimeArtifactName,
  DISPOSABLE_RUNTIME_PREFIX,
  getDockerRequirementStatus,
  matchesDisposableImageName,
  PROTECTED_DOCKER_PROJECT,
  resolveCleanupTestRuntimeStatus,
  selectDisposableResourceNames,
  terminateProcessTree
} from "../scripts/docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const cleanupFixture = path.join(repoRoot, "tests", "fixtures", "cleanup-controller-smoke.ts");

class FakeProcess extends EventEmitter {
  exitCode: number | undefined;
  warnings: string[] = [];

  emitWarning(message: string) {
    this.warnings.push(message);
  }
}

function processExists(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForCondition(predicate: () => boolean, timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return;
    }

    await delay(50);
  }

  throw new Error("Timed out while waiting for the expected condition.");
}

async function waitForChildExit(child: ReturnType<typeof spawn>) {
  return await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
    child.once("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });
}

test(".gitignore ignores .codex-tmp artifacts", () => {
  const result = spawnSync("git", ["check-ignore", "-v", ".codex-tmp/runtime-artifact.txt"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\.gitignore/);
  assert.match(result.stdout, /\.codex-tmp\//);
});

test(".dockerignore keeps .codex-tmp out of the Docker build context", () => {
  const dockerignore = fs.readFileSync(path.join(repoRoot, ".dockerignore"), "utf8");

  assert.match(dockerignore, /^\.codex-tmp$/m);
});

test("Docker-unavailable verification status is reported as explicit SKIPPED", () => {
  const status = getDockerRequirementStatus("docker:test-runtime", false);

  assert.deepEqual(status, {
    canRun: false,
    status: "SKIPPED",
    message: "docker:test-runtime requires Docker, but Docker is not available."
  });
});

test("cleanup:test-runtime status logic stays SKIPPED when Docker is unavailable and PASS only when all cleanup succeeds", () => {
  assert.equal(resolveCleanupTestRuntimeStatus({
    dockerAvailable: false,
    dockerCleanupFailures: [],
    tempCleanupFailures: []
  }), "SKIPPED");

  assert.equal(resolveCleanupTestRuntimeStatus({
    dockerAvailable: true,
    dockerCleanupFailures: [],
    tempCleanupFailures: []
  }), "PASS");

  assert.equal(resolveCleanupTestRuntimeStatus({
    dockerAvailable: false,
    dockerCleanupFailures: [],
    tempCleanupFailures: ["temp failed"]
  }), "FAIL");
});

test("cleanup planning removes only approved disposable resources and protects clariobase-crm", () => {
  const plan = selectDisposableResourceNames([
    `${DISPOSABLE_RUNTIME_PREFIX}compose-123`,
    `${DISPOSABLE_RUNTIME_PREFIX}backup-restore-123`,
    `${PROTECTED_DOCKER_PROJECT}-crm-app-1`,
    `${PROTECTED_DOCKER_PROJECT}_default`,
    "postgres",
    "shared-network"
  ]);

  assert.deepEqual(plan.remove, [
    `${DISPOSABLE_RUNTIME_PREFIX}backup-restore-123`,
    `${DISPOSABLE_RUNTIME_PREFIX}compose-123`
  ]);
  assert.deepEqual(plan.skipProtected, [
    `${PROTECTED_DOCKER_PROJECT}-crm-app-1`,
    `${PROTECTED_DOCKER_PROJECT}_default`
  ]);
  assert.deepEqual(plan.skipUnrelated, [
    "postgres",
    "shared-network"
  ]);
});

test("temporary cleanup removes only approved .codex-tmp artifacts", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "clariobase-runtime-cleanup-"));
  const approvedEntryName = createRuntimeArtifactName("temp-cleanup");
  const unrelatedEntryName = "manual-notes";
  const approvedPath = path.join(tmpRoot, approvedEntryName);
  const unrelatedPath = path.join(tmpRoot, unrelatedEntryName);

  fs.mkdirSync(approvedPath, { recursive: true });
  fs.mkdirSync(unrelatedPath, { recursive: true });

  try {
    const report = cleanupDisposableTempArtifacts(tmpRoot);

    assert.deepEqual(report.failures, []);
    assert.deepEqual(report.removed, [approvedEntryName]);
    assert.deepEqual(report.skippedUnrelated, [unrelatedEntryName]);
    assert.equal(fs.existsSync(approvedPath), false);
    assert.equal(fs.existsSync(unrelatedPath), true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("disposable image matching covers both image verifier tags and Compose runtime images", () => {
  assert.equal(
    matchesDisposableImageName("clariobase-ai-crm:test-verify-clariobase-e014-runtime-image-123"),
    true
  );
  assert.equal(
    matchesDisposableImageName("clariobase-e014-runtime-compose-123-crm-app:latest"),
    true
  );
  assert.equal(
    matchesDisposableImageName("clariobase-crm-crm-app:latest"),
    false
  );
});

test("cleanup controller is idempotent", () => {
  const cleanup = createCleanupController("idempotent-test");
  let runs = 0;

  cleanup.addTask("marker", () => {
    runs += 1;
  });

  const firstReport = cleanup.cleanup("first pass");
  const secondReport = cleanup.cleanup("second pass");

  assert.equal(runs, 1);
  assert.equal(firstReport.alreadyCleaned, false);
  assert.equal(secondReport.alreadyCleaned, true);
  assert.deepEqual(firstReport.failures, []);
  assert.deepEqual(secondReport.failures, []);
});

test("cleanup controller handles SIGINT with one-shot cleanup", () => {
  const fakeProcess = new FakeProcess();
  const exitCodes: number[] = [];
  const cleanup = createCleanupController("signal-test", fakeProcess as unknown as NodeJS.Process, (exitCode) => {
    exitCodes.push(exitCode);
  });
  let runs = 0;

  cleanup.addTask("marker", () => {
    runs += 1;
  });
  cleanup.installProcessHandlers();
  fakeProcess.emit("SIGINT");

  assert.equal(runs, 1);
  assert.deepEqual(exitCodes, [130]);
  assert.equal(fakeProcess.exitCode, 130);
});

test("cleanup controller handles SIGTERM with one-shot cleanup", () => {
  const fakeProcess = new FakeProcess();
  const exitCodes: number[] = [];
  const cleanup = createCleanupController("signal-test", fakeProcess as unknown as NodeJS.Process, (exitCode) => {
    exitCodes.push(exitCode);
  });
  let runs = 0;

  cleanup.addTask("marker", () => {
    runs += 1;
  });
  cleanup.installProcessHandlers();
  fakeProcess.emit("SIGTERM");

  assert.equal(runs, 1);
  assert.deepEqual(exitCodes, [143]);
  assert.equal(fakeProcess.exitCode, 143);
});

test("destructive helpers reject unrelated and overbroad cleanup targets before running callbacks", () => {
  const cleanup = createCleanupController("validation-test");
  let destructiveCalls = 0;

  assert.throws(() => {
    cleanup.registerDockerProject(PROTECTED_DOCKER_PROJECT, () => {
      destructiveCalls += 1;
    });
  }, /protected clariobase-crm stack/i);

  assert.throws(() => {
    cleanup.registerDockerProject("unrelated-project", () => {
      destructiveCalls += 1;
    });
  }, /approved disposable prefix/i);

  assert.throws(() => {
    cleanup.registerDockerProject("", () => {
      destructiveCalls += 1;
    });
  }, /approved disposable prefix/i);

  assert.throws(() => {
    cleanup.registerDockerProject("clariobase-e014-runtime-", () => {
      destructiveCalls += 1;
    });
  }, /specific disposable project/i);

  assert.throws(() => {
    cleanup.registerTempPath(path.resolve(repoRoot, "outside", "tmp"));
  }, /stay within/i);

  assert.throws(() => {
    cleanup.registerTempPath(path.join(repoRoot, ".codex-tmp", "manual-entry"));
  }, /approved disposable prefix/i);

  assert.equal(destructiveCalls, 0);
});

test("verification failure and cleanup failure are both preserved in the final error", () => {
  const verificationError = new Error("verification failed");
  const combined = createVerificationFailure(verificationError, [
    {
      label: "cleanup-task",
      message: "cleanup failed"
    }
  ], "docker:test-runtime");

  assert.ok(combined instanceof AggregateError);
  assert.match(combined.message, /docker:test-runtime failed during verification and cleanup/i);
  assert.equal(combined.errors.length, 2);
  assert.match(String(combined.errors[0]), /verification failed/);
  assert.match(String(combined.errors[1]), /cleanup-task/);
});

test("failed verification paths still invoke cleanup through process-exit hooks", async () => {
  const targetPath = path.join(repoRoot, ".codex-tmp", createRuntimeArtifactName("cleanup-failure"));
  const readyFilePath = `${targetPath}.ready`;
  const child = spawn(process.execPath, [tsxCli, cleanupFixture, "throw", targetPath, readyFilePath], {
    cwd: repoRoot,
    stdio: "ignore"
  });

  await waitForCondition(() => fs.existsSync(readyFilePath));
  const result = await waitForChildExit(child);

  assert.notEqual(result.code, 0);
  assert.equal(fs.existsSync(targetPath), false);
  fs.rmSync(readyFilePath, { force: true });
});

test("interrupted verification paths still invoke cleanup", async () => {
  const targetPath = path.join(repoRoot, ".codex-tmp", createRuntimeArtifactName("cleanup-signal"));
  const readyFilePath = `${targetPath}.ready`;
  const child = spawn(process.execPath, [tsxCli, cleanupFixture, "emit-sigterm", targetPath, readyFilePath], {
    cwd: repoRoot,
    stdio: "ignore"
  });

  await waitForCondition(() => fs.existsSync(readyFilePath));
  const result = await waitForChildExit(child);

  assert.equal(result.signal, null);
  assert.equal(result.code, 143);
  assert.equal(fs.existsSync(targetPath), false);
  fs.rmSync(readyFilePath, { force: true });
});

test("terminateProcessTree removes Windows child-process trees", { skip: process.platform !== "win32" }, async () => {
  const parent = spawn(
    process.execPath,
    [
      "-e",
      [
        "const { spawn } = require('node:child_process');",
        "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });",
        "console.log(`child:${child.pid}`);",
        "setInterval(() => {}, 1000);"
      ].join(" ")
    ],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"]
    }
  );

  let output = "";

  parent.stdout.setEncoding("utf8");
  parent.stdout.on("data", (chunk) => {
    output += chunk;
  });

  await waitForCondition(() => /child:\d+/.test(output));
  const childPid = Number(output.match(/child:(\d+)/)?.[1]);

  assert.ok(Number.isInteger(childPid) && childPid > 0, "child PID should be discoverable");
  terminateProcessTree(parent.pid);

  await waitForCondition(() => !processExists(parent.pid) && !processExists(childPid), 10000);
  assert.equal(processExists(parent.pid), false);
  assert.equal(processExists(childPid), false);
});
