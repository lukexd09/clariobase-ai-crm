import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import {
  EXPECTED_REPOSITORY,
  assertTrustedRequestedRef,
  normalizeRequestedRef
} from "../scripts/resolve-preview-ref";
import {
  PREVIEW_STATUS_COMMENT_MARKER,
  formatPreviewStatusComment,
  parseWorkflowRunEvent,
  resolveAutoPreview
} from "../scripts/resolve-auto-preview";
import { createSystemTmpDir } from "./test-helpers";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function createWorkflowRunEvent(overrides?: Record<string, unknown>) {
  return {
    action: "completed",
    repository: {
      full_name: EXPECTED_REPOSITORY,
      default_branch: "main"
    },
    workflow_run: {
      name: "CI",
      event: "pull_request",
      status: "completed",
      conclusion: "success",
      id: 123456,
      head_branch: "feature/e016-preview",
      head_sha: "1111111111111111111111111111111111111111",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/123456",
      pull_requests: [
        {
          number: 113,
          html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/113",
          head: {
            ref: "feature/e016-preview",
            sha: "1111111111111111111111111111111111111111",
            repo: {
              full_name: EXPECTED_REPOSITORY
            }
          },
          base: {
            ref: "main",
            repo: {
              full_name: EXPECTED_REPOSITORY
            }
          }
        }
      ]
    },
    ...overrides
  };
}

function createAutoPreviewContext(overrides?: Record<string, unknown>) {
  return {
    schemaVersion: 1,
    repository: EXPECTED_REPOSITORY,
    prNumber: 113,
    headSha: "1111111111111111111111111111111111111111",
    headRef: "feature/e016-preview",
    headRepository: EXPECTED_REPOSITORY,
    baseRef: "main",
    baseRepository: EXPECTED_REPOSITORY,
    workflowRunId: 123456,
    ...overrides
  };
}

