import fs from "node:fs";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_REPOSITORY = "lukexd09/clariobase-ai-crm";
export const PREVIEW_STATUS_COMMENT_MARKER = "<!-- clariobase-preview-status -->";
export const PREVIEW_URL = "http://Serwer:3001";

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
    head_branch?: string;
    head_sha?: string;
    html_url?: string;
    pull_requests?: WorkflowRunPullRequest[];
  };
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
  status: ResolutionStatus;
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
  fetchPullRequest: (prNumber: number) => Promise<PullRequestApiResponse>;
};

type CliOptions = {
  eventPath: string;
  repository: string;
};

function isFullSha(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{40}$/i.test(value));
}

function createResult(partial?: Partial<ResolutionResult>): ResolutionResult {
  return {
    status: "blocked",
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

export function parseWorkflowRunEvent(raw: string): WorkflowRunEvent {
  return JSON.parse(raw) as WorkflowRunEvent;
}

export async function resolveAutoPreview(options: ResolverOptions): Promise<ResolutionResult> {
  const event = options.event;
  const workflowRun = event.workflow_run;

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

  if (workflowRun.name !== "CI") {
    return createResult({ status: "skipped", skipReason: "SKIPPED: triggering workflow is not CI", ciRunUrl });
  }

  if (workflowRun.status !== "completed") {
    return createResult({ status: "blocked", skipReason: "BLOCKED: workflow_run status must be completed", ciRunUrl });
  }

  if (workflowRun.conclusion !== "success") {
    return createResult({
      status: "skipped",
      skipReason: `SKIPPED: CI conclusion is ${workflowRun.conclusion ?? "null"}`,
      ciRunUrl,
      validatedSha
    });
  }

  if (workflowRun.event !== "pull_request") {
    return createResult({
      status: "skipped",
      skipReason: `SKIPPED: CI event is ${workflowRun.event ?? "unknown"}`,
      ciRunUrl,
      validatedSha
    });
  }

  if (!isFullSha(validatedSha)) {
    return createResult({ skipReason: "BLOCKED: workflow_run.head_sha is missing or invalid", ciRunUrl, validatedSha });
  }

  const associatedPullRequests = workflowRun.pull_requests ?? [];

  if (associatedPullRequests.length !== 1) {
    return createResult({
      status: associatedPullRequests.length === 0 ? "skipped" : "blocked",
      skipReason:
        associatedPullRequests.length === 0
          ? "SKIPPED: CI run has no associated pull request"
          : "BLOCKED: CI run has multiple associated pull requests",
      ciRunUrl,
      validatedSha
    });
  }

  const associatedPullRequest = associatedPullRequests[0];
  const prNumber = associatedPullRequest.number;

  if (!prNumber) {
    return createResult({ skipReason: "BLOCKED: associated pull request number is missing", ciRunUrl, validatedSha });
  }

  const eventRepository = event.repository?.full_name;
  const associatedHeadRepository = associatedPullRequest.head?.repo?.full_name;

  if (eventRepository !== EXPECTED_REPOSITORY) {
    return createResult({
      skipReason: `BLOCKED: event repository must be ${EXPECTED_REPOSITORY}`,
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber)
    });
  }

  if (associatedHeadRepository !== EXPECTED_REPOSITORY) {
    return createResult({
      status: "skipped",
      skipReason: `SKIPPED: PR head repository is ${associatedHeadRepository ?? "unknown"}`,
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber)
    });
  }

  const currentPullRequest = await options.fetchPullRequest(prNumber);
  const currentHeadRepository = currentPullRequest.head?.repo?.full_name ?? "";
  const currentHeadSha = currentPullRequest.head?.sha?.toLowerCase() ?? "";
  const headRef = currentPullRequest.head?.ref ?? associatedPullRequest.head?.ref ?? workflowRun.head_branch ?? "";
  const prUrl = currentPullRequest.html_url ?? associatedPullRequest.html_url ?? associatedPullRequest.url ?? "";

  if (currentPullRequest.state !== "open") {
    return createResult({
      status: "skipped",
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
      status: "skipped",
      skipReason: `SKIPPED: current PR head repository is ${currentHeadRepository || "unknown"}`,
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

  if (currentHeadSha !== validatedSha) {
    return createResult({
      status: "blocked",
      skipReason: "BLOCKED: stale validated SHA",
      ciRunUrl,
      validatedSha,
      prNumber: String(prNumber),
      prUrl,
      headRef
    });
  }

  return createResult({
    status: "deploy",
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
    repository: process.env.GITHUB_REPOSITORY ?? ""
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

    throw new Error(`Unknown argument: ${token}`);
  }

  if (!parsed.eventPath) {
    throw new Error("Missing required --event-path or GITHUB_EVENT_PATH.");
  }

  if (!parsed.repository) {
    throw new Error("Missing required --repository or GITHUB_REPOSITORY.");
  }

  return parsed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const event = parseWorkflowRunEvent(fs.readFileSync(options.eventPath, "utf8"));
  const result = await resolveAutoPreview({
    event,
    repository: options.repository,
    fetchPullRequest: async (prNumber) => fetchPullRequestFromApi(options.repository, prNumber)
  });

  writeGithubOutput(result);
  console.log(JSON.stringify(result, null, 2));

  if (result.status === "blocked") {
    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedScriptPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (currentFilePath === invokedScriptPath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
