import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function splitJobBlock(workflow: string, jobName: string, nextJobName?: string) {
  const start = workflow.indexOf(`  ${jobName}:`);
  if (start === -1) {
    return "";
  }

  const end = nextJobName ? workflow.indexOf(`  ${nextJobName}:`, start + 1) : workflow.length;
  return workflow.slice(start, end === -1 ? workflow.length : end);
}

function assertOrdered(block: string, earlier: string, later: string) {
  const earlierIndex = block.indexOf(earlier);
  const laterIndex = block.indexOf(later);

  assert.notEqual(earlierIndex, -1, `Missing step: ${earlier}`);
  assert.notEqual(laterIndex, -1, `Missing step: ${later}`);
  assert.ok(earlierIndex < laterIndex, `${earlier} must appear before ${later}`);
}

test("Fast CI validates the exact PR head and never starts release work", () => {
  const workflow = read(".github/workflows/ci.yml");

  assert.match(workflow, /^name: CI$/m);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /group: ci-pr-\$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /Verify checked-out PR head SHA/);
  assert.match(workflow, /name: auto-preview-context/);
  assert.match(workflow, /workflowRunId/);
  assert.match(workflow, /pnpm\/action-setup@v4/);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /cache: pnpm/);
  assert.match(workflow, /cache-dependency-path: pnpm-lock\.yaml/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /pnpm prisma:validate/);
  assert.match(workflow, /pnpm prisma:generate/);
  assert.match(workflow, /pnpm lint/);
  assert.match(workflow, /pnpm test:fast/);
  assert.match(workflow, /pnpm build/);

  assert.doesNotMatch(workflow, /pnpm test:infra/);
  assert.doesNotMatch(workflow, /pnpm test\s*$/m);
  assert.doesNotMatch(workflow, /docker\/build-push-action/);
  assert.doesNotMatch(workflow, /packages: write/);
  assert.doesNotMatch(workflow, /self-hosted/);
  assert.doesNotMatch(workflow, /workflow_run:/);
  assert.doesNotMatch(workflow, /pull_request_target/);
});

test("Full Integration is path-aware on PRs and always available on main and manually", () => {
  const workflow = read(".github/workflows/full-integration.yml");
  const classifyBlock = splitJobBlock(workflow, "classify", "integration");
  const integrationBlock = splitJobBlock(workflow, "integration", "gate");
  const gateBlock = splitJobBlock(workflow, "gate");

  assert.match(workflow, /^name: Full Integration$/m);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:\s*\n\s*branches:\s*\n\s*- main/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.match(classifyBlock, /github\.event\.pull_request\.head\.sha/);
  assert.match(classifyBlock, /git diff --name-only "\$BASE_SHA" "\$HEAD_SHA"/);
  assert.match(classifyBlock, /\.github\/workflows\/\*/);
  assert.match(classifyBlock, /Dockerfile/);
  assert.match(classifyBlock, /compose\*\.yaml/);
  assert.match(classifyBlock, /scripts\/deploy-preview\*/);
  assert.match(classifyBlock, /prisma\/schema\.prisma/);
  assert.match(classifyBlock, /prisma\/migrations\/\*/);
  assert.match(classifyBlock, /tests\/github-actions-\*/);
  assert.match(classifyBlock, /package\.json/);
  assert.match(classifyBlock, /pnpm-lock\.yaml/);
  assert.match(classifyBlock, /EVENT_NAME" != "pull_request/);
  assert.match(integrationBlock, /if: needs\.classify\.outputs\.should_run == 'true'/);
  assert.match(integrationBlock, /cache: pnpm/);
  assert.match(integrationBlock, /pnpm test:infra/);
  assert.match(gateBlock, /if: always\(\)/);
  assert.match(gateBlock, /Full Integration was required but ended with/);
  assert.doesNotMatch(workflow, /pull_request_target/);
});

