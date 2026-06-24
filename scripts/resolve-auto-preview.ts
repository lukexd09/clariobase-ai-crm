import fs from "node:fs";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_REPOSITORY = "lukexd09/clariobase-ai-crm";
export const PREVIEW_STATUS_COMMENT_MARKER = "<!-- clariobase-preview-status -->";
export const PREVIEW_URL = "http://Serwer:3001";
export const AUTO_PREVIEW_CONTEXT_SCHEMA_VERSION = 1;

type PullRequestRef = {
  ref?: string;
  sha?: string;
  repo?: {
    full_name?: string;
  } | null;
};

type WorkflowRunPullRequest = {
  number?: number;
  html_url?: string;
  url?: string;
  state?: string;
  head?: PullRequestRef;
  base?: PullRequestRef;
};

type WorkflowRunEvent = {
  action?: string;
  repository?: {
    full_name?: string;
    default_branch?: string;
  };
  workflow_run?: {
    name?: string;
    event?: string;
    status?: string;
    conclusion?: string | null;
    id?: number;
    head_branch?: string;
    head_sha?: string;
    html_url?: string;
    pull_requests?: WorkflowRunPullRequest[];
  };
};

type AutoPreviewContext = {
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

type PullRequestApiResponse = {
  number?: number;
  state?: string;
  html_url?: string;
  head?: PullRequestRef;
};

export type ResolutionStatus = "deploy" | "skipped" | "blocked";
export type CommentResult = "deploying" | "ready" | "failed" | "blocked";

export type ResolutionResult = {
  resolutionStatus: ResolutionStatus;
  shouldDeploy: boolean;
  skipReason: string;
  prNumber: string;
  prUrl: string;
  headRef: string;
  validatedSha: string;
  ciRunUrl: string;
};

export type PreviewCommentInputs = {
  result: CommentResult;
  attemptedSha: string;
  headRef: string;
  ciRunUrl: string;
  deploymentRunUrl: string;
  timestamp: string;
};

type ResolverOptions = {
  event: WorkflowRunEvent;
  repository: string;
  context: AutoPreviewContext;
  fetchPullRequest: (prNumber: number) => Promise<PullRequestApiResponse>;
};

type CliOptions = {
  eventPath: string;
  repository: string;
  contextPath: string;
};

function isFullSha(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{40}$/i.test(value));
}

