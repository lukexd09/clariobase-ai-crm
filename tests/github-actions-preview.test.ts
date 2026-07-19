import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const expectedRepository = "lukexd09/clariobase-ai-crm";
const headSha = "1111111111111111111111111111111111111111";
const mainSha = "2222222222222222222222222222222222222222";
const previewReleasePolicy = require("../scripts/preview-release-policy.js") as {
  normalizeSourceMode: (value: string) => "open_pr" | "main";
  validatePreviewReleaseRequest: (input: Record<string, unknown>) => Record<string, string>;
};

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function splitJobBlock(workflow: string, jobName: string, nextJobName?: string) {
  const start = workflow.indexOf(`  ${jobName}:`);
  if (start === -1) return "";
  const end = nextJobName ? workflow.indexOf(`  ${nextJobName}:`, start + 1) : workflow.length;
  return workflow.slice(start, end === -1 ? workflow.length : end);
}

function extractWorkflowStepBlock(workflow: string, stepName: string) {
  const start = workflow.indexOf(`      - name: ${stepName}`);
  if (start === -1) return "";
  const tail = workflow.slice(start);
  const nextStep = tail.indexOf("\n      - name:");
  return tail.slice(0, nextStep === -1 ? tail.length : nextStep);
}

type ResolverFixture = {
  sourceMode?: "open_pr" | "main";
  expectedSha?: string;
  databaseMode?: string;
  resetConfirmation?: string;
  requestedPrNumber?: string;
  sourceSha?: string;
  pull?: Record<string, unknown>;
  changedFiles?: Array<{ filename: string; previous_filename?: string }>;
  exactHeadCiRun?: Record<string, unknown>;
  artifactContext?: Record<string, unknown>;
  fullIntegrationRun?: Record<string, unknown>;
};

function executeWorkflowResolver(fixture: ResolverFixture = {}) {
  const sourceMode = previewReleasePolicy.normalizeSourceMode(fixture.sourceMode ?? "open_pr");
  const requestedPrNumber = fixture.requestedPrNumber ?? (sourceMode === "open_pr" ? "130" : "");
  const sourceSha = fixture.sourceSha ?? mainSha;
  const pull = fixture.pull ?? {
    state: "open",
    html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/130",
    head: {
      sha: headSha,
      ref: "feature/rehearsal",
      repo: { full_name: expectedRepository }
    }
  };
  const exactHeadCiRun = fixture.exactHeadCiRun ?? {
    id: 123456,
    name: "CI",
    event: "pull_request",
    status: "completed",
    conclusion: "success",
    head_sha: headSha,
    html_url: "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/123456"
  };
  const artifactContext = fixture.artifactContext ?? {
    schemaVersion: 1,
    repository: expectedRepository,
    prNumber: 130,
    headSha,
    headRef: "feature/rehearsal",
    headRepository: expectedRepository,
    baseRef: "main",
    baseRepository: expectedRepository,
    workflowRunId: 123456
  };
  const fullIntegrationRun = fixture.fullIntegrationRun ?? {
    id: 654321,
    name: "Full Integration",
    event: "push",
    status: "completed",
    conclusion: "success",
    head_sha: sourceSha,
    head_branch: "main",
    html_url: "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/654321"
  };

  const blocked = (skipReason: string) => ({
    outputs: {
      resolution_status: "blocked",
      should_deploy: "false",
      source_mode: sourceMode,
      reporting_target: sourceMode === "open_pr" ? "pull_request" : "none",
      control_plane_restrictions_apply: sourceMode === "open_pr" ? "true" : "false",
      validation_run_type: sourceMode === "open_pr" ? "exact_head_ci" : "full_integration_main_push",
      pr_number: requestedPrNumber,
      pr_url: "",
      head_ref: sourceMode === "main" ? "main" : "",
      validated_sha: "",
      database_mode: fixture.databaseMode ?? "preserve",
      reset_confirmation: "",
      ci_run_id: "",
      ci_run_url: "",
      skip_reason: skipReason
    },
    paginateCalls: [] as string[]
  });

  return {
    outputs: (() => {
      try {
        return previewReleasePolicy.validatePreviewReleaseRequest({
          repository: expectedRepository,
          expectedRepository,
          sourceMode,
          requestedPrNumber,
          expectedSha: fixture.expectedSha ?? (sourceMode === "open_pr" ? headSha : sourceSha),
          databaseMode: fixture.databaseMode ?? "preserve",
          resetConfirmation: fixture.resetConfirmation ?? "",
          dispatchRef: "refs/heads/main",
          sourceSha,
          pullRequest: pull,
          changedFiles: fixture.changedFiles ?? [{ filename: "README.md" }],
          exactHeadCiRun,
          artifactContext,
          fullIntegrationRun
        });
      } catch (error) {
        return blocked(error instanceof Error ? error.message : String(error)).outputs;
      }
    })(),
    paginateCalls: [] as string[]
  };
}

