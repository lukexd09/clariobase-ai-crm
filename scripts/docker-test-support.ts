import { spawnSync, type SpawnSyncOptionsWithStringEncoding, type SpawnSyncReturns } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";

export const DISPOSABLE_RUNTIME_PREFIX = "clariobase-e014-runtime-";
export const E021_E2E_DOCKER_LABELS = {
  epic: "clariobase.epic=E021",
  task: "task=T002"
} as const;
export const PROTECTED_DOCKER_PROJECT = "clariobase-crm";
export const VERIFY_IMAGE_TAG_PREFIX = `clariobase-ai-crm:test-verify-${DISPOSABLE_RUNTIME_PREFIX}`;

export type VerificationStatus = "PASS" | "SKIPPED";
export type DockerResourceKind = "container" | "network" | "volume" | "image";
export type CleanupFailure = {
  label: string;
  message: string;
};
export type CleanupReport = {
  alreadyCleaned: boolean;
  failures: CleanupFailure[];
};
export type DockerOwnershipSnapshot = {
  runId: string;
  containerName: string;
  networkName: string;
  volumeName?: string;
  manifestPath: string;
  nextPid?: number;
  hostPort?: number;
};
export type DockerInspectCandidate = {
  container?: {
    Config?: {
      Image?: string;
      Labels?: Record<string, string | undefined>;
    };
    NetworkSettings?: {
      Networks?: Record<string, unknown>;
    };
    HostConfig?: {
      PortBindings?: Record<string, unknown>;
    };
  };
  manifest?: {
    runId?: string;
    containerName?: string;
    networkName?: string;
    hostPort?: number;
  };
};
type CleanupTask = {
  label: string;
  run: () => void;
};
type SpawnCommand = (
  command: string,
  args: string[],
  options?: SpawnSyncOptionsWithStringEncoding
) => SpawnSyncReturns<string>;
type ExitLikeProcess = Pick<
  NodeJS.Process,
  "emitWarning" | "exitCode" | "once" | "removeListener"
>;

const noSuchResourcePattern = /No such (container|network|volume|image)|reference does not exist/i;
const repoRoot = path.resolve(__dirname, "..");
const codexTmpRoot = path.join(repoRoot, ".codex-tmp");

function defaultSpawnCommand(
  command: string,
  args: string[],
  options?: SpawnSyncOptionsWithStringEncoding
) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    ...options
  });
}