function createResult(partial?: Partial<ResolutionResult>): ResolutionResult {
  return {
    resolutionStatus: "blocked",
    shouldDeploy: false,
    skipReason: "BLOCKED: ambiguous event payload",
    prNumber: "",
    prUrl: "",
    headRef: "",
    validatedSha: "",
    ciRunUrl: "",
    ...partial
  };
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

export function parseWorkflowRunEvent(raw: string): WorkflowRunEvent {
  return JSON.parse(raw) as WorkflowRunEvent;
}

export function parseAutoPreviewContext(raw: string): AutoPreviewContext {
  return JSON.parse(raw) as AutoPreviewContext;
}

export async function resolveAutoPreview(options: ResolverOptions): Promise<ResolutionResult> {
  const event = options.event;
  const workflowRun = event.workflow_run;
  const context = options.context;

  if (options.repository !== EXPECTED_REPOSITORY) {
    return createResult({ skipReason: `BLOCKED: repository must be ${EXPECTED_REPOSITORY}` });
  }

  if (event.action !== "completed") {
    return createResult({ skipReason: "BLOCKED: workflow_run action must be completed" });
  }

  if (!workflowRun) {
    return createResult();
  }

  const ciRunUrl = workflowRun.html_url ?? "";
  const validatedSha = workflowRun.head_sha?.toLowerCase() ?? "";
  const artifactHeadSha = context.headSha?.toLowerCase() ?? "";
  const artifactHeadRef = context.headRef ?? "";
  const prNumber = context.prNumber as number;

  if (workflowRun.name !== "CI") {
    return createResult({ resolutionStatus: "skipped", skipReason: "SKIPPED: triggering workflow is not CI", ciRunUrl });
  }

  if (workflowRun.status !== "completed") {
    return createResult({ resolutionStatus: "blocked", skipReason: "BLOCKED: workflow_run status must be completed", ciRunUrl });
  }

  if (workflowRun.conclusion !== "success") {
    return createResult({
      resolutionStatus: "skipped",
      skipReason: `SKIPPED: CI conclusion is ${workflowRun.conclusion ?? "null"}`,
      ciRunUrl,
      validatedSha
    });
  }

  if (workflowRun.event !== "pull_request") {
    return createResult({
      resolutionStatus: "skipped",
      skipReason: `SKIPPED: CI event is ${workflowRun.event ?? "unknown"}`,
      ciRunUrl,
      validatedSha
    });
  }

  if (!isFullSha(validatedSha)) {
    return createResult({ skipReason: "BLOCKED: workflow_run.head_sha is missing or invalid", ciRunUrl, validatedSha });
  }

  if (context.schemaVersion !== AUTO_PREVIEW_CONTEXT_SCHEMA_VERSION) {
    return createResult({ skipReason: "BLOCKED: unsupported auto-preview context schema", ciRunUrl, validatedSha });
  }

  if (context.repository !== EXPECTED_REPOSITORY) {
    return createResult({ skipReason: "BLOCKED: artifact repository mismatch", ciRunUrl, validatedSha });
  }

  if (context.headRepository !== EXPECTED_REPOSITORY) {
    return createResult({ skipReason: "BLOCKED: artifact head repository mismatch", ciRunUrl, validatedSha });
  }

  if (!isPositiveInteger(context.workflowRunId) || context.workflowRunId !== workflowRun.id) {
    return createResult({ skipReason: "BLOCKED: artifact workflow run ID mismatch", ciRunUrl, validatedSha });
  }

  if (!isPositiveInteger(context.prNumber)) {
    return createResult({ skipReason: "BLOCKED: artifact PR number is invalid", ciRunUrl, validatedSha });
  }

  if (!isFullSha(artifactHeadSha)) {
    return createResult({ skipReason: "BLOCKED: artifact head SHA is invalid", ciRunUrl, validatedSha });
  }

  if (artifactHeadSha !== validatedSha) {
    return createResult({ skipReason: "BLOCKED: artifact SHA mismatch", ciRunUrl, validatedSha });
  }

  const eventRepository = event.repository?.full_name;
  const workflowPullRequests = workflowRun.pull_requests ?? [];

  if (eventRepository !== EXPECTED_REPOSITORY) {
    return createResult({
      skipReason: `BLOCKED: event repository must be ${EXPECTED_REPOSITORY}`,
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber)
    });
  }

  if (workflowPullRequests.length > 1) {
    return createResult({ skipReason: "BLOCKED: workflow run has multiple associated pull requests", ciRunUrl, validatedSha });
  }

  if (workflowPullRequests.length === 1) {
    const workflowPullRequest = workflowPullRequests[0];
    const workflowPrNumber = workflowPullRequest.number;
    const workflowHeadRepository = workflowPullRequest.head?.repo?.full_name;
    const workflowHeadRef = workflowPullRequest.head?.ref ?? "";
    const workflowHeadSha = workflowPullRequest.head?.sha?.toLowerCase() ?? "";

    if (workflowPrNumber && workflowPrNumber !== prNumber) {
      return createResult({
        skipReason: "BLOCKED: workflow run PR metadata conflicts with CI artifact",
        ciRunUrl,
        validatedSha,
        prNumber: String(prNumber)
      });
    }

    if (workflowHeadRepository && workflowHeadRepository !== EXPECTED_REPOSITORY) {
      return createResult({
        skipReason: "BLOCKED: workflow run PR metadata conflicts with CI artifact",
        ciRunUrl,
        validatedSha,
        prNumber: String(prNumber)
      });
    }

    if ((workflowHeadRef && workflowHeadRef !== artifactHeadRef) || (workflowHeadSha && workflowHeadSha !== validatedSha)) {
      return createResult({
        skipReason: "BLOCKED: workflow run PR metadata conflicts with CI artifact",
        ciRunUrl,
        validatedSha,
        prNumber: String(prNumber)
      });
    }
  }

  if (artifactHeadRef !== context.headRef) {
    return createResult({ skipReason: "BLOCKED: artifact head ref mismatch", ciRunUrl, validatedSha, prNumber: String(prNumber) });
  }

  if (context.baseRepository !== EXPECTED_REPOSITORY) {
    return createResult({
      skipReason: "BLOCKED: artifact base repository mismatch",
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber)
    });
  }

  const currentPullRequest = await options.fetchPullRequest(prNumber);
  const currentHeadRepository = currentPullRequest.head?.repo?.full_name ?? "";
  const currentHeadSha = currentPullRequest.head?.sha?.toLowerCase() ?? "";
  const currentHeadRef = currentPullRequest.head?.ref ?? "";
  const headRef = currentHeadRef || artifactHeadRef || workflowRun.head_branch || "";
  const prUrl = currentPullRequest.html_url ?? "";

  if (currentPullRequest.state !== "open") {
    return createResult({
      resolutionStatus: "skipped",
      skipReason: `SKIPPED: PR #${prNumber} is ${currentPullRequest.state ?? "unknown"}`,
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber),
      prUrl,
      headRef
    });
  }

  if (currentHeadRepository !== EXPECTED_REPOSITORY) {
    return createResult({
      skipReason: `BLOCKED: current PR head repository is ${currentHeadRepository || "unknown"}`,
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber),
      prUrl,
      headRef
    });
  }

  if (!isFullSha(currentHeadSha)) {
    return createResult({
      skipReason: "BLOCKED: current PR head SHA is missing or invalid",
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber),
      prUrl,
      headRef
    });
  }

  if (currentHeadRef && currentHeadRef !== artifactHeadRef) {
    return createResult({
      skipReason: "BLOCKED: stale validated SHA",
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber),
      prUrl,
      headRef
    });
  }

  if (currentHeadSha !== validatedSha) {
    return createResult({
      resolutionStatus: "blocked",
      skipReason: "BLOCKED: stale validated SHA",
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber),
      prUrl,
      headRef
    });
  }

  return createResult({
    resolutionStatus: "deploy",
    shouldDeploy: true,
    skipReason: "",
    prNumber: String(prNumber),
    prUrl,
    headRef,
    validatedSha,
    ciRunUrl
  });
}