test("Fast CI validates exact-head provenance and the current merge candidate without release work", () => {
  const workflow = read(".github/workflows/ci.yml");

  assert.match(workflow, /^name: CI$/m);
  assert.match(workflow, /group: ci-pr-\$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.match(workflow, /Check out exact PR head for provenance/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /name: auto-preview-context/);
  assert.match(workflow, /Check out current PR merge candidate/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /merge-base --is-ancestor/);
  assert.match(workflow, /pnpm test:fast/);
  assert.match(workflow, /pnpm build/);
  assert.doesNotMatch(workflow, /docker\/build-push-action/);
  assert.doesNotMatch(workflow, /self-hosted/);
  assert.doesNotMatch(workflow, /workflow_run:/);
  assert.doesNotMatch(workflow, /pull_request_target/);
});

test("Full Integration classifies the PR delta and validates the current merge candidate", () => {
  const workflow = read(".github/workflows/full-integration.yml");
  const classify = splitJobBlock(workflow, "classify", "integration");
  const integration = splitJobBlock(workflow, "integration", "gate");

  assert.match(workflow, /^name: Full Integration$/m);
  assert.match(workflow, /push:\s*\n\s*branches:\s*\n\s*- main/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(classify, /VALIDATION_REF="\$EVENT_SHA"/);
  assert.match(classify, /git diff --name-only "\$BASE_SHA\.\.\.\$HEAD_SHA"/);
  assert.match(classify, /src\/app\/health\/\*/);
  assert.match(classify, /scripts\/resolve-preview\*/);
  assert.match(integration, /pnpm test:infra/);
  assert.match(splitJobBlock(workflow, "gate"), /if: always\(\)/);
});

test("Preview Release exposes explicit source modes and the resolver policy module", () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const resolver = splitJobBlock(workflow, "resolve-preview-release", "report-blocked");

  assert.match(workflow, /^name: Preview Release$/m);
  assert.match(workflow, /source_mode:/);
  assert.match(workflow, /options:\s*\n\s*- open_pr\s*\n\s*- main/);
  assert.match(workflow, /pr_number:/);
  assert.match(workflow, /expected_sha:/);
  assert.match(resolver, /preview-release-policy\.js/);
  assert.match(resolver, /source_mode: \$\{\{ steps\.resolve\.outputs\.source_mode \}\}/);
  assert.match(resolver, /reporting_target: \$\{\{ steps\.resolve\.outputs\.reporting_target \}\}/);
  assert.match(resolver, /validation_run_type: \$\{\{ steps\.resolve\.outputs\.validation_run_type \}\}/);
  assert.match(resolver, /previous_filename/);
  assert.match(resolver, /DISPATCH_REF/);
  assert.match(resolver, /selectLatestSuccessfulRun/);
  assert.match(resolver, /selectPreviewContextArtifact/);
  assert.doesNotMatch(workflow, /workflow_run:/);
  assert.doesNotMatch(workflow, /pull_request_target/);
});

test("Preview Release comment jobs only run for pull-request reporting targets", () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const blocked = extractWorkflowStepBlock(workflow, "Upsert blocked preview comment");
  const queued = extractWorkflowStepBlock(workflow, "Upsert queued preview comment");
  const deploying = extractWorkflowStepBlock(workflow, "Upsert deploying preview comment");
  const final = extractWorkflowStepBlock(workflow, "Upsert final preview comment");

  assert.match(blocked, /reporting_target == 'pull_request'/);
  assert.match(queued, /reporting_target == 'pull_request'/);
  assert.match(deploying, /reporting_target == 'pull_request'/);
  assert.match(final, /reporting_target == 'pull_request'/);
  assert.match(blocked, /Source mode:/);
  assert.match(queued, /Source mode:/);
  assert.match(deploying, /Source mode:/);
  assert.match(final, /Source mode:/);
});

