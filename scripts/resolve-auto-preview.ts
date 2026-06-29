import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const EXPECTED_REPOSITORY = "lukexd09/clariobase-ai-crm";
export const AUTO_PREVIEW_CONTEXT_SCHEMA_VERSION = 1;

export const PROTECTED_PREVIEW_PATHS = new Set([
  ".github/workflows/ci.yml",
  ".github/workflows/full-integration.yml",
  ".github/workflows/preview-release.yml",
  ".github/workflows/auto-deploy-preview.yml",
  ".github/workflows/deploy-preview.yml",
  "scripts/resolve-auto-preview.ts",
  "scripts/deploy-preview.ts",
  "scripts/deploy-preview.ps1",
  "scripts/preview-runtime-support.ts",
  "scripts/stop-preview.ts",
  "scripts/stop-preview.ps1",
  "compose.yaml",
  "compose.preview.yaml",
  ".env.compose.preview.example"
]);

type PullRequest = {
  state?: string;
  html_url?: string;
  head?: { sha?: string; ref?: string; repo?: { full_name?: string } | null } | null;
};

type WorkflowRun = {
  id?: number;
  name?: string;
  event?: string;
  status?: string;
  conclusion?: string | null;
  head_sha?: string;
  html_url?: string;
};

type WorkflowArtifact = { id?: number; name?: string; expired?: boolean };

export type AutoPreviewContext = {
  schemaVersion?: number;
  repository?: string;
  prNumber?: number;
  headSha?: string;
  headRef?: string;
  headRepository?: string;
  baseRef?: string;
  baseRepository?: string;
  workflowRunId?: number;
};

export type PreviewReleaseRequest = {
  repository: string;
  dispatchRef: string;
  prNumber: string;
  expectedSha?: string;
};

export type PreviewReleaseResult = {
  resolutionStatus: "deploy" | "blocked";
  shouldDeploy: boolean;
  prNumber: string;
  prUrl: string;
  headRef: string;
  validatedSha: string;
  skipReason: string;
  ciRunId: string;
  ciRunUrl: string;
};

export type PreviewReleaseApi = {
  getPullRequest(prNumber: number): Promise<PullRequest>;
  listChangedFiles(prNumber: number): Promise<string[]>;
  listWorkflowRuns(headSha: string): Promise<WorkflowRun[]>;
  listWorkflowRunArtifacts(runId: number): Promise<WorkflowArtifact[]>;
  readArtifactContext(artifactId: number): Promise<AutoPreviewContext>;
};

type FetchLike = typeof fetch;

function isFullSha(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{40}$/i.test(value));
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function result(partial: Partial<PreviewReleaseResult> = {}): PreviewReleaseResult {
  return {
    resolutionStatus: "blocked",
    shouldDeploy: false,
    prNumber: "",
    prUrl: "",
    headRef: "",
    validatedSha: "",
    skipReason: "BLOCKED: ambiguous preview release request",
    ciRunId: "",
    ciRunUrl: "",
    ...partial
  };
}

function changesProtectedControlPlane(files: string[]) {
  return files.some(
    (filename) => PROTECTED_PREVIEW_PATHS.has(filename) || filename.startsWith("scripts/resolve-preview")
  );
}