test("preview workflows use trusted triggers, least privilege, and the approved scripts", () => {
  const ciWorkflow = read(".github/workflows/ci.yml");
  const autoDeployWorkflow = read(".github/workflows/auto-deploy-preview.yml");
  const deployWorkflow = read(".github/workflows/deploy-preview.yml");
  const stopWorkflow = read(".github/workflows/stop-preview.yml");
  const runnerDoc = read("docs/operations/windows-self-hosted-runner.md");
  const preflightScript = read("scripts/runner-preflight.ps1");

  assert.match(ciWorkflow, /pull_request:/);
  assert.match(ciWorkflow, /contents: read/);
  assert.match(ciWorkflow, /actions\/checkout@v5/);
  assert.match(ciWorkflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(ciWorkflow, /fetch-depth: 1/);
  assert.match(ciWorkflow, /persist-credentials: false/);
  assert.match(ciWorkflow, /Verify checked-out PR head SHA/);
  assert.match(ciWorkflow, /EXPECTED_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(ciWorkflow, /ACTUAL_SHA="\$\(git rev-parse HEAD\)"/);
  assert.match(ciWorkflow, /Validated SHA: \$ACTUAL_SHA/);
  assert.match(ciWorkflow, /Write auto-preview context/);
  assert.match(ciWorkflow, /actions\/upload-artifact@v4/);
  assert.match(ciWorkflow, /name: auto-preview-context/);
  assert.match(ciWorkflow, /actions\/setup-node@v5/);
  assert.match(ciWorkflow, /node-version: 22/);
  assert.match(ciWorkflow, /package-manager-cache: false/);
  assert.match(ciWorkflow, /corepack pnpm install --frozen-lockfile/);
  assert.match(ciWorkflow, /corepack pnpm prisma:validate/);
  assert.match(ciWorkflow, /corepack pnpm prisma:generate/);
  assert.match(ciWorkflow, /corepack pnpm lint/);
  assert.match(ciWorkflow, /corepack pnpm test/);
  assert.match(ciWorkflow, /corepack pnpm build/);
  assert.doesNotMatch(ciWorkflow, /pull_request_target/);

  assert.match(deployWorkflow, /workflow_dispatch:/);
  assert.match(deployWorkflow, /requested_ref:/);
  assert.match(deployWorkflow, /contents: read/);
  assert.match(deployWorkflow, /actions\/checkout@v5/);
  assert.match(deployWorkflow, /actions\/setup-node@v5/);
  assert.match(deployWorkflow, /docker\/login-action@[0-9a-f]{40}/);
  assert.match(deployWorkflow, /node-version: 22/);
  assert.match(deployWorkflow, /package-manager-cache: false/);
  assert.match(deployWorkflow, /group: clariobase-preview-slot/);
  assert.match(deployWorkflow, /ref: main/);
  assert.match(deployWorkflow, /path: control/);
  assert.match(deployWorkflow, /path: source/);
  assert.match(deployWorkflow, /persist-credentials: false/);
  assert.match(deployWorkflow, /scripts\/resolve-preview-ref\.ts/);
  assert.match(deployWorkflow, /Resolve immutable preview image digest/);
  assert.match(deployWorkflow, /CRM_PREVIEW_IMAGE_REF: \$\{\{ steps\.image\.outputs\.preview_image_ref \}\}/);
  assert.match(deployWorkflow, /scripts\\deploy-preview\.ps1|scripts\/deploy-preview\.ps1/);
  assert.match(deployWorkflow, /\$deployExitCode = \$LASTEXITCODE/);
  assert.match(deployWorkflow, /if \(\$deployExitCode -ne 0\)/);
  assert.doesNotMatch(deployWorkflow, /\$deployOutput\s*=/);
  assert.doesNotMatch(deployWorkflow, /ConvertFrom-Json/);
  assert.match(deployWorkflow, /preview_url=http:\/\/Serwer:3001/);
  assert.match(
    deployWorkflow,
    /resolved_sha=\$\{\{ needs\.resolve-preview-ref\.outputs\.resolved_sha \}\}/
  );
  assert.match(deployWorkflow, /clariobase-preview/);
  assert.match(deployWorkflow, /http:\/\/Serwer:3001/);
  assert.match(deployWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(deployWorkflow, /if: always\(\)/);
  assert.doesNotMatch(deployWorkflow, /pull_request_target/);

  assert.match(stopWorkflow, /workflow_dispatch:/);
  assert.match(stopWorkflow, /group: clariobase-preview-slot/);
  assert.match(stopWorkflow, /actions\/checkout@v5/);
  assert.match(stopWorkflow, /actions\/setup-node@v5/);
  assert.match(stopWorkflow, /node-version: 22/);
  assert.match(stopWorkflow, /package-manager-cache: false/);
  assert.match(stopWorkflow, /ref: main/);
  assert.match(stopWorkflow, /path: control/);
  assert.match(stopWorkflow, /persist-credentials: false/);
  assert.match(stopWorkflow, /scripts\\stop-preview\.ps1|scripts\/stop-preview\.ps1/);
  assert.match(stopWorkflow, /\$stopExitCode = \$LASTEXITCODE/);
  assert.match(stopWorkflow, /if \(\$stopExitCode -ne 0\)/);
  assert.doesNotMatch(stopWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(stopWorkflow, /if: always\(\)/);
  assert.doesNotMatch(stopWorkflow, /pull_request_target/);
  assert.match(autoDeployWorkflow, /workflow_run:/);
  assert.match(autoDeployWorkflow, /workflows:\s*\n\s*-\s*CI/);
  assert.match(autoDeployWorkflow, /types:\s*\n\s*-\s*completed/);
  assert.match(autoDeployWorkflow, /actions: read/);
  assert.match(autoDeployWorkflow, /contents: read/);
  assert.match(autoDeployWorkflow, /issues: write/);
  assert.match(autoDeployWorkflow, /pull-requests: read/);
  assert.doesNotMatch(autoDeployWorkflow, /pull-requests: write/);
  assert.doesNotMatch(autoDeployWorkflow, /write-all/);
  assert.match(autoDeployWorkflow, /group: clariobase-preview-slot/);
  assert.match(autoDeployWorkflow, /resolve-auto-preview\.ts/);
  assert.match(autoDeployWorkflow, /actions\/download-artifact@v4/);
  assert.match(autoDeployWorkflow, /docker\/login-action@[0-9a-f]{40}/);
  assert.match(autoDeployWorkflow, /run-id: \$\{\{ github\.event\.workflow_run\.id \}\}/);
  assert.match(autoDeployWorkflow, /name: auto-preview-context/);
  assert.match(autoDeployWorkflow, /\/tmp\/auto-preview-context\/auto-preview-context\.json/);
  assert.match(autoDeployWorkflow, /--context-path "\/tmp\/auto-preview-context\/auto-preview-context\.json"/);
  assert.match(autoDeployWorkflow, /Build and push immutable preview image/);
  assert.match(autoDeployWorkflow, /CRM_PREVIEW_IMAGE_REF: \$\{\{ needs\.build-preview-image\.outputs\.image_ref \}\}/);
  assert.match(autoDeployWorkflow, /ref: main/);
  assert.match(autoDeployWorkflow, /path: control/);
  assert.match(autoDeployWorkflow, /path: source/);
  assert.match(autoDeployWorkflow, /ref: \$\{\{ needs\.resolve-auto-preview\.outputs\.validated_sha \}\}/);
  assert.match(autoDeployWorkflow, /BLOCKED: stale validated SHA/);
  assert.match(autoDeployWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(autoDeployWorkflow, /http:\/\/127\.0\.0\.1:3001\/api\/ready/);
  assert.match(autoDeployWorkflow, /environment: e016-preview-operator/);
  assert.match(autoDeployWorkflow, /<!-- clariobase-preview-status -->/);
  assert.match(autoDeployWorkflow, /resolution_status: \$\{\{ steps\.resolve\.outputs\.resolution_status \}\}/);
  assert.match(autoDeployWorkflow, /BLOCKED: resolver execution failed/);
  assert.match(autoDeployWorkflow, /runner_revalidation_result=\$result/);
  assert.match(autoDeployWorkflow, /if: always\(\)\s*\n\s*shell: bash\s*\n\s*env:\s*\n\s*GATE_RESULT:/);
  assert.match(autoDeployWorkflow, /gate_result: \$\{\{ steps\.classify\.outputs\.gate_result \|\| steps\.classify_failure\.outputs\.gate_result \}\}/);
  assert.match(autoDeployWorkflow, /gate_reason: \$\{\{ steps\.classify\.outputs\.gate_reason \|\| steps\.classify_failure\.outputs\.gate_reason \}\}/);
  assert.doesNotMatch(autoDeployWorkflow, /http:\/\/127\.0\.0\.1:3000\/api\/ready/);
  assert.doesNotMatch(autoDeployWorkflow, /\non:\s*\n\s*push:/);
  assert.doesNotMatch(autoDeployWorkflow, /pull_request_target/);
  assert.doesNotMatch(`${ciWorkflow}\n${autoDeployWorkflow}\n${deployWorkflow}\n${stopWorkflow}`, /actions\/(checkout|setup-node)@v4/);

  assert.match(runnerDoc, /document_id: DOC-E016-WINDOWS-RUNNER/);
  assert.match(runnerDoc, /C:\\actions-runners\\clariobase-preview/);
  assert.match(runnerDoc, /C:\\actions-work\\clariobase-preview/);
  assert.match(runnerDoc, /clariobase-preview/);
  assert.match(runnerDoc, /short-lived repository-scoped registration token/i);
  assert.match(runnerDoc, /minimum supported version/i);
  assert.match(runnerDoc, /2\.327\.1/);
  assert.match(runnerDoc, /VersionInfo|FileVersion|Runner\.Listener\.exe/i);
  assert.match(runnerDoc, /Automatic with delayed startup behavior/i);
  assert.match(runnerDoc, /Stop Preview completed successfully after restart/i);
  assert.match(preflightScript, /must stay outside the protected production checkout path/);
  assert.match(preflightScript, /docker version/);
  assert.match(preflightScript, /MinimumRunnerVersion/);
  assert.match(preflightScript, /runnerVersion/);
});

test("auto preview workflow passes PR-derived values through env inside run steps", () => {
  const workflow = read(".github/workflows/auto-deploy-preview.yml");
  const runBlocks = [...workflow.matchAll(/run:\s*\|([\s\S]*?)(?=\n\s*-[ \w]|\n[A-Za-z]|\s*$)/g)].map((match) => match[1]);
  const riskyPatterns = [
    /\$\{\{\s*steps\.resolve\.outputs\.(pr_url|head_ref|skip_reason|pr_number|ci_run_url)\s*\}\}/,
    /\$\{\{\s*needs\.resolve-auto-preview\.outputs\.(pr_url|head_ref|skip_reason|pr_number|ci_run_url|validated_sha)\s*\}\}/
  ];

  for (const block of runBlocks) {
    for (const pattern of riskyPatterns) {
      assert.doesNotMatch(block, pattern);
    }
  }
});

test("auto preview workflow revalidation fails closed and gates deployment on exact PASS", () => {
  const workflow = read(".github/workflows/auto-deploy-preview.yml");

  assert.doesNotMatch(workflow, /Revalidate PR head before deployment[\s\S]*continue-on-error:\s*true/);
  assert.match(workflow, /BLOCKED: runner-side PR revalidation request failed/);

  const passGatedSteps = [
    "Materialize preview env file",
    "Upsert PR preview comment as deploying",
    "Deploy preview",
    "Verify preview readiness"
  ];

  for (const stepName of passGatedSteps) {
    const pattern = new RegExp(`- name: ${stepName}[\\s\\S]*?if: steps\\.revalidate\\.outputs\\.runner_revalidation_result == 'PASS'`);
    assert.match(workflow, pattern);
  }

  assert.match(
    workflow,
    /- name: Write deployment summary[\s\S]*?if: success\(\) && steps\.revalidate\.outputs\.runner_revalidation_result == 'PASS'/
  );
  assert.match(
    workflow,
    /- name: Upsert PR preview comment as ready[\s\S]*?if: success\(\) && steps\.revalidate\.outputs\.runner_revalidation_result == 'PASS'/
  );

  assert.doesNotMatch(workflow, /runner_revalidation_result != 'BLOCKED'/);
});

test("E016 telemetry keeps implementation evidence separate from dynamic PR metadata", () => {
  const telemetry = read("docs/verification/e016-budget-telemetry.yaml");
  const assurance = read("docs/verification/e016-integrated-assurance.md");

  assert.match(telemetry, /implementation_evidence:/);
  assert.match(telemetry, /final_pr_evidence:/);
  assert.match(telemetry, /source: github_pr_metadata/);
  assert.match(telemetry, /head_sha: dynamic/);
  assert.match(telemetry, /ci_run_id: dynamic/);
  assert.match(telemetry, /ci_conclusion: dynamic/);
  assert.match(telemetry, /verification_rule: resolve from GitHub after the final documentation commit/);
  assert.doesNotMatch(telemetry, /final_pr_head_sha:/);
  assert.doesNotMatch(telemetry, /final_ci_run_id:/);
  assert.doesNotMatch(telemetry, /final_ci_conclusion:/);
  assert.match(assurance, /Final Stop Preview workflow run:/);
  assert.match(assurance, /Result: `PASS`/);
  assert.match(assurance, /Conclusion:\s+success/i);
  assert.match(assurance, /Post-stop evidence:/);
  assert.match(assurance, /The final preview contract test set passed with no failures after the Windows workflow correction/i);
});

test("resolve-auto-preview accepts a successful same-repository open PR at the exact validated SHA", async () => {
  const event = parseWorkflowRunEvent(JSON.stringify(createWorkflowRunEvent()));
  const result = await resolveAutoPreview({
    event,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({
      number: 113,
      state: "open",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/113",
      head: {
        ref: "feature/e016-preview",
        sha: "1111111111111111111111111111111111111111",
        repo: {
          full_name: EXPECTED_REPOSITORY
        }
      }
    })
  });

  assert.equal(result.resolutionStatus, "deploy");
  assert.equal(result.shouldDeploy, true);
  assert.equal(result.prNumber, "113");
  assert.equal(result.headRef, "feature/e016-preview");
  assert.equal(result.validatedSha, "1111111111111111111111111111111111111111");
});

test("resolve-auto-preview uses CI artifact context as the authoritative PR identity", async () => {
  const event = parseWorkflowRunEvent(
    JSON.stringify({
      ...createWorkflowRunEvent(),
      workflow_run: {
        ...createWorkflowRunEvent().workflow_run,
        pull_requests: []
      }
    })
  );
  const result = await resolveAutoPreview({
    event,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({
      number: 113,
      state: "open",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/113",
      head: {
        ref: "feature/e016-preview",
        sha: "1111111111111111111111111111111111111111",
        repo: {
          full_name: EXPECTED_REPOSITORY
        }
      }
    })
  });

  assert.equal(result.resolutionStatus, "deploy");
  assert.equal(result.shouldDeploy, true);
});

test("resolve-auto-preview blocks artifact mismatches and forked artifact metadata", async () => {
  const event = parseWorkflowRunEvent(JSON.stringify(createWorkflowRunEvent()));
  const baseOptions = {
    event,
    repository: EXPECTED_REPOSITORY,
    fetchPullRequest: async () => ({
      number: 113,
      state: "open",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/113",
      head: {
        ref: "feature/e016-preview",
        sha: "1111111111111111111111111111111111111111",
        repo: {
          full_name: EXPECTED_REPOSITORY
        }
      }
    })
  };

  const missingArtifact = await resolveAutoPreview({ ...baseOptions, context: {} });
  const malformedArtifact = await resolveAutoPreview({
    ...baseOptions,
    context: createAutoPreviewContext({ schemaVersion: 2 })
  });
  const runIdMismatch = await resolveAutoPreview({
    ...baseOptions,
    context: createAutoPreviewContext({ workflowRunId: 999999 })
  });
  const shaMismatch = await resolveAutoPreview({
    ...baseOptions,
    context: createAutoPreviewContext({ headSha: "2222222222222222222222222222222222222222" })
  });
  const forkArtifact = await resolveAutoPreview({
    ...baseOptions,
    context: createAutoPreviewContext({ repository: "someone-else/clariobase-ai-crm", headRepository: "someone-else/clariobase-ai-crm" })
  });

  assert.equal(missingArtifact.resolutionStatus, "blocked");
  assert.match(missingArtifact.skipReason, /unsupported auto-preview context schema|artifact repository mismatch/);
  assert.equal(malformedArtifact.resolutionStatus, "blocked");
  assert.match(malformedArtifact.skipReason, /unsupported auto-preview context schema/);
  assert.equal(runIdMismatch.resolutionStatus, "blocked");
  assert.match(runIdMismatch.skipReason, /artifact workflow run ID mismatch/);
  assert.equal(shaMismatch.resolutionStatus, "blocked");
  assert.match(shaMismatch.skipReason, /artifact SHA mismatch/);
  assert.equal(forkArtifact.resolutionStatus, "blocked");
  assert.match(forkArtifact.skipReason, /artifact repository mismatch/);
});

test("resolve-auto-preview skips failed and cancelled CI runs", async () => {
  const failedEvent = parseWorkflowRunEvent(
    JSON.stringify(
      createWorkflowRunEvent({
        workflow_run: {
          ...createWorkflowRunEvent().workflow_run,
          conclusion: "failure"
        }
      })
    )
  );
  const cancelledEvent = parseWorkflowRunEvent(
    JSON.stringify(
      createWorkflowRunEvent({
        workflow_run: {
          ...createWorkflowRunEvent().workflow_run,
          conclusion: "cancelled"
        }
      })
    )
  );

  const failedResult = await resolveAutoPreview({
    event: failedEvent,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({})
  });
  const cancelledResult = await resolveAutoPreview({
    event: cancelledEvent,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({})
  });

  assert.equal(failedResult.resolutionStatus, "skipped");
  assert.match(failedResult.skipReason, /failure/);
  assert.equal(cancelledResult.resolutionStatus, "skipped");
  assert.match(cancelledResult.skipReason, /cancelled/);
});

test("resolve-auto-preview skips push-triggered CI runs and runs without a PR", async () => {
  const pushEvent = parseWorkflowRunEvent(
    JSON.stringify(
      createWorkflowRunEvent({
        workflow_run: {
          ...createWorkflowRunEvent().workflow_run,
          event: "push"
        }
      })
    )
  );
  const noPrEvent = parseWorkflowRunEvent(
    JSON.stringify({
      ...createWorkflowRunEvent(),
      workflow_run: {
        ...createWorkflowRunEvent().workflow_run,
        pull_requests: []
      }
    })
  );

  const pushResult = await resolveAutoPreview({
    event: pushEvent,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({})
  });
  const noPrResult = await resolveAutoPreview({
    event: noPrEvent,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext({ headSha: "1111111111111111111111111111111111111111" }),
    fetchPullRequest: async () => ({
      number: 113,
      state: "open",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/113",
      head: {
        ref: "feature/e016-preview",
        sha: "1111111111111111111111111111111111111111",
        repo: {
          full_name: EXPECTED_REPOSITORY
        }
      }
    })
  });

  assert.equal(pushResult.resolutionStatus, "skipped");
  assert.match(pushResult.skipReason, /CI event is push/);
  assert.equal(noPrResult.resolutionStatus, "deploy");
  assert.equal(noPrResult.shouldDeploy, true);
});

test("resolve-auto-preview rejects forked, closed, and stale PR heads", async () => {
  const forkEvent = parseWorkflowRunEvent(
    JSON.stringify({
      ...createWorkflowRunEvent(),
      workflow_run: {
        ...createWorkflowRunEvent().workflow_run,
        pull_requests: [
          {
            number: 113,
            head: {
              ref: "fork/preview",
              sha: "1111111111111111111111111111111111111111",
              repo: {
                full_name: "someone-else/clariobase-ai-crm"
              }
            }
          }
        ]
      }
    })
  );
  const closedEvent = parseWorkflowRunEvent(JSON.stringify(createWorkflowRunEvent()));
  const staleEvent = parseWorkflowRunEvent(JSON.stringify(createWorkflowRunEvent()));

  const forkResult = await resolveAutoPreview({
    event: forkEvent,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext({ headRepository: "someone-else/clariobase-ai-crm" }),
    fetchPullRequest: async () => ({})
  });
  const closedResult = await resolveAutoPreview({
    event: closedEvent,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({
      state: "closed",
      head: {
        ref: "feature/e016-preview",
        sha: "1111111111111111111111111111111111111111",
        repo: {
          full_name: EXPECTED_REPOSITORY
        }
      }
    })
  });
  const staleResult = await resolveAutoPreview({
    event: staleEvent,
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({
      state: "open",
      head: {
        ref: "feature/e016-preview",
        sha: "2222222222222222222222222222222222222222",
        repo: {
          full_name: EXPECTED_REPOSITORY
        }
      }
    })
  });

  assert.equal(forkResult.resolutionStatus, "blocked");
  assert.match(forkResult.skipReason, /artifact repository mismatch|artifact head repository mismatch/);
  assert.equal(closedResult.resolutionStatus, "skipped");
  assert.match(closedResult.skipReason, /is closed/i);
  assert.equal(staleResult.resolutionStatus, "blocked");
  assert.equal(staleResult.skipReason, "BLOCKED: stale validated SHA");
});

test("resolve-auto-preview emits controlled blocked and skipped machine-readable outcomes", async () => {
  const blockedResult = await resolveAutoPreview({
    event: parseWorkflowRunEvent(
      JSON.stringify({
        ...createWorkflowRunEvent(),
        workflow_run: {
          ...createWorkflowRunEvent().workflow_run,
          status: "queued"
        }
      })
    ),
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({})
  });
  const skippedResult = await resolveAutoPreview({
    event: parseWorkflowRunEvent(
      JSON.stringify({
        ...createWorkflowRunEvent(),
        workflow_run: {
          ...createWorkflowRunEvent().workflow_run,
          name: "Something Else"
        }
      })
    ),
    repository: EXPECTED_REPOSITORY,
    context: createAutoPreviewContext(),
    fetchPullRequest: async () => ({})
  });

  assert.equal(blockedResult.resolutionStatus, "blocked");
  assert.equal(blockedResult.shouldDeploy, false);
  assert.equal(skippedResult.resolutionStatus, "skipped");
  assert.equal(skippedResult.shouldDeploy, false);
});

test("resolve-auto-preview CLI fails hard for malformed event payloads and missing token", () => {
  const tmpRoot = createSystemTmpDir("clariobase-auto-preview-cli-");
  const eventPath = path.join(tmpRoot, "event.json");
  const contextPath = path.join(tmpRoot, "auto-preview-context.json");
  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

  try {
    fs.writeFileSync(eventPath, "{bad json", "utf8");
    fs.writeFileSync(contextPath, JSON.stringify(createAutoPreviewContext()), "utf8");

    const malformed = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-auto-preview.ts"),
      "--event-path",
      eventPath,
      "--repository",
      EXPECTED_REPOSITORY,
      "--context-path",
      contextPath
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env
      }
    });

    assert.notEqual(malformed.status, 0);

    fs.writeFileSync(eventPath, JSON.stringify(createWorkflowRunEvent()), "utf8");
    fs.writeFileSync(contextPath, JSON.stringify(createAutoPreviewContext()), "utf8");
    const missingToken = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-auto-preview.ts"),
      "--event-path",
      eventPath,
      "--repository",
      EXPECTED_REPOSITORY,
      "--context-path",
      contextPath
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_TOKEN: ""
      }
    });

    assert.notEqual(missingToken.status, 0);
    assert.match(missingToken.stderr || missingToken.stdout, /Missing GITHUB_TOKEN/i);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("resolve-auto-preview CLI fails hard for GitHub API failures", () => {
  const tmpRoot = createSystemTmpDir("clariobase-auto-preview-api-failure-");
  const eventPath = path.join(tmpRoot, "event.json");
  const contextPath = path.join(tmpRoot, "auto-preview-context.json");
  const loaderPath = path.join(tmpRoot, "mock-loader.cjs");
  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

  try {
    fs.writeFileSync(eventPath, JSON.stringify(createWorkflowRunEvent()), "utf8");
    fs.writeFileSync(contextPath, JSON.stringify(createAutoPreviewContext()), "utf8");
    fs.writeFileSync(
      loaderPath,
      "global.fetch = async () => ({ ok: false, status: 503 });",
      "utf8"
    );

    const failedApi = spawnSync(process.execPath, [
      "--require",
      loaderPath,
      tsxCli,
      path.join(repoRoot, "scripts/resolve-auto-preview.ts"),
      "--event-path",
      eventPath,
      "--repository",
      EXPECTED_REPOSITORY,
      "--context-path",
      contextPath
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_TOKEN: "test-token"
      }
    });

    assert.notEqual(failedApi.status, 0);
    assert.match(failedApi.stderr || failedApi.stdout, /GitHub API pull request lookup failed/i);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("trusted preview ref validation rejects fork-style and pull-request refs", () => {
  assert.equal(normalizeRequestedRef("refs/heads/main"), "main");
  assert.equal(normalizeRequestedRef("refs/tags/v1.2.3"), "v1.2.3");
  assert.equal(assertTrustedRequestedRef("epic/e016-manual-preview", EXPECTED_REPOSITORY), "epic/e016-manual-preview");

  assert.throws(() => normalizeRequestedRef("refs/pull/1/head"), /not trusted preview deployment targets/i);
  assert.throws(() => normalizeRequestedRef("owner:branch"), /disallowed characters/i);
  assert.throws(() => assertTrustedRequestedRef("main", "someone-else/repo"), /may only run inside/i);
});

test("resolve-preview-ref works offline from local trusted refs without a second network fetch", () => {
  const tmpRoot = createSystemTmpDir("clariobase-resolve-preview-ref-");
  const originRepo = path.join(tmpRoot, "origin.git");
  const workRepo = path.join(tmpRoot, "work");
  const outputFile = path.join(tmpRoot, "github-output.txt");
  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

  fs.rmSync(originRepo, { recursive: true, force: true });
  fs.rmSync(workRepo, { recursive: true, force: true });
  fs.mkdirSync(tmpRoot, { recursive: true });

  try {
    assert.equal(spawnSync("git", ["init", "--bare", originRepo], { encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["init", workRepo], { encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.email", "codex@example.com"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.name", "Codex"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["remote", "add", "origin", originRepo], { cwd: workRepo, encoding: "utf8" }).status, 0);

    fs.writeFileSync(path.join(workRepo, "README.md"), "first\n", "utf8");
    assert.equal(spawnSync("git", ["add", "README.md"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "first"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["branch", "-M", "main"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["push", "-u", "origin", "main"], { cwd: workRepo, encoding: "utf8" }).status, 0);

    fs.writeFileSync(path.join(workRepo, "README.md"), "second\n", "utf8");
    assert.equal(spawnSync("git", ["add", "README.md"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "second"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["checkout", "-b", "feature/ref-resolution"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    fs.writeFileSync(path.join(workRepo, "feature.txt"), "feature\n", "utf8");
    assert.equal(spawnSync("git", ["add", "feature.txt"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "feature"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["tag", "v1.2.3"], { cwd: workRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["push", "origin", "feature/ref-resolution", "v1.2.3"], { cwd: workRepo, encoding: "utf8" }).status, 0);

    const mainSha = spawnSync("git", ["rev-parse", "main"], { cwd: workRepo, encoding: "utf8" });
    const featureSha = spawnSync("git", ["rev-parse", "feature/ref-resolution"], { cwd: workRepo, encoding: "utf8" });
    const tagSha = spawnSync("git", ["rev-parse", "v1.2.3"], { cwd: workRepo, encoding: "utf8" });

    assert.equal(mainSha.status, 0, mainSha.stderr);
    assert.equal(featureSha.status, 0, featureSha.stderr);
    assert.equal(tagSha.status, 0, tagSha.stderr);

    const checkoutRepo = path.join(tmpRoot, "checkout");
    assert.equal(spawnSync("git", ["clone", originRepo, checkoutRepo], { encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["fetch", "--all", "--tags"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["remote", "set-url", "origin", "https://github.invalid/private/repository.git"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.email", "codex@example.com"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.name", "Codex"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);

    const mainLocalRef = spawnSync("git", ["rev-parse", "refs/remotes/origin/main^{commit}"], { cwd: checkoutRepo, encoding: "utf8" });
    const featureLocalRef = spawnSync("git", ["rev-parse", "refs/remotes/origin/feature/ref-resolution^{commit}"], { cwd: checkoutRepo, encoding: "utf8" });
    const tagLocalRef = spawnSync("git", ["rev-parse", "refs/tags/v1.2.3^{commit}"], { cwd: checkoutRepo, encoding: "utf8" });

    assert.equal(mainLocalRef.status, 0, mainLocalRef.stderr);
    assert.equal(featureLocalRef.status, 0, featureLocalRef.stderr);
    assert.equal(tagLocalRef.status, 0, tagLocalRef.stderr);

    const branchOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "refs/heads/main"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GITHUB_OUTPUT: outputFile
      }
    });

    assert.equal(branchOutput.status, 0, branchOutput.stderr);
    assert.match(branchOutput.stdout, new RegExp(`"requestedRef":\\s*"main"`));
    assert.match(branchOutput.stdout, new RegExp(`"resolvedSha":\\s*"${mainLocalRef.stdout.trim()}"`));

    const outputContent = fs.readFileSync(outputFile, "utf8");
    assert.match(outputContent, /requested_ref=main/);
    assert.match(outputContent, new RegExp(`resolved_sha=${mainLocalRef.stdout.trim()}`));

    const featureOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "feature/ref-resolution"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.equal(featureOutput.status, 0, featureOutput.stderr);
    assert.match(featureOutput.stdout, new RegExp(`"resolvedSha":\\s*"${featureLocalRef.stdout.trim()}"`));

    const tagOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "v1.2.3"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.equal(tagOutput.status, 0, tagOutput.stderr);
    assert.match(tagOutput.stdout, new RegExp(`"resolvedSha":\\s*"${tagLocalRef.stdout.trim()}"`));

    const reachableShaOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      featureLocalRef.stdout.trim()
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.equal(reachableShaOutput.status, 0, reachableShaOutput.stderr);
    assert.match(reachableShaOutput.stdout, new RegExp(`"resolvedSha":\\s*"${featureLocalRef.stdout.trim()}"`));

    const missingRef = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "missing/ref"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.notEqual(missingRef.status, 0);
    assert.match(missingRef.stderr || missingRef.stdout, /Could not resolve trusted origin branch, tag, or commit/i);

    const pullRef = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      "refs/pull/1/head"
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.notEqual(pullRef.status, 0);
    assert.match(pullRef.stderr || pullRef.stdout, /Pull request refs are not trusted preview deployment targets/i);

    assert.equal(spawnSync("git", ["checkout", "-b", "local-only"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    fs.writeFileSync(path.join(checkoutRepo, "local-only.txt"), "local only\n", "utf8");
    assert.equal(spawnSync("git", ["add", "local-only.txt"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "local-only"], { cwd: checkoutRepo, encoding: "utf8" }).status, 0);
    const unreachableSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: checkoutRepo, encoding: "utf8" });

    assert.equal(unreachableSha.status, 0, unreachableSha.stderr);

    const unreachableOutput = spawnSync(process.execPath, [
      tsxCli,
      path.join(repoRoot, "scripts/resolve-preview-ref.ts"),
      "--repository",
      EXPECTED_REPOSITORY,
      "--requested-ref",
      unreachableSha.stdout.trim()
    ], {
      cwd: checkoutRepo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    assert.notEqual(unreachableOutput.status, 0);
    assert.match(unreachableOutput.stderr || unreachableOutput.stdout, /not reachable from a trusted origin ref/i);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("preview workflows keep the requested SHA as source input while control scripts come from the trusted checkout", () => {
  const autoDeployWorkflow = read(".github/workflows/auto-deploy-preview.yml");
  const deployWorkflow = read(".github/workflows/deploy-preview.yml");
  const stopWorkflow = read(".github/workflows/stop-preview.yml");
  const deployWrapper = read("scripts/deploy-preview.ps1");
  const stopWrapper = read("scripts/stop-preview.ps1");

  assert.match(autoDeployWorkflow, /Check out trusted control checkout/);
  assert.match(autoDeployWorkflow, /Check out validated source SHA/);
  assert.match(autoDeployWorkflow, /VALIDATED_SHA: \$\{\{ needs\.resolve-auto-preview\.outputs\.validated_sha \}\}/);
  assert.match(autoDeployWorkflow, /REQUESTED_REF: \$\{\{ needs\.resolve-auto-preview\.outputs\.head_ref \}\}/);
  assert.match(autoDeployWorkflow, /-ResolvedSha \$env:VALIDATED_SHA/);
  assert.match(autoDeployWorkflow, /-RequestedRef \$env:REQUESTED_REF/);
  assert.match(autoDeployWorkflow, /-SourceCheckoutPath \(Join-Path \$PWD "\.\.\\source"\)/);
  assert.match(deployWorkflow, /Check out trusted workflow revision/);
  assert.match(deployWorkflow, /Check out requested source SHA/);
  assert.match(deployWorkflow, /-ControlCheckoutPath \$PWD/);
  assert.match(deployWorkflow, /-SourceCheckoutPath \(Join-Path \$PWD "\.\.\\source"\)/);
  assert.match(deployWorkflow, /Requested ref:/);
  assert.match(deployWorkflow, /Resolved SHA:/);
  assert.match(stopWorkflow, /Stop preview/);
  assert.doesNotMatch(stopWorkflow, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.match(deployWrapper, /ControlCheckoutPath/);
  assert.match(deployWrapper, /SourceCheckoutPath/);
  assert.match(stopWrapper, /ControlCheckoutPath/);
});

test("preview comment marker and body stay stable for repeated PR updates", () => {
  const comment = formatPreviewStatusComment({
    result: "ready",
    attemptedSha: "1111111111111111111111111111111111111111",
    headRef: "feature/e016-preview",
    ciRunUrl: "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/123456",
    deploymentRunUrl: "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/654321",
    timestamp: "2026-06-24T12:00:00.000Z"
  });

  assert.match(comment, new RegExp(PREVIEW_STATUS_COMMENT_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(comment, /Preview ready/);
  assert.match(comment, /Result: ready/);
  assert.match(comment, /URL: http:\/\/Serwer:3001/);
  assert.match(comment, /Commit: 1111111111111111111111111111111111111111/);
  assert.match(comment, /Branch: feature\/e016-preview/);
});

test("runner-side blocked states are documented separately from deployment failures", () => {
  const workflow = read(".github/workflows/auto-deploy-preview.yml");

  assert.match(workflow, /runner_revalidation_result=\$result/);
  assert.match(workflow, /Upsert PR preview comment as blocked after runner revalidation/);
  assert.match(workflow, /if: failure\(\) && steps\.revalidate\.outputs\.runner_revalidation_result == 'PASS'/);
  assert.match(workflow, /pull-requests: read/);
  assert.doesNotMatch(workflow, /pull-requests: write/);
  assert.doesNotMatch(workflow, /Verify production readiness/);
});

test("deploy preview dry-run validates the source checkout SHA independently from the control checkout", () => {
  const tmpRoot = createSystemTmpDir("clariobase-deploy-preview-");
  const sourceCheckout = path.join(tmpRoot, "source-checkout");
  const previewEnvDir = createSystemTmpDir("clariobase-deploy-preview-env-");
  const previewEnvFile = path.join(previewEnvDir, ".env.compose.preview.local");
  const currentHead = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });

  assert.equal(currentHead.status, 0);

  try {
    fs.rmSync(sourceCheckout, { recursive: true, force: true });
    fs.mkdirSync(sourceCheckout, { recursive: true });

    const initResult = spawnSync("git", ["init"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);

    const configEmail = spawnSync("git", ["config", "user.email", "codex@example.com"], {
      cwd: sourceCheckout,
      encoding: "utf8"
    });
    assert.equal(configEmail.status, 0, configEmail.stderr);

    const configName = spawnSync("git", ["config", "user.name", "Codex"], {
      cwd: sourceCheckout,
      encoding: "utf8"
    });
    assert.equal(configName.status, 0, configName.stderr);

    fs.writeFileSync(path.join(sourceCheckout, "README.md"), "source checkout test\n");
    let commitResult = spawnSync("git", ["add", "README.md"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(commitResult.status, 0, commitResult.stderr);
    commitResult = spawnSync("git", ["commit", "-m", "first"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(commitResult.status, 0, commitResult.stderr);

    fs.writeFileSync(path.join(sourceCheckout, "README.md"), "source checkout test v2\n");
    commitResult = spawnSync("git", ["add", "README.md"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(commitResult.status, 0, commitResult.stderr);
    commitResult = spawnSync("git", ["commit", "-m", "second"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(commitResult.status, 0, commitResult.stderr);

    const sourceHead = spawnSync("git", ["rev-parse", "HEAD"], { cwd: sourceCheckout, encoding: "utf8" });
    assert.equal(sourceHead.status, 0, sourceHead.stderr);

    fs.writeFileSync(
      previewEnvFile,
      [
        "CRM_BIND_ADDRESS=0.0.0.0",
        "CRM_HOST_PORT=3001",
        "AI_EXCHANGE_HOST_PATH=./data/ai-exchange-preview",
        "CRM_POSTGRES_DB=clariobase_crm_preview",
        "CRM_POSTGRES_USER=clariobase_crm_preview_user",
        "CRM_POSTGRES_PASSWORD=preview-password",
        "CRM_DATABASE_URL=postgresql://clariobase_crm_preview_user:preview-password@crm-postgres:5432/clariobase_crm_preview?schema=public"
      ].join("\n")
    );

    const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
    const result = spawnSync(process.execPath, [
      tsxCli,
      "scripts/deploy-preview.ts",
      "--dry-run",
      "--requested-ref",
      "feature/preview",
      "--control-checkout-path",
      repoRoot,
      "--source-checkout-path",
      sourceCheckout,
      "--resolved-sha",
      sourceHead.stdout.trim(),
      "--preview-env-file",
      previewEnvFile
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CRM_PREVIEW_IMAGE_REF: "ghcr.io/lukexd09/clariobase-ai-crm@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      }
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`"controlHeadSha":\\s*"${currentHead.stdout.trim()}"`));
    assert.match(result.stdout, new RegExp(`"sourceHeadSha":\\s*"${sourceHead.stdout.trim()}"`));
    assert.match(result.stdout, /"requestedRef":\s*"feature\/preview"/);
  } finally {
    fs.rmSync(previewEnvDir, { recursive: true, force: true });
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("stop preview dry-run uses a secret-free env file and a trusted control checkout", () => {
  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const result = spawnSync(process.execPath, [
    tsxCli,
    "scripts/stop-preview.ts",
    "--dry-run",
    "--requested-ref",
    "stop-preview",
    "--control-checkout-path",
    repoRoot
  ], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"controlCheckoutPath":\s*"/);
  assert.match(result.stdout, /"stopPlan":\s*\{/);
  assert.doesNotMatch(result.stdout, /CRM_PREVIEW_POSTGRES_PASSWORD/);
  assert.doesNotMatch(result.stdout, /\.env\.compose\.preview\.local/);
});