test("Preview Release checks out only the resolved SHA for build and deployment", () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const build = splitJobBlock(workflow, "build-preview-image", "report-deploying");
  const deploy = splitJobBlock(workflow, "deploy-preview", "report-final");
  const trustedWorkflowCheckoutCount = (workflow.match(/ref: \$\{\{ github\.sha \}\}/g) || []).length;

  assert.match(build, /ref: \$\{\{ needs\.resolve-preview-release\.outputs\.validated_sha \}\}/);
  assert.match(build, /source_mode: \$\{\{ steps\.publish\.outputs\.source_mode \}\}/);
  assert.match(build, /sourceMode": "\$\{SOURCE_MODE\}"/);
  assert.equal(trustedWorkflowCheckoutCount, 2);
  assert.match(workflow, /Check out trusted workflow revision/);
  assert.match(workflow, /Check out trusted control checkout/);
  assert.doesNotMatch(workflow, /ref: main/);
  assert.match(deploy, /Revalidate release source before deployment/);
  assert.match(deploy, /SOURCE_MODE: \$\{\{ needs\.resolve-preview-release\.outputs\.source_mode \}\}/);
  assert.match(deploy, /DISPATCH_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(deploy, /switch \(\$env:SOURCE_MODE\)/);
  assert.match(deploy, /"open_pr"/);
  assert.match(deploy, /"main"/);
  assert.match(deploy, /"BLOCKED: PR number is required for open_pr source mode"/);
  assert.match(deploy, /"BLOCKED: PR number must be empty for main source mode"/);
  assert.match(deploy, /"BLOCKED: validated SHA does not match the trusted dispatch SHA"/);
  assert.match(deploy, /-SourceMode \$env:SOURCE_MODE/);
  assert.match(deploy, /IMAGE_SOURCE_SHA: \$\{\{ needs\.build-preview-image\.outputs\.source_sha \}\}/);
  assert.doesNotMatch(deploy, /docker build|docker compose build|--build/);
});

test("the real workflow resolver accepts an exact eligible open PR request", () => {
  const { outputs } = executeWorkflowResolver({
    sourceMode: "open_pr",
    expectedSha: headSha,
    databaseMode: "preserve",
    requestedPrNumber: "130"
  });

  assert.equal(outputs.resolution_status, "deploy");
  assert.equal(outputs.should_deploy, "true");
  assert.equal(outputs.source_mode, "open_pr");
  assert.equal(outputs.reporting_target, "pull_request");
  assert.equal(outputs.control_plane_restrictions_apply, "true");
  assert.equal(outputs.validation_run_type, "exact_head_ci");
  assert.equal(outputs.pr_number, "130");
  assert.equal(outputs.pr_url, "https://github.com/lukexd09/clariobase-ai-crm/pull/130");
  assert.equal(outputs.head_ref, "feature/rehearsal");
  assert.equal(outputs.validated_sha, headSha);
  assert.equal(outputs.database_mode, "preserve");
  assert.equal(outputs.reset_confirmation, "");
  assert.equal(outputs.ci_run_id, "123456");
  assert.equal(outputs.ci_run_url, "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/123456");
});

test("the real workflow resolver accepts an exact eligible main request", () => {
  const { outputs } = executeWorkflowResolver({
    sourceMode: "main",
    requestedPrNumber: "",
    expectedSha: mainSha,
    sourceSha: mainSha,
    databaseMode: "reset",
    resetConfirmation: "RESET PREVIEW DATABASE",
    fullIntegrationRun: {
      id: 654321,
      name: "Full Integration",
      event: "push",
      status: "completed",
      conclusion: "success",
      head_sha: mainSha,
      head_branch: "main",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/654321"
    }
  });

  assert.equal(outputs.resolution_status, "deploy");
  assert.equal(outputs.should_deploy, "true");
  assert.equal(outputs.source_mode, "main");
  assert.equal(outputs.reporting_target, "none");
  assert.equal(outputs.control_plane_restrictions_apply, "false");
  assert.equal(outputs.validation_run_type, "full_integration_main_push");
  assert.equal(outputs.pr_number, "");
  assert.equal(outputs.pr_url, "");
  assert.equal(outputs.head_ref, "main");
  assert.equal(outputs.validated_sha, mainSha);
  assert.equal(outputs.database_mode, "reset");
  assert.equal(outputs.reset_confirmation, "RESET PREVIEW DATABASE");
  assert.equal(outputs.ci_run_id, "654321");
  assert.equal(outputs.ci_run_url, "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/654321");
});

test("the resolver blocks stale SHA, forks, closed PRs, protected controls and invalid main requests", () => {
  const stale = executeWorkflowResolver({ expectedSha: "3333333333333333333333333333333333333333" });
  const fork = executeWorkflowResolver({
    pull: {
      state: "open",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/130",
      head: { sha: headSha, ref: "feature/rehearsal", repo: { full_name: "someone/fork" } }
    }
  });
  const closed = executeWorkflowResolver({
    pull: {
      state: "closed",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/130",
      head: { sha: headSha, ref: "feature/rehearsal", repo: { full_name: expectedRepository } }
    }
  });
  const protectedChange = executeWorkflowResolver({ changedFiles: [{ filename: "scripts/deploy-preview.ts" }] });
  const protectedRenameChange = executeWorkflowResolver({
    changedFiles: [{ filename: "scripts/renamed-preview.ts", previous_filename: "scripts/deploy-preview.ts" }]
  });
  const badMainPrNumber = executeWorkflowResolver({ sourceMode: "main", requestedPrNumber: "130", sourceSha: mainSha });
  const badMainExpectedSha = executeWorkflowResolver({
    sourceMode: "main",
    requestedPrNumber: "",
    expectedSha: "4444444444444444444444444444444444444444",
    sourceSha: mainSha
  });
  const badMainRun = executeWorkflowResolver({
    sourceMode: "main",
    requestedPrNumber: "",
    sourceSha: mainSha,
    fullIntegrationRun: {
      id: 654321,
      name: "Full Integration",
      event: "push",
      status: "completed",
      conclusion: "failure",
      head_sha: mainSha,
      head_branch: "main",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/654321"
    }
  });

  assert.match(stale.outputs.skip_reason, /expected_sha does not match the current PR head/);
  assert.match(fork.outputs.skip_reason, /PR head repository is not trusted/);
  assert.match(closed.outputs.skip_reason, /PR #130 is not open/);
  assert.match(protectedChange.outputs.skip_reason, /trusted preview control-plane files/);
  assert.match(protectedRenameChange.outputs.skip_reason, /trusted preview control-plane files/);
  assert.match(badMainPrNumber.outputs.skip_reason, /pr_number must be empty in main mode/);
  assert.match(badMainExpectedSha.outputs.skip_reason, /expected_sha does not match the trusted main dispatch SHA/);
  assert.match(badMainRun.outputs.skip_reason, /no successful exact-SHA Full Integration run exists/);
  for (const result of [stale, fork, closed, protectedChange, protectedRenameChange, badMainPrNumber, badMainExpectedSha, badMainRun]) {
    assert.equal(result.outputs.resolution_status, "blocked");
    assert.equal(result.outputs.should_deploy, "false");
  }
});

test("the resolver validates lifecycle inputs before deployment", () => {
  const preserve = executeWorkflowResolver({ databaseMode: "preserve" });
  const reset = executeWorkflowResolver({ databaseMode: "reset", resetConfirmation: "RESET PREVIEW DATABASE" });
  const blankReset = executeWorkflowResolver({ databaseMode: "reset", resetConfirmation: "" });
  const invalidMode = executeWorkflowResolver({ databaseMode: "wipe" });

  assert.equal(preserve.outputs.database_mode, "preserve");
  assert.equal(preserve.outputs.reset_confirmation, "");
  assert.equal(reset.outputs.database_mode, "reset");
  assert.equal(reset.outputs.reset_confirmation, "RESET PREVIEW DATABASE");
  assert.match(blankReset.outputs.skip_reason, /reset_confirmation must exactly equal RESET PREVIEW DATABASE/);
  assert.match(invalidMode.outputs.skip_reason, /database_mode must be one of: preserve, reset/);
});

test("Preview Release summary and final comment include source mode and immutable image data", () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const summary = extractWorkflowStepBlock(workflow, "Write resolution summary");
  const finalComment = extractWorkflowStepBlock(workflow, "Upsert final preview comment");
  const deploymentSummary = extractWorkflowStepBlock(workflow, "Write deployment summary");

  assert.match(summary, /Source mode:/);
  assert.match(summary, /Reporting target:/);
  assert.match(summary, /Validation run:/);
  assert.match(summary, /Image identity: n\/a/);
  assert.match(summary, /Deployment result:/);
  assert.match(deploymentSummary, /Source mode: \$env:SOURCE_MODE/);
  assert.match(deploymentSummary, /Image identity: \$env:IMAGE_REF/);
  assert.match(deploymentSummary, /PREVIEW_URL: \$\{\{ steps\.deploy\.outputs\.preview_url \}\}/);
  assert.match(deploymentSummary, /Preview URL: \$env:PREVIEW_URL/);
  assert.match(finalComment, /Source mode:/);
  assert.match(finalComment, /Immutable image:/);
});

test("workflow inventory keeps exactly four authoritative workflow files and the preview tombstones stay blocked", () => {
  const workflowDir = path.join(repoRoot, ".github", "workflows");
  const files = fs
    .readdirSync(workflowDir)
    .filter((file) => /\.(ya?ml)$/i.test(file))
    .sort();

  assert.deepEqual(files, ["ci.yml", "full-integration.yml", "preview-release.yml", "stop-preview.yml"]);
  assert.equal(fs.existsSync(path.join(workflowDir, "auto-deploy-preview.yml")), false);
  assert.equal(fs.existsSync(path.join(workflowDir, "deploy-preview.yml")), false);

  const previewRelease = read(".github/workflows/preview-release.yml");
  assert.doesNotMatch(previewRelease, /workflow_run:/);
  assert.doesNotMatch(previewRelease, /pull_request_target/);

  const ci = read(".github/workflows/ci.yml");
  assert.doesNotMatch(ci, /workflow_run:/);
  assert.doesNotMatch(ci, /pull_request_target/);
  const fullIntegration = read(".github/workflows/full-integration.yml");
  assert.doesNotMatch(fullIntegration, /^\s*(?:runs-on:\s*|-\s*)["']?self-hosted["']?\s*$/m);
  assert.doesNotMatch(fullIntegration, /^\s*(?:runs-on:\s*|-\s*)["']?clariobase-preview["']?\s*$/m);

  const stopPreview = read(".github/workflows/stop-preview.yml");
  assert.match(stopPreview, /clariobase-preview-slot/);
  assert.match(stopPreview, /self-hosted/);
  assert.match(stopPreview, /clariobase-preview/);
});

test("Stop Preview exposes the preserve/reset lifecycle inputs", () => {
  const workflow = read(".github/workflows/stop-preview.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /database_mode:/);
  assert.match(workflow, /reset_confirmation:/);
  assert.match(workflow, /-DatabaseMode \$env:DATABASE_MODE/);
  assert.match(workflow, /-ResetConfirmation \$env:RESET_CONFIRMATION/);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /Result: \$summaryResult/);
  assert.match(workflow, /Database volume: \$databaseVolume/);
  assert.match(workflow, /failureStage/);
  assert.match(workflow, /stop-preview-result\.json/);
});

test("Stop Preview fail step reads the control checkout result file", () => {
  const workflow = read(".github/workflows/stop-preview.yml");
  const failStep = extractWorkflowStepBlock(workflow, "Fail workflow if stop failed");

  assert.match(failStep, /working-directory: control/);
  assert.match(failStep, /Join-Path \$PWD "stop-preview-result\.json"/);
  assert.doesNotMatch(failStep, /Join-Path \$env:GITHUB_WORKSPACE/);
});
