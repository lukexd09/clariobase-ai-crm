"use strict";

const SOURCE_MODES = Object.freeze(["open_pr", "main"]);
const DATABASE_MODES = Object.freeze(["preserve", "reset"]);
const REPORTING_TARGETS = Object.freeze(["pull_request", "none"]);
const CONTROL_PLANE_PATTERNS = Object.freeze([
  ".github/workflows/ci.yml",
  ".github/workflows/full-integration.yml",
  ".github/workflows/preview-release.yml",
  ".github/workflows/auto-deploy-preview.yml",
  ".github/workflows/deploy-preview.yml",
  "scripts/deploy-preview.ts",
  "scripts/deploy-preview.ps1",
  "scripts/preview-runtime-support.ts",
  "scripts/stop-preview.ts",
  "scripts/stop-preview.ps1",
  "compose.yaml",
  "compose.preview.yaml",
  ".env.compose.preview.example"
]);

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isFullSha(value) {
  return /^[0-9a-f]{40}$/i.test(asTrimmedString(value));
}

function normalizeSourceMode(value) {
  const sourceMode = asTrimmedString(value);

  if (SOURCE_MODES.includes(sourceMode)) {
    return sourceMode;
  }

  throw new Error(`source_mode must be one of: ${SOURCE_MODES.join(", ")}`);
}

function normalizeDatabaseMode(value) {
  const databaseMode = asTrimmedString(value);

  if (DATABASE_MODES.includes(databaseMode)) {
    return databaseMode;
  }

  throw new Error(`database_mode must be one of: ${DATABASE_MODES.join(", ")}`);
}

function parsePositiveInteger(value, fieldName) {
  const normalized = asTrimmedString(value);

  if (!/^[1-9][0-9]*$/.test(normalized)) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return Number(normalized);
}

function validateExpectedSha(expectedSha) {
  const normalized = asTrimmedString(expectedSha).toLowerCase();

  if (!normalized) {
    return "";
  }

  if (!isFullSha(normalized)) {
    throw new Error("expected_sha must be a full 40-character hexadecimal SHA");
  }

  return normalized;
}

function validateResetConfirmation(databaseMode, resetConfirmation) {
  if (databaseMode === "preserve") {
    return "";
  }

  if (resetConfirmation !== "RESET PREVIEW DATABASE") {
    throw new Error("reset_confirmation must exactly equal RESET PREVIEW DATABASE");
  }

  return resetConfirmation;
}

function normalizeRepository(repository) {
  return asTrimmedString(repository);
}

function normalizeSha(value, fieldName) {
  const normalized = asTrimmedString(value).toLowerCase();

  if (!isFullSha(normalized)) {
    throw new Error(`${fieldName} must be a full 40-character hexadecimal SHA`);
  }

  return normalized;
}

function normalizeChangedFiles(changedFiles) {
  if (!Array.isArray(changedFiles)) {
    return [];
  }

  return changedFiles
    .flatMap((file) => {
      if (typeof file === "string") {
        return [file.trim()];
      }

      if (file && typeof file === "object") {
        return [asTrimmedString(file.filename), asTrimmedString(file.previous_filename)];
      }

      return [""];
    })
    .filter(Boolean);
}

function hasTrustedControlPlaneChange(changedFiles) {
  const normalized = normalizeChangedFiles(changedFiles);
  return normalized.some((filename) => CONTROL_PLANE_PATTERNS.some((pattern) => filename === pattern || filename.startsWith("scripts/resolve-preview")));
}

function normalizeWorkflowRun(run) {
  if (!run || typeof run !== "object") {
    return null;
  }

  return {
    id: run.id,
    name: asTrimmedString(run.name),
    event: asTrimmedString(run.event),
    status: asTrimmedString(run.status),
    conclusion: asTrimmedString(run.conclusion),
    head_sha: asTrimmedString(run.head_sha).toLowerCase(),
    head_branch: asTrimmedString(run.head_branch),
    html_url: asTrimmedString(run.html_url)
  };
}