export async function resolvePreviewRelease(
  request: PreviewReleaseRequest,
  api: PreviewReleaseApi
): Promise<PreviewReleaseResult> {
  const prNumber = Number(request.prNumber);
  const expectedSha = (request.expectedSha ?? "").trim().toLowerCase();
  const requestResult = result({ prNumber: isPositiveInteger(prNumber) ? String(prNumber) : "" });

  try {
    if (request.repository !== EXPECTED_REPOSITORY) {
      return result({ skipReason: `BLOCKED: repository must be ${EXPECTED_REPOSITORY}` });
    }
    if (request.dispatchRef !== "refs/heads/main") {
      return result({ skipReason: "BLOCKED: Preview Release must be dispatched from main" });
    }
    if (!isPositiveInteger(prNumber)) {
      return result({ skipReason: "BLOCKED: pr_number must be a positive integer" });
    }
    if (expectedSha && !isFullSha(expectedSha)) {
      return result({ ...requestResult, skipReason: "BLOCKED: expected_sha must be a full 40-character hexadecimal SHA" });
    }

    const pull = await api.getPullRequest(prNumber);
    const headSha = String(pull.head?.sha ?? "").toLowerCase();
    const headRef = String(pull.head?.ref ?? "");
    const headRepository = String(pull.head?.repo?.full_name ?? "");
    const pullResult = result({
      prNumber: String(prNumber),
      prUrl: String(pull.html_url ?? ""),
      headRef,
      validatedSha: headSha
    });

    if (pull.state !== "open") {
      return result({ ...pullResult, skipReason: `BLOCKED: PR #${prNumber} is not open` });
    }
    if (headRepository !== EXPECTED_REPOSITORY) {
      return result({ ...pullResult, skipReason: "BLOCKED: PR head repository is not trusted" });
    }
    if (!isFullSha(headSha)) {
      return result({ ...pullResult, skipReason: "BLOCKED: current PR head SHA is missing or invalid" });
    }
    if (expectedSha && expectedSha !== headSha) {
      return result({ ...pullResult, skipReason: "BLOCKED: expected_sha does not match the current PR head" });
    }

    if (changesProtectedControlPlane(await api.listChangedFiles(prNumber))) {
      return result({
        ...pullResult,
        skipReason:
          "BLOCKED: PR changes trusted preview control-plane files. Merge the reviewed control-plane change to main before running the runtime rehearsal."
      });
    }

    const successfulRuns = (await api.listWorkflowRuns(headSha))
      .filter(
        (run) =>
          run.name === "CI" &&
          run.event === "pull_request" &&
          run.status === "completed" &&
          run.conclusion === "success" &&
          String(run.head_sha ?? "").toLowerCase() === headSha &&
          isPositiveInteger(run.id)
      )
      .sort((left, right) => Number(right.id) - Number(left.id));
    const ciRun = successfulRuns[0];

    if (!ciRun || !isPositiveInteger(ciRun.id)) {
      return result({ ...pullResult, skipReason: "BLOCKED: no successful Fast CI run exists for the exact current PR head SHA" });
    }

    const ciResult = result({
      ...pullResult,
      ciRunId: String(ciRun.id),
      ciRunUrl: String(ciRun.html_url ?? "")
    });
    const artifacts = await api.listWorkflowRunArtifacts(ciRun.id);
    const contextArtifact = artifacts.find(
      (artifact) => artifact.name === "auto-preview-context" && artifact.expired !== true && isPositiveInteger(artifact.id)
    );

    if (!contextArtifact || !isPositiveInteger(contextArtifact.id)) {
      return result({ ...ciResult, skipReason: "BLOCKED: exact Fast CI run does not contain a valid auto-preview-context artifact" });
    }

    const context = await api.readArtifactContext(contextArtifact.id);
    if (context.schemaVersion !== AUTO_PREVIEW_CONTEXT_SCHEMA_VERSION) {
      return result({ ...ciResult, skipReason: "BLOCKED: unsupported Fast CI context artifact schema" });
    }
    if (context.repository !== EXPECTED_REPOSITORY || context.headRepository !== EXPECTED_REPOSITORY) {
      return result({ ...ciResult, skipReason: "BLOCKED: Fast CI context repository mismatch" });
    }
    if (Number(context.prNumber) !== prNumber) {
      return result({ ...ciResult, skipReason: "BLOCKED: Fast CI context PR number mismatch" });
    }
    if (String(context.headSha ?? "").toLowerCase() !== headSha) {
      return result({ ...ciResult, skipReason: "BLOCKED: Fast CI context SHA mismatch" });
    }
    if (String(context.headRef ?? "") !== headRef) {
      return result({ ...ciResult, skipReason: "BLOCKED: Fast CI context branch mismatch" });
    }
    if (Number(context.workflowRunId) !== Number(ciRun.id)) {
      return result({ ...ciResult, skipReason: "BLOCKED: Fast CI context workflow run ID mismatch" });
    }

    return result({ ...ciResult, resolutionStatus: "deploy", shouldDeploy: true, skipReason: "" });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return result({ ...requestResult, skipReason: "BLOCKED: preview release resolver execution failed" });
  }
}