export function formatPreviewStatusComment(inputs: PreviewCommentInputs) {
  const statusTitle = {
    deploying: "Preview deploying",
    ready: "Preview ready",
    failed: "Preview failed",
    blocked: "Preview blocked"
  }[inputs.result];

  return [
    PREVIEW_STATUS_COMMENT_MARKER,
    "",
    statusTitle,
    "",
    `Result: ${inputs.result}`,
    `URL: ${PREVIEW_URL}`,
    `Commit: ${inputs.attemptedSha}`,
    `Branch: ${inputs.headRef}`,
    `CI: ${inputs.ciRunUrl}`,
    `Deployment: ${inputs.deploymentRunUrl}`,
    `Timestamp: ${inputs.timestamp}`
  ].join("\n");
}

export function writeGithubOutput(result: ResolutionResult) {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    return;
  }

  const lines = [
    `resolution_status=${result.resolutionStatus}`,
    `should_deploy=${result.shouldDeploy ? "true" : "false"}`,
    `pr_number=${result.prNumber}`,
    `pr_url=${result.prUrl}`,
    `head_ref=${result.headRef}`,
    `validated_sha=${result.validatedSha}`,
    `skip_reason=${result.skipReason}`,
    `ci_run_url=${result.ciRunUrl}`
  ];

  fs.appendFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

async function fetchPullRequestFromApi(repository: string, prNumber: number): Promise<PullRequestApiResponse> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN for PR verification.");
  }

  const [owner, repo] = repository.split("/");
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API pull request lookup failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as PullRequestApiResponse;
}

function parseArgs(argv: string[]): CliOptions {
  const parsed: CliOptions = {
    eventPath: process.env.GITHUB_EVENT_PATH ?? "",
    repository: process.env.GITHUB_REPOSITORY ?? "",
    contextPath: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--event-path") {
      parsed.eventPath = argv[index + 1] ?? parsed.eventPath;
      index += 1;
      continue;
    }

    if (token === "--repository") {
      parsed.repository = argv[index + 1] ?? parsed.repository;
      index += 1;
      continue;
    }

    if (token === "--context-path") {
      parsed.contextPath = argv[index + 1] ?? parsed.contextPath;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (!parsed.eventPath) {
    throw new Error("Missing required --event-path or GITHUB_EVENT_PATH.");
  }

  if (!parsed.repository) {
    throw new Error("Missing required --repository or GITHUB_REPOSITORY.");
  }

  if (!parsed.contextPath) {
    throw new Error("Missing required --context-path.");
  }

  return parsed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const event = parseWorkflowRunEvent(fs.readFileSync(options.eventPath, "utf8"));
  const context = parseAutoPreviewContext(fs.readFileSync(options.contextPath, "utf8"));
  const result = await resolveAutoPreview({
    event,
    repository: options.repository,
    context,
    fetchPullRequest: async (prNumber) => fetchPullRequestFromApi(options.repository, prNumber)
  });

  writeGithubOutput(result);
  console.log(JSON.stringify(result, null, 2));

}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedScriptPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (currentFilePath === invokedScriptPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