function selectLatestSuccessfulRun(runs, predicate) {
  if (!Array.isArray(runs)) {
    return null;
  }

  return runs
    .map(normalizeWorkflowRun)
    .filter((run) => Boolean(run))
    .filter((run) => run.conclusion === "success" && run.status === "completed" && (!predicate || predicate(run)))
    .sort((left, right) => Number(right.id) - Number(left.id))[0] ?? null;
}

function selectPreviewContextArtifact(artifacts) {
  if (!Array.isArray(artifacts)) {
    return null;
  }

  return artifacts.find((artifact) => asTrimmedString(artifact?.name) === "auto-preview-context" && !artifact?.expired) ?? null;
}

function validateCommonRequest(input) {
  const repository = normalizeRepository(input.repository);
  const expectedRepository = normalizeRepository(input.expectedRepository);
  const sourceMode = normalizeSourceMode(input.sourceMode);
  const databaseMode = normalizeDatabaseMode(input.databaseMode);
  const expectedSha = validateExpectedSha(input.expectedSha);
  const resetConfirmation = validateResetConfirmation(databaseMode, asTrimmedString(input.resetConfirmation));
  const dispatchRef = asTrimmedString(input.dispatchRef);

  if (repository !== expectedRepository) {
    throw new Error(`repository must be ${expectedRepository}`);
  }

  if (dispatchRef !== "refs/heads/main") {
    throw new Error("Preview Release must be dispatched from main");
  }

  return {
    repository,
    expectedRepository,
    sourceMode,
    databaseMode,
    expectedSha,
    resetConfirmation,
    dispatchRef
  };
}

function buildBlockedResolution(base, skipReason, extras = {}) {
  return {
    resolution_status: "blocked",
    should_deploy: "false",
    skip_reason: skipReason,
    source_mode: base.sourceMode,
    reporting_target: base.sourceMode === "open_pr" ? "pull_request" : "none",
    control_plane_restrictions_apply: base.sourceMode === "open_pr" ? "true" : "false",
    validation_run_type: base.sourceMode === "open_pr" ? "exact_head_ci" : "full_integration_main_push",
    pr_number: "",
    pr_url: "",
    head_ref: "",
    validated_sha: "",
    database_mode: base.databaseMode,
    reset_confirmation: "",
    ci_run_id: "",
    ci_run_url: "",
    ...extras
  };
}

function buildDeployResolution(base, extras = {}) {
  return {
    resolution_status: "deploy",
    should_deploy: "true",
    skip_reason: "",
    source_mode: base.sourceMode,
    reporting_target: base.sourceMode === "open_pr" ? "pull_request" : "none",
    control_plane_restrictions_apply: base.sourceMode === "open_pr" ? "true" : "false",
    validation_run_type: base.sourceMode === "open_pr" ? "exact_head_ci" : "full_integration_main_push",
    pr_number: "",
    pr_url: "",
    head_ref: "",
    validated_sha: "",
    database_mode: base.databaseMode,
    reset_confirmation: base.resetConfirmation,
    ci_run_id: "",
    ci_run_url: "",
    ...extras
  };
}

function validateArtifactContext(artifactContext, expectedRepository, prNumber, headSha, headRef, ciRunId) {
  if (!artifactContext || typeof artifactContext !== "object") {
    throw new Error("exact Fast CI run does not contain a valid auto-preview-context artifact");
  }

  if (artifactContext.schemaVersion !== 1) {
    throw new Error("unsupported Fast CI context artifact schema");
  }

  if (artifactContext.repository !== expectedRepository || artifactContext.headRepository !== expectedRepository) {
    throw new Error("Fast CI context repository mismatch");
  }

  if (Number(artifactContext.prNumber) !== prNumber) {
    throw new Error("Fast CI context PR number mismatch");
  }

  if (asTrimmedString(artifactContext.headSha).toLowerCase() !== headSha) {
    throw new Error("Fast CI context SHA mismatch");
  }

  if (asTrimmedString(artifactContext.headRef) !== headRef) {
    throw new Error("Fast CI context branch mismatch");
  }

  if (Number(artifactContext.workflowRunId) !== Number(ciRunId)) {
    throw new Error("Fast CI context workflow run ID mismatch");
  }
}