test("Preview Release uses only trusted manual dispatch and exact Fast CI correlation", () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const resolverBlock = splitJobBlock(workflow, "resolve-preview-release", "report-blocked");

  assert.match(workflow, /^name: Preview Release$/m);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pr_number:/);
  assert.match(workflow, /expected_sha:/);
  assert.doesNotMatch(workflow, /workflow_run:/);
  assert.doesNotMatch(workflow, /pull_request_target/);
  assert.match(workflow, /group: clariobase-preview-slot/);
  assert.match(workflow, /cancel-in-progress: false/);

  assert.match(resolverBlock, /ref: main/);
  assert.match(resolverBlock, /DISPATCH_REF: \$\{\{ github\.ref \}\}/);
  assert.match(resolverBlock, /refs\/heads\/main/);
  assert.match(resolverBlock, /pull\.state !== "open"/);
  assert.match(resolverBlock, /headRepository !== expectedRepository/);
  assert.match(resolverBlock, /expected_sha does not match the current PR head/);
  assert.match(resolverBlock, /workflow_id: "ci\.yml"/);
  assert.match(resolverBlock, /event: "pull_request"/);
  assert.match(resolverBlock, /status: "completed"/);
  assert.match(resolverBlock, /head_sha: headSha/);
  assert.match(resolverBlock, /run\.name === "CI"/);
  assert.match(resolverBlock, /run\.conclusion === "success"/);
  assert.match(resolverBlock, /auto-preview-context/);
  assert.match(resolverBlock, /artifactContext\.prNumber/);
  assert.match(resolverBlock, /artifactContext\.headSha/);
  assert.match(resolverBlock, /artifactContext\.workflowRunId/);
  assert.match(resolverBlock, /Fast CI context workflow run ID mismatch/);
  assert.match(resolverBlock, /PR changes trusted preview control-plane files/);
  assert.doesNotMatch(resolverBlock, /pnpm install/);
});

test("Preview Release reports queued, deploying, ready, failed and blocked with one exact-SHA status contract", () => {
  const workflow = read(".github/workflows/preview-release.yml");

  for (const status of ["queued", "deploying", "ready", "failed", "blocked"]) {
    assert.match(workflow, new RegExp(`Result: ${status}|result = .*"${status}"`));
  }

  assert.match(workflow, /<!-- clariobase-preview-status -->/);
  assert.match(workflow, /PR: #/);
  assert.match(workflow, /Commit:/);
  assert.match(workflow, /Branch:/);
  assert.match(workflow, /Fast CI run:/);
  assert.match(workflow, /Image build run:/);
  assert.match(workflow, /Immutable image:/);
  assert.match(workflow, /Deployment run:/);
  assert.match(workflow, /Preview URL:/);
  assert.match(workflow, /Timestamp:/);
  assert.match(workflow, /RUNNER_REVALIDATION_RESULT/);
  assert.match(workflow, /blocked \? "blocked" : ready \? "ready" : "failed"/);
});

test("Preview Release builds one linux image, smokes it, then captures only the pushed registry digest", () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const buildBlock = splitJobBlock(workflow, "build-preview-image", "report-deploying");

  assert.match(buildBlock, /platforms: linux\/amd64/);
  assert.match(buildBlock, /load: true/);
  assert.match(buildBlock, /push: false/);
  assert.match(buildBlock, /cache-from: type=gha,scope=preview-image/);
  assert.match(buildBlock, /cache-to: type=gha,mode=max,scope=preview-image/);
  assert.match(buildBlock, /Smoke test immutable image/);
  assert.match(buildBlock, /Log in to GitHub Container Registry/);
  assert.match(buildBlock, /Push immutable preview image/);
  assertOrdered(buildBlock, "Build immutable preview image", "Smoke test immutable image");
  assertOrdered(buildBlock, "Smoke test immutable image", "Log in to GitHub Container Registry");
  assertOrdered(buildBlock, "Log in to GitHub Container Registry", "Push immutable preview image");
  assert.match(buildBlock, /docker push "\$IMAGE_TAG" \| tee docker-push\.log/);
  assert.match(buildBlock, /Expected exactly one pushed registry digest/);
  assert.match(buildBlock, /\^sha256:\[0-9a-f\]\{64\}\$/);
  assert.match(buildBlock, /IMAGE_REF="ghcr\.io\/\$\{\{ github\.repository \}\}@\$\{IMAGE_DIGEST\}"/);
  assert.doesNotMatch(buildBlock, /steps\.build-image\.outputs\.digest/);
  assert.match(buildBlock, /"prNumber": \$\{PR_NUMBER\}/);
  assert.match(buildBlock, /"sourceSha": "\$\{SOURCE_SHA\}"/);
  assert.match(buildBlock, /"ciRunId": "\$\{CI_RUN_ID\}"/);
  assert.match(buildBlock, /"imageBuildRunId": "\$\{IMAGE_BUILD_RUN_ID\}"/);
  assert.match(buildBlock, /"digest": "\$\{IMAGE_DIGEST\}"/);
  assert.match(buildBlock, /"imageRef": "\$\{IMAGE_REF\}"/);
  assert.match(buildBlock, /Log out of GitHub Container Registry/);
});