export async function fetchAllPages<T>(url: string, token: string, fetchImpl: FetchLike = fetch): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetchImpl(`${url}${separator}per_page=100&page=${page}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub API request failed with HTTP ${response.status}.`);
    }
    const pageItems = (await response.json()) as T[];
    items.push(...pageItems);
    if (pageItems.length < 100) {
      return items;
    }
  }
}

async function requestJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub API request failed with HTTP ${response.status}.`);
  }
  return (await response.json()) as T;
}

async function downloadContext(repository: string, artifactId: number, token: string) {
  const response = await fetch(`https://api.github.com/repos/${repository}/actions/artifacts/${artifactId}/zip`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    redirect: "follow"
  });
  if (!response.ok) {
    throw new Error(`Artifact download failed with HTTP ${response.status}.`);
  }

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "clariobase-preview-release-"));
  const archive = path.join(directory, "auto-preview-context.zip");
  try {
    fs.writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
    return JSON.parse(execFileSync("unzip", ["-p", archive, "auto-preview-context.json"], { encoding: "utf8" })) as AutoPreviewContext;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function writeOutputs(output: PreviewReleaseResult) {
  if (!process.env.GITHUB_OUTPUT) {
    throw new Error("GITHUB_OUTPUT is required.");
  }
  const values: Record<string, string> = {
    resolution_status: output.resolutionStatus,
    should_deploy: String(output.shouldDeploy),
    pr_number: output.prNumber,
    pr_url: output.prUrl,
    head_ref: output.headRef,
    validated_sha: output.validatedSha,
    skip_reason: output.skipReason,
    ci_run_id: output.ciRunId,
    ci_run_url: output.ciRunUrl
  };
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `${Object.entries(values).map(([name, value]) => `${name}=${value.replace(/\r?\n/g, " ")}`).join("\n")}\n`,
    "utf8"
  );
}

export async function runCli() {
  const repository = process.env.REPOSITORY ?? "";
  const token = process.env.GITHUB_TOKEN ?? "";
  const [owner, repo] = repository.split("/");
  if (!token || !owner || !repo) {
    throw new Error("REPOSITORY and GITHUB_TOKEN are required.");
  }

  const api: PreviewReleaseApi = {
    getPullRequest: (prNumber) => requestJson(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, token),
    listChangedFiles: async (prNumber) =>
      (await fetchAllPages<{ filename?: string }>(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, token))
        .map((file) => String(file.filename ?? ""))
        .filter(Boolean),
    listWorkflowRuns: async (headSha) =>
      (await requestJson<{ workflow_runs?: WorkflowRun[] }>(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/ci.yml/runs?event=pull_request&status=completed&head_sha=${headSha}&per_page=100`,
        token
      )).workflow_runs ?? [],
    listWorkflowRunArtifacts: async (runId) =>
      (await requestJson<{ artifacts?: WorkflowArtifact[] }>(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts?per_page=100`,
        token
      )).artifacts ?? [],
    readArtifactContext: (artifactId) => downloadContext(repository, artifactId, token)
  };

  const output = await resolvePreviewRelease(
    {
      repository,
      dispatchRef: process.env.DISPATCH_REF ?? "",
      prNumber: process.env.REQUESTED_PR_NUMBER ?? "",
      expectedSha: process.env.REQUESTED_EXPECTED_SHA ?? ""
    },
    api
  );
  writeOutputs(output);
  console.log(JSON.stringify(output, null, 2));
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