function validateOpenPrRequest(base, input) {
  const prNumber = parsePositiveInteger(input.requestedPrNumber, "pr_number");
  const pullRequest = input.pullRequest;
  const headSha = normalizeSha(pullRequest?.head?.sha, "current PR head SHA");
  const headRef = asTrimmedString(pullRequest?.head?.ref);
  const headRepository = asTrimmedString(pullRequest?.head?.repo?.full_name);
  const prUrl = asTrimmedString(pullRequest?.html_url);

  if (asTrimmedString(pullRequest?.state) !== "open") {
    throw new Error(`PR #${prNumber} is not open`);
  }

  if (headRepository !== base.expectedRepository) {
    throw new Error("PR head repository is not trusted");
  }

  if (base.expectedSha && base.expectedSha !== headSha) {
    throw new Error("expected_sha does not match the current PR head");
  }

  if (hasTrustedControlPlaneChange(input.changedFiles)) {
    throw new Error(
      "PR changes trusted preview control-plane files. Merge the reviewed control-plane change to main before running the runtime rehearsal."
    );
  }

  const ciRun = normalizeWorkflowRun(input.exactHeadCiRun);
  if (!ciRun || ciRun.name !== "CI" || ciRun.event !== "pull_request" || ciRun.conclusion !== "success" || ciRun.head_sha !== headSha) {
    throw new Error("no successful Fast CI run exists for the exact current PR head SHA");
  }

  validateArtifactContext(input.artifactContext, base.expectedRepository, prNumber, headSha, headRef, ciRun.id);

  return buildDeployResolution(base, {
    pr_number: String(prNumber),
    pr_url: prUrl,
    head_ref: headRef,
    validated_sha: headSha,
    ci_run_id: String(ciRun.id),
    ci_run_url: ciRun.html_url,
    reset_confirmation: base.databaseMode === "reset" ? base.resetConfirmation : ""
  });
}

function validateMainRequest(base, input) {
  const prNumber = typeof input.requestedPrNumber === "string" ? input.requestedPrNumber : "";

  if (prNumber !== "") {
    throw new Error("pr_number must be empty in main mode");
  }

  const sourceSha = normalizeSha(input.sourceSha, "trusted main dispatch SHA");
  if (base.expectedSha && base.expectedSha !== sourceSha) {
    throw new Error("expected_sha does not match the trusted main dispatch SHA");
  }

  const fullIntegrationRun = normalizeWorkflowRun(input.fullIntegrationRun);
  if (
    !fullIntegrationRun ||
    fullIntegrationRun.name !== "Full Integration" ||
    fullIntegrationRun.event !== "push" ||
    fullIntegrationRun.status !== "completed" ||
    fullIntegrationRun.conclusion !== "success" ||
    fullIntegrationRun.head_sha !== sourceSha ||
    fullIntegrationRun.head_branch !== "main"
  ) {
    throw new Error("no successful exact-SHA Full Integration run exists for the trusted main commit");
  }

  return buildDeployResolution(base, {
    pr_number: "",
    pr_url: "",
    head_ref: "main",
    validated_sha: sourceSha,
    ci_run_id: String(fullIntegrationRun.id),
    ci_run_url: fullIntegrationRun.html_url,
    reset_confirmation: base.databaseMode === "reset" ? base.resetConfirmation : ""
  });
}

function evaluatePreviewReleaseRequest(input) {
  const base = validateCommonRequest(input);

  if (base.sourceMode === "open_pr") {
    return validateOpenPrRequest(base, input);
  }

  return validateMainRequest(base, input);
}

module.exports = {
  SOURCE_MODES,
  DATABASE_MODES,
  REPORTING_TARGETS,
  normalizeSourceMode,
  normalizeDatabaseMode,
  parsePositiveInteger,
  validateExpectedSha,
  validateResetConfirmation,
  validatePreviewReleaseRequest: evaluatePreviewReleaseRequest,
  validateOpenPrRequest,
  validateMainRequest,
  validateCommonRequest,
  isFullSha,
  selectLatestSuccessfulRun,
  selectPreviewContextArtifact
};