test("Windows deployment revalidates the PR and preserves immutable no-build runtime sequencing", async () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const deployBlock = splitJobBlock(workflow, "deploy-preview", "report-final");
  const composePreview = read("compose.preview.yaml");
  const runtimeSupport = read("scripts/preview-runtime-support.ts");
  const runtimeReadiness = await import("../src/lib/runtime-readiness");
  const ready = await runtimeReadiness.getRuntimeReadiness(
    async () => undefined,
    () => "2026-06-14T00:00:00.000Z"
  );

  assert.match(deployBlock, /self-hosted/);
  assert.match(deployBlock, /windows/);
  assert.match(deployBlock, /clariobase-preview/);
  assert.match(deployBlock, /environment: e016-preview-operator/);
  assert.match(deployBlock, /ref: main/);
  assert.match(deployBlock, /path: control/);
  assert.match(deployBlock, /Revalidate PR head before deployment/);
  assert.match(deployBlock, /BLOCKED: stale validated SHA/);
  assert.match(deployBlock, /runner-side PR revalidation request failed/);
  assert.match(deployBlock, /IMAGE_SOURCE_SHA must match VALIDATED_SHA/);
  assert.match(deployBlock, /ghcr\\\.io\/lukexd09\/clariobase-ai-crm@sha256:\[0-9a-f\]\{64\}/);
  assert.match(deployBlock, /Log in to GitHub Container Registry/);
  assert.match(deployBlock, /scripts\\deploy-preview\.ps1/);
  assert.match(deployBlock, /http:\/\/127\.0\.0\.1:3001\/api\/ready/);
  assert.match(deployBlock, /service -ne "clariobase-ai-crm"/);
  assert.match(deployBlock, /status -ne "ready"/);
  assert.match(deployBlock, /checks\.database -ne "ok"/);
  assert.match(deployBlock, /Cleanup secrets and job artifacts/);
  assert.match(deployBlock, /Log out of GitHub Container Registry/);

  assertOrdered(deployBlock, "Revalidate PR head before deployment", "Validate immutable image handoff");
  assertOrdered(deployBlock, "Validate immutable image handoff", "Log in to GitHub Container Registry");
  assertOrdered(deployBlock, "Log in to GitHub Container Registry", "Deploy preview");
  assertOrdered(deployBlock, "Deploy preview", "Verify preview readiness");
  assertOrdered(deployBlock, "Verify preview readiness", "Cleanup secrets and job artifacts");
  assertOrdered(deployBlock, "Cleanup secrets and job artifacts", "Log out of GitHub Container Registry");

  assert.equal(ready.body.service, "clariobase-ai-crm");
  assert.equal(ready.body.status, "ready");
  assert.equal(ready.body.checks.database, "ok");
  assert.match(composePreview, /build: !reset null/);
  assert.match(composePreview, /pull_policy: never/);
  assert.match(runtimeSupport, /pullExactImage/);
  assert.match(runtimeSupport, /"run",\s*"--rm",\s*"--pull",\s*"never"/);
  assert.match(runtimeSupport, /"up",\s*"-d",\s*"--no-build",\s*"--pull",\s*"never",\s*"crm-app"/);
});

test("retired preview workflows cannot auto-deploy or bypass exact Fast CI correlation", () => {
  const autoDeploy = read(".github/workflows/auto-deploy-preview.yml");
  const directDeploy = read(".github/workflows/deploy-preview.yml");

  assert.match(autoDeploy, /^name: Retired Auto Deploy Preview$/m);
  assert.match(directDeploy, /^name: Retired Deploy Preview$/m);
  assert.match(autoDeploy, /workflow_dispatch:/);
  assert.match(directDeploy, /workflow_dispatch:/);
  assert.match(autoDeploy, /exit 1/);
  assert.match(directDeploy, /exit 1/);
  assert.doesNotMatch(autoDeploy, /workflow_run:/);
  assert.doesNotMatch(autoDeploy, /self-hosted|docker\/build-push-action|packages: write/);
  assert.doesNotMatch(directDeploy, /self-hosted|scripts\\deploy-preview|packages: read/);
});

test("preview workflow actions remain current and no untrusted target trigger is introduced", () => {
  const workflows = [
    read(".github/workflows/ci.yml"),
    read(".github/workflows/full-integration.yml"),
    read(".github/workflows/preview-release.yml"),
    read(".github/workflows/stop-preview.yml")
  ].join("\n");

  assert.doesNotMatch(workflows, /pull_request_target/);
  assert.doesNotMatch(workflows, /actions\/(checkout|setup-node|download-artifact)@v4/);
  assert.doesNotMatch(workflows, /write-all/);
});