function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function normalizeLines(output: string | null | undefined) {
  return (output ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isWithinParentDirectory(parentDir: string, targetPath: string) {
  const relative = path.relative(parentDir, targetPath);

  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function validateDisposablePrefix(prefix: string, context: string) {
  if (!prefix || !prefix.startsWith(DISPOSABLE_RUNTIME_PREFIX)) {
    throw new Error(`${context} must use the approved disposable prefix ${DISPOSABLE_RUNTIME_PREFIX}*.`);
  }
}

function validateDisposableImagePrefix(prefix: string) {
  if (!prefix || !prefix.startsWith(VERIFY_IMAGE_TAG_PREFIX)) {
    throw new Error(`Disposable image cleanup must use the approved verify image prefix ${VERIFY_IMAGE_TAG_PREFIX}*.`);
  }
}

function validateDisposableProjectName(projectName: string) {
  if (isProtectedDockerResourceName(projectName)) {
    throw new Error(`Docker project cleanup must never target the protected ${PROTECTED_DOCKER_PROJECT} stack.`);
  }

  validateDisposablePrefix(projectName, "Docker project cleanup");

  if (projectName === DISPOSABLE_RUNTIME_PREFIX) {
    throw new Error("Docker project cleanup must target a specific disposable project, not the bare runtime prefix.");
  }
}

function validateDisposableDockerResourceNamePrefix(kind: Exclude<DockerResourceKind, "image">, name: string) {
  if (!name || name === DISPOSABLE_RUNTIME_PREFIX) {
    throw new Error(`${kind} cleanup must target a specific disposable resource named ${DISPOSABLE_RUNTIME_PREFIX}*.`);
  }

  if (isProtectedDockerResourceName(name)) {
    throw new Error(`Docker ${kind} cleanup must never target the protected ${PROTECTED_DOCKER_PROJECT} stack.`);
  }

  if (!matchesDisposableRuntimePrefix(name)) {
    throw new Error(`Docker ${kind} cleanup must use the approved disposable prefix ${DISPOSABLE_RUNTIME_PREFIX}*.`);
  }
}

function validateDisposableDockerResourceNameImage(name: string) {
  if (!name) {
    throw new Error(`Docker image cleanup must target a specific disposable image or verifier image.`);
  }

  if (isProtectedDockerResourceName(name)) {
    throw new Error(`Docker image cleanup must never target the protected ${PROTECTED_DOCKER_PROJECT} stack.`);
  }

  if (matchesDisposableRuntimePrefix(name)) {
    if (name === DISPOSABLE_RUNTIME_PREFIX) {
      throw new Error("Docker image cleanup must target a specific disposable image, not the bare runtime prefix.");
    }

    return;
  }

  if (matchesOwnedVerifyImageTag(name)) {
    if (name === VERIFY_IMAGE_TAG_PREFIX) {
      throw new Error("Docker image cleanup must target a specific verifier image, not the bare verify prefix.");
    }

    return;
  }

  throw new Error(`Docker image cleanup must use the approved disposable prefixes ${DISPOSABLE_RUNTIME_PREFIX}* or ${VERIFY_IMAGE_TAG_PREFIX}*.`);
}

function validateDisposableDockerResourceName(kind: DockerResourceKind, name: string) {
  if (kind === "image") {
    validateDisposableDockerResourceNameImage(name);
    return;
  }

  validateDisposableDockerResourceNamePrefix(kind, name);
}

function validateDisposableTempPath(targetPath: string) {
  const resolvedTargetPath = path.resolve(targetPath);

  if (!isWithinParentDirectory(codexTmpRoot, resolvedTargetPath)) {
    throw new Error(`Temporary cleanup must stay within ${codexTmpRoot}.`);
  }

  if (path.basename(resolvedTargetPath) === ".codex-tmp") {
    throw new Error("Temporary cleanup must target disposable entries inside .codex-tmp, not the root directory.");
  }

  if (!path.basename(resolvedTargetPath).startsWith(DISPOSABLE_RUNTIME_PREFIX)) {
    throw new Error(`Temporary cleanup entry names must use the approved disposable prefix ${DISPOSABLE_RUNTIME_PREFIX}*.`);
  }

  if (path.basename(resolvedTargetPath) === DISPOSABLE_RUNTIME_PREFIX) {
    throw new Error("Temporary cleanup must target a specific disposable entry, not the bare runtime prefix.");
  }
}

function isMissingDockerResource(result: SpawnSyncReturns<string>) {
  return noSuchResourcePattern.test(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
}

function runDockerCommand(args: string[], options?: SpawnSyncOptionsWithStringEncoding) {
  return defaultSpawnCommand("docker", args, options);
}

export function hasDocker(spawnCommand: SpawnCommand = defaultSpawnCommand) {
  const result = spawnCommand("docker", ["version"], {
    stdio: "ignore",
    encoding: "utf8"
  });

  return result.status === 0;
}

export function getDockerRequirementStatus(commandName: string, dockerAvailable: boolean) {
  if (dockerAvailable) {
    return {
      canRun: true,
      status: null,
      message: ""
    } as const;
  }

  return {
    canRun: false,
    status: "SKIPPED",
    message: `${commandName} requires Docker, but Docker is not available.`
  } as const;
}

export function reportVerificationStatus(status: VerificationStatus, message: string) {
  console.log(`${status}: ${message}`);
}

export function ensureDockerOrReportSkip(commandName: string) {
  const availability = getDockerRequirementStatus(commandName, hasDocker());

  if (availability.canRun) {
    return true;
  }

  reportVerificationStatus(availability.status, availability.message);
  return false;
}

export function createDockerRunId(scope: string) {
  const normalizedScope = scope
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${DISPOSABLE_RUNTIME_PREFIX}${normalizedScope}-${process.pid}-${Date.now()}`;
}

export function buildE021T002RuntimeLabels(runId: string) {
  return [
    E021_E2E_DOCKER_LABELS.epic,
    E021_E2E_DOCKER_LABELS.task,
    `run-id=${runId}`
  ];
}

export function createRuntimeArtifactName(scope: string) {
  return `${createDockerRunId(scope)}-artifacts`;
}

export function reserveFreePort() {
  return new Promise<string>((resolve, reject) => {
    const server = net.createServer();

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not reserve a free localhost port for Docker verification."));
        return;
      }

      const reservedPort = String(address.port);
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(reservedPort);
      });
    });

    server.on("error", reject);
  });
}

export function isProtectedDockerResourceName(name: string) {
  return (
    name === PROTECTED_DOCKER_PROJECT
    || name.startsWith(`${PROTECTED_DOCKER_PROJECT}-`)
    || name.startsWith(`${PROTECTED_DOCKER_PROJECT}_`)
  );
}

export function matchesDisposableRuntimePrefix(name: string, prefix = DISPOSABLE_RUNTIME_PREFIX) {
  return name.startsWith(prefix);
}

export function matchesOwnedVerifyImageTag(name: string, prefix = VERIFY_IMAGE_TAG_PREFIX) {
  return name.startsWith(prefix);
}

export function matchesDisposableImageName(
  name: string,
  prefix = DISPOSABLE_RUNTIME_PREFIX,
  verifyPrefix = VERIFY_IMAGE_TAG_PREFIX
) {
  return matchesDisposableRuntimePrefix(name, prefix) || matchesOwnedVerifyImageTag(name, verifyPrefix);
}

export function matchesProjectResourceName(name: string, projectName: string) {
  return name === projectName || name.startsWith(`${projectName}-`) || name.startsWith(`${projectName}_`);
}

export function selectDisposableResourceNames(
  names: string[],
  prefix = DISPOSABLE_RUNTIME_PREFIX
) {
  const remove: string[] = [];
  const skipProtected: string[] = [];
  const skipUnrelated: string[] = [];

  for (const name of [...new Set(names)].sort()) {
    if (isProtectedDockerResourceName(name)) {
      skipProtected.push(name);
      continue;
    }

    if (matchesDisposableRuntimePrefix(name, prefix)) {
      remove.push(name);
      continue;
    }

    skipUnrelated.push(name);
  }

  return {
    remove,
    skipProtected,
    skipUnrelated
  };
}

export function listDockerResourceNames(
  kind: DockerResourceKind,
  spawnCommand: SpawnCommand = defaultSpawnCommand
) {
  const argsByKind: Record<DockerResourceKind, string[]> = {
    container: ["ps", "-a", "--format", "{{.Names}}"],
    network: ["network", "ls", "--format", "{{.Name}}"],
    volume: ["volume", "ls", "--format", "{{.Name}}"],
    image: ["image", "ls", "--format", "{{.Repository}}:{{.Tag}}"]
  };

  const result = spawnCommand("docker", argsByKind[kind], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(
      `Could not list Docker ${kind} resources: ${(result.stderr ?? result.stdout ?? "").trim() || "unknown Docker error"}`
    );
  }

  return normalizeLines(result.stdout);
}

function removeDockerResource(
  kind: DockerResourceKind,
  name: string,
  spawnCommand: SpawnCommand = defaultSpawnCommand
) {
  const argsByKind: Record<DockerResourceKind, string[]> = {
    container: ["rm", "-f", name],
    network: ["network", "rm", name],
    volume: ["volume", "rm", "-f", name],
    image: ["image", "rm", "-f", name]
  };

  const result = spawnCommand("docker", argsByKind[kind], {
    encoding: "utf8"
  });

  if (result.status === 0 || isMissingDockerResource(result)) {
    return;
  }

  throw new Error(
    `Could not remove Docker ${kind} ${name}: ${(result.stderr ?? result.stdout ?? "").trim() || "unknown Docker error"}`
  );
}

export function cleanupDisposableResourcesByPrefix(
  prefix = DISPOSABLE_RUNTIME_PREFIX,
  imageTagPrefix = VERIFY_IMAGE_TAG_PREFIX,
  spawnCommand: SpawnCommand = defaultSpawnCommand
) {
  validateDisposablePrefix(prefix, "Disposable Docker resource cleanup");
  validateDisposableImagePrefix(imageTagPrefix);

  const failures: CleanupFailure[] = [];
  const removed = {
    containers: [] as string[],
    networks: [] as string[],
    volumes: [] as string[],
    images: [] as string[]
  };
  const skippedProtected = {
    containers: [] as string[],
    networks: [] as string[],
    volumes: [] as string[],
    images: [] as string[]
  };

  const resourcesByKind: Record<DockerResourceKind, string[]> = {
    container: [],
    network: [],
    volume: [],
    image: []
  };

  for (const kind of ["container", "network", "volume", "image"] as const) {
    try {
      resourcesByKind[kind] = listDockerResourceNames(kind, spawnCommand);
    } catch (error) {
      failures.push({
        label: `list:${kind}`,
        message: stringifyError(error)
      });
    }
  }

  const planned = {
    container: selectDisposableResourceNames(resourcesByKind.container, prefix),
    network: selectDisposableResourceNames(resourcesByKind.network, prefix),
    volume: selectDisposableResourceNames(resourcesByKind.volume, prefix),
    image: {
      remove: resourcesByKind.image
        .filter((name) => matchesDisposableImageName(name, prefix, imageTagPrefix))
        .sort(),
      skipProtected: resourcesByKind.image.filter((name) => isProtectedDockerResourceName(name)).sort(),
      skipUnrelated: resourcesByKind.image
        .filter((name) => !matchesDisposableImageName(name, prefix, imageTagPrefix) && !isProtectedDockerResourceName(name))
        .sort()
    }
  };

  for (const name of planned.container.skipProtected) {
    skippedProtected.containers.push(name);
  }

  for (const name of planned.network.skipProtected) {
    skippedProtected.networks.push(name);
  }

  for (const name of planned.volume.skipProtected) {
    skippedProtected.volumes.push(name);
  }

  for (const name of planned.image.skipProtected) {
    skippedProtected.images.push(name);
  }

  for (const [kind, names] of [
    ["container", planned.container.remove],
    ["network", planned.network.remove],
    ["volume", planned.volume.remove],
    ["image", planned.image.remove]
  ] as const) {
    for (const name of names) {
      try {
        removeDockerResource(kind, name, spawnCommand);

        if (kind === "container") {
          removed.containers.push(name);
        } else if (kind === "network") {
          removed.networks.push(name);
        } else if (kind === "volume") {
          removed.volumes.push(name);
        } else {
          removed.images.push(name);
        }
      } catch (error) {
        failures.push({
          label: `${kind}:${name}`,
          message: stringifyError(error)
        });
      }
    }
  }

  return {
    removed,
    skippedProtected,
    failures
  };
}

export function cleanupDisposableTempArtifacts(rootDir: string, prefix = DISPOSABLE_RUNTIME_PREFIX) {
  validateDisposablePrefix(prefix, "Disposable temp cleanup");

  const removed: string[] = [];
  const failures: CleanupFailure[] = [];
  const skippedUnrelated: string[] = [];

  if (!fs.existsSync(rootDir)) {
    return {
      removed,
      skippedUnrelated,
      failures
    };
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const targetPath = path.join(rootDir, entry.name);

    if (!entry.name.startsWith(prefix)) {
      skippedUnrelated.push(entry.name);
      continue;
    }

    try {
      fs.rmSync(targetPath, {
        recursive: true,
        force: true
      });
      removed.push(entry.name);
    } catch (error) {
      failures.push({
        label: `temp:${entry.name}`,
        message: stringifyError(error)
      });
    }
  }

  if (fs.existsSync(rootDir) && fs.readdirSync(rootDir).length === 0) {
    fs.rmSync(rootDir, {
      recursive: true,
      force: true
    });
  }

  return {
    removed,
    skippedUnrelated,
    failures
  };
}

export function terminateProcessTree(
  pid: number,
  spawnCommand: SpawnCommand = defaultSpawnCommand,
  platform = process.platform
) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }

  if (platform === "win32") {
    const result = spawnCommand("taskkill", ["/PID", String(pid), "/T", "/F"], {
      encoding: "utf8"
    });

    if (result.status === 0 || /not found|no running instance/i.test(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)) {
      return;
    }

    throw new Error(
      `Could not terminate Windows process tree ${pid}: ${(result.stderr ?? result.stdout ?? "").trim() || "unknown taskkill error"}`
    );
  }

  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch (error) {
      const message = stringifyError(error);

      if (/ESRCH/.test(message)) {
        return;
      }

      throw new Error(`Could not terminate process tree ${pid}: ${message}`);
    }
  }
}

export function createCleanupController(
  label: string,
  processLike: ExitLikeProcess = process,
  exitHandler: (exitCode: number) => void = process.exit
) {
  const tasks: CleanupTask[] = [];
  let cleanupRan = false;
  let cachedFailures: CleanupFailure[] = [];
  let handlersInstalled = false;

  function cleanup(reason: string) {
    if (cleanupRan) {
      return {
        alreadyCleaned: true,
        failures: [...cachedFailures]
      } satisfies CleanupReport;
    }

    cleanupRan = true;
    cachedFailures = [];

    for (const task of tasks) {
      try {
        task.run();
      } catch (error) {
        cachedFailures.push({
          label: task.label,
          message: `${label} cleanup (${reason}) failed: ${stringifyError(error)}`
        });
      }
    }

    return {
      alreadyCleaned: false,
      failures: [...cachedFailures]
    } satisfies CleanupReport;
  }

  function addTask(taskLabel: string, task: () => void) {
    tasks.unshift({
      label: taskLabel,
      run: task
    });
  }

  function registerTempPath(targetPath: string) {
    validateDisposableTempPath(targetPath);

    addTask(`temp:${path.basename(targetPath) || targetPath}`, () => {
      fs.rmSync(targetPath, {
        recursive: true,
        force: true
      });
    });
  }

  function registerDockerContainer(name: string, spawnCommand: SpawnCommand = defaultSpawnCommand) {
    validateDisposableDockerResourceName("container", name);

    addTask(`container:${name}`, () => {
      removeDockerResource("container", name, spawnCommand);
    });
  }

  function registerDockerNetwork(name: string, spawnCommand: SpawnCommand = defaultSpawnCommand) {
    validateDisposableDockerResourceName("network", name);

    addTask(`network:${name}`, () => {
      removeDockerResource("network", name, spawnCommand);
    });
  }

  function registerDockerVolume(name: string, spawnCommand: SpawnCommand = defaultSpawnCommand) {
    validateDisposableDockerResourceName("volume", name);

    addTask(`volume:${name}`, () => {
      removeDockerResource("volume", name, spawnCommand);
    });
  }

  function registerDockerImage(name: string, spawnCommand: SpawnCommand = defaultSpawnCommand) {
    validateDisposableDockerResourceName("image", name);

    addTask(`image:${name}`, () => {
      removeDockerResource("image", name, spawnCommand);
    });
  }

  function registerDockerProject(projectName: string, spawnCommand: SpawnCommand = defaultSpawnCommand) {
    validateDisposableProjectName(projectName);

    addTask(`project:${projectName}`, () => {
      for (const [kind, names] of [
        ["container", listDockerResourceNames("container", spawnCommand)],
        ["network", listDockerResourceNames("network", spawnCommand)],
        ["volume", listDockerResourceNames("volume", spawnCommand)],
        ["image", listDockerResourceNames("image", spawnCommand)]
      ] as const) {
        for (const name of names.filter((candidate) => matchesProjectResourceName(candidate, projectName))) {
          removeDockerResource(kind, name, spawnCommand);
        }
      }
    });
  }

  function registerProcessTree(pid: number, spawnCommand: SpawnCommand = defaultSpawnCommand) {
    addTask(`process:${pid}`, () => {
      terminateProcessTree(pid, spawnCommand);
    });
  }

  function installProcessHandlers() {
    if (handlersInstalled) {
      return;
    }

    const handleSignal = (signal: "SIGINT" | "SIGTERM", exitCode: number) => {
      const report = cleanup(`signal ${signal}`);

      if (report.failures.length > 0) {
        processLike.emitWarning(formatCleanupFailures(report.failures));
      }

      processLike.exitCode = exitCode;
      exitHandler(exitCode);
    };

    const handleExit = () => {
      const report = cleanup("process exit");

      if (report.failures.length > 0) {
        processLike.emitWarning(formatCleanupFailures(report.failures));
      }
    };

    processLike.once("SIGINT", () => handleSignal("SIGINT", 130));
    processLike.once("SIGTERM", () => handleSignal("SIGTERM", 143));
    processLike.once("exit", handleExit);
    handlersInstalled = true;
  }

  return {
    addTask,
    cleanup,
    installProcessHandlers,
    registerDockerContainer,
    registerDockerImage,
    registerDockerNetwork,
    registerDockerProject,
    registerDockerVolume,
    registerProcessTree,
    registerTempPath
  };
}

export function formatCleanupFailures(failures: CleanupFailure[]) {
  return failures
    .map((failure) => `${failure.label}: ${failure.message}`)
    .join("\n");
}

export function createVerificationFailure(
  verificationError: unknown,
  cleanupFailures: CleanupFailure[],
  cleanupReason: string
) {
  const verificationCause = verificationError instanceof Error ? verificationError : new Error(String(verificationError));

  if (cleanupFailures.length === 0) {
    return verificationCause;
  }

  return new AggregateError(
    [verificationCause, new Error(formatCleanupFailures(cleanupFailures))],
    `${cleanupReason} failed during verification and cleanup.`
  );
}

export function inspectRunOwnership(snapshot: DockerOwnershipSnapshot) {
  const containerExists = hasDockerResource("container", snapshot.containerName);
  const networkExists = hasDockerResource("network", snapshot.networkName);
  const volumeExists = snapshot.volumeName ? hasDockerResource("volume", snapshot.volumeName) : false;
  const manifestExists = fs.existsSync(snapshot.manifestPath);

  return {
    runId: snapshot.runId,
    containerExists,
    networkExists,
    volumeExists,
    manifestExists,
    nextPid: snapshot.nextPid ?? null,
    hostPort: snapshot.hostPort ?? null
  };
}

export function validateOwnedRuntimeSnapshot(input: {
  runId: string;
  hostPort: number;
  expectedImage?: string;
  inspect: DockerInspectCandidate;
}) {
  const image = input.inspect.container?.Config?.Image;
  const labels = input.inspect.container?.Config?.Labels ?? {};
  const containerNetworkNames = Object.keys(input.inspect.container?.NetworkSettings?.Networks ?? {});
  const portBindings = input.inspect.container?.HostConfig?.PortBindings ?? {};
  const manifest = input.inspect.manifest ?? {};

  if (image && input.expectedImage && image !== input.expectedImage) {
    throw new Error("unexpected postgres image");
  }
  if (labels["clariobase.epic"] !== "E021") {
    throw new Error("missing E021 label");
  }
  if (labels["task"] !== "T002") {
    throw new Error("missing T002 label");
  }
  if (labels["run-id"] !== input.runId) {
    throw new Error("wrong run ID label");
  }
  if (labels["com.docker.compose.project"] === PROTECTED_DOCKER_PROJECT || labels["com.docker.compose.project"] === PROTECTED_DOCKER_PROJECT + "-crm") {
    throw new Error("protected clariobase-crm identity");
  }
  if (containerNetworkNames.length === 0 || !containerNetworkNames.some((name) => name === `${input.runId}-network`)) {
    throw new Error("wrong network ownership");
  }
  if (!portBindings["5432/tcp"] && input.hostPort) {
    throw new Error("wrong inspected host port");
  }
  if (manifest.runId && manifest.runId !== input.runId) {
    throw new Error("manifest/container mismatch");
  }
  if (manifest.containerName && manifest.containerName !== `${input.runId}-postgres`) {
    throw new Error("manifest/container mismatch");
  }
  if (manifest.networkName && manifest.networkName !== `${input.runId}-network`) {
    throw new Error("manifest/container mismatch");
  }
  if (manifest.hostPort && manifest.hostPort !== input.hostPort) {
    throw new Error("wrong inspected host port");
  }
  return {
    image,
    labels,
    containerNetworkNames,
    portBindings,
    manifest
  };
}

function hasDockerResource(kind: "container" | "network" | "volume", name: string) {
  const args = kind === "volume" ? ["volume", "inspect", name] : [kind, "inspect", name];
  const result = runDockerCommand(args);

  return result.status === 0;
}

export function resolveCleanupTestRuntimeStatus(input: {
  dockerAvailable: boolean;
  dockerCleanupFailures: string[];
  tempCleanupFailures: string[];
}) {
  const hasFailures = input.dockerCleanupFailures.length > 0 || input.tempCleanupFailures.length > 0;

  if (hasFailures) {
    return "FAIL" as const;
  }

  if (!input.dockerAvailable) {
    return "SKIPPED" as const;
  }

  return "PASS" as const;
}
