import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const expectedRepository = "lukexd09/clariobase-ai-crm";
const headSha = "1111111111111111111111111111111111111111";

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function splitJobBlock(workflow: string, jobName: string, nextJobName?: string) {
  const start = workflow.indexOf(`  ${jobName}:`);
  if (start === -1) return "";
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

function extractResolverScript(workflow: string) {
  const stepStart = workflow.indexOf("      - name: Resolve current PR head and exact Fast CI run");
  assert.notEqual(stepStart, -1, "resolver step missing");
  const scriptMarker = "          script: |";
  const markerIndex = workflow.indexOf(scriptMarker, stepStart);
  assert.notEqual(markerIndex, -1, "resolver script missing");

  const scriptLines: string[] = [];
  const lines = workflow.slice(markerIndex + scriptMarker.length).replace(/^\r?\n/, "").split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith("            ")) {
      scriptLines.push(line.slice(12));
      continue;
    }
    if (line.trim() === "") {
      scriptLines.push("");
      continue;
    }
    break;
  }
  return scriptLines.join("\n");
}

type ResolverFixture = {
  expectedSha?: string;
  databaseMode?: string;
  resetConfirmation?: string;
  pull?: Record<string, unknown>;
  changedFiles?: Array<{ filename: string }>;
  runs?: Array<Record<string, unknown>>;
  artifacts?: Array<Record<string, unknown>>;
  artifactContext?: Record<string, unknown>;
  pullError?: Error;
};

async function executeWorkflowResolver(fixture: ResolverFixture = {}) {
  const workflow = read(".github/workflows/preview-release.yml");
  const resolverScript = extractResolverScript(workflow);
  const outputs: Record<string, string> = {};
  const paginateCalls: string[] = [];
  const pull = fixture.pull ?? {
    state: "open",
    html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/130",
    head: {
      sha: headSha,
      ref: "feature/rehearsal",
      repo: { full_name: expectedRepository }
    }
  };
  const runs = fixture.runs ?? [
    {
      id: 123456,
      name: "CI",
      event: "pull_request",
      status: "completed",
      conclusion: "success",
      head_sha: headSha,
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/actions/runs/123456"
    }
  ];
  const artifacts = fixture.artifacts ?? [{ id: 654321, name: "auto-preview-context", expired: false }];
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

  const listFiles = async () => undefined;
  const listWorkflowRuns = async () => undefined;
  const listWorkflowRunArtifacts = async () => undefined;
  const github = {
    rest: {
      pulls: {
        get: async () => {
          if (fixture.pullError) throw fixture.pullError;
          return { data: pull };
        },
        listFiles
      },
      actions: {
        listWorkflowRuns,
        listWorkflowRunArtifacts
      }
    },
    paginate: async (fn: unknown) => {
      if (fn === listFiles) {
        paginateCalls.push("files");
        return fixture.changedFiles ?? [{ filename: "README.md" }];
      }
      if (fn === listWorkflowRuns) {
        paginateCalls.push("runs");
        return runs;
      }
      if (fn === listWorkflowRunArtifacts) {
        paginateCalls.push("artifacts");
        return artifacts;
      }
      throw new Error("unexpected paginate target");
    },
    request: async () => ({ data: Buffer.from("fake-zip") })
  };
  const core = {
    setOutput: (name: string, value: unknown) => {
      outputs[name] = String(value ?? "");
    },
    warning: () => undefined
  };
  const fakeFs = {
    mkdtempSync: () => path.join(os.tmpdir(), "resolver-fixture"),
    writeFileSync: () => undefined,
    rmSync: () => undefined
  };
  const fakeRequire = (specifier: string) => {
    if (specifier === "node:fs") return fakeFs;
    if (specifier === "node:os") return os;
    if (specifier === "node:path") return path;
    if (specifier === "node:child_process") {
      return { execFileSync: () => JSON.stringify(artifactContext) };
    }
    throw new Error(`unexpected require: ${specifier}`);
  };

  const previous = {
    EXPECTED_REPOSITORY: process.env.EXPECTED_REPOSITORY,
    REQUESTED_PR_NUMBER: process.env.REQUESTED_PR_NUMBER,
    REQUESTED_EXPECTED_SHA: process.env.REQUESTED_EXPECTED_SHA,
    REQUESTED_DATABASE_MODE: process.env.REQUESTED_DATABASE_MODE,
    REQUESTED_RESET_CONFIRMATION: process.env.REQUESTED_RESET_CONFIRMATION,
    DISPATCH_REF: process.env.DISPATCH_REF
  };
  process.env.EXPECTED_REPOSITORY = expectedRepository;
  process.env.REQUESTED_PR_NUMBER = "130";
  process.env.REQUESTED_EXPECTED_SHA = fixture.expectedSha ?? headSha;
  process.env.REQUESTED_DATABASE_MODE = fixture.databaseMode ?? "preserve";
  process.env.REQUESTED_RESET_CONFIRMATION = fixture.resetConfirmation ?? "";
  process.env.DISPATCH_REF = "refs/heads/main";

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
      ...args: string[]
    ) => (...values: unknown[]) => Promise<void>;
    const run = new AsyncFunction("require", "github", "context", "core", resolverScript);
    await run(fakeRequire, github, { repo: { owner: "lukexd09", repo: "clariobase-ai-crm" } }, core);
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }

  return { outputs, paginateCalls };
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

test("Preview Release uses trusted manual dispatch and exact Fast CI correlation", () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const resolver = splitJobBlock(workflow, "resolve-preview-release", "report-blocked");

  assert.match(workflow, /^name: Preview Release$/m);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /database_mode:/);
  assert.match(workflow, /reset_confirmation:/);
  assert.doesNotMatch(workflow, /workflow_run:/);
  assert.doesNotMatch(workflow, /pull_request_target/);
  assert.match(workflow, /group: clariobase-preview-slot/);
  assert.match(resolver, /ref: main/);
  assert.match(resolver, /refs\/heads\/main/);
  assert.match(resolver, /workflow_id: "ci\.yml"/);
  assert.match(resolver, /head_sha: headSha/);
  assert.match(resolver, /auto-preview-context/);
  assert.match(resolver, /workflowRunId/);
  assert.match(resolver, /PR changes trusted preview control-plane files/);
  assert.match(resolver, /database_mode: "preserve"/);
});

test("the real workflow resolver accepts only an exact eligible request", async () => {
  const { outputs, paginateCalls } = await executeWorkflowResolver();

  assert.equal(outputs.resolution_status, "deploy");
  assert.equal(outputs.should_deploy, "true");
  assert.equal(outputs.pr_number, "130");
  assert.equal(outputs.validated_sha, headSha);
  assert.equal(outputs.database_mode, "preserve");
  assert.equal(outputs.reset_confirmation, "");
  assert.equal(outputs.ci_run_id, "123456");
  assert.deepEqual(paginateCalls, ["files", "runs", "artifacts"]);
});

test("the real workflow resolver blocks stale SHA, forks, closed PRs and protected controls", async () => {
  const stale = await executeWorkflowResolver({ expectedSha: "2222222222222222222222222222222222222222", databaseMode: "reset", resetConfirmation: "RESET PREVIEW DATABASE" });
  const fork = await executeWorkflowResolver({
    databaseMode: "reset",
    resetConfirmation: "RESET PREVIEW DATABASE",
    pull: {
      state: "open",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/130",
      head: { sha: headSha, ref: "feature/rehearsal", repo: { full_name: "someone/fork" } }
    }
  });
  const closed = await executeWorkflowResolver({
    databaseMode: "reset",
    resetConfirmation: "RESET PREVIEW DATABASE",
    pull: {
      state: "closed",
      html_url: "https://github.com/lukexd09/clariobase-ai-crm/pull/130",
      head: { sha: headSha, ref: "feature/rehearsal", repo: { full_name: expectedRepository } }
    }
  });
  const protectedChange = await executeWorkflowResolver({
    databaseMode: "reset",
    resetConfirmation: "RESET PREVIEW DATABASE",
    changedFiles: [{ filename: "scripts/deploy-preview.ts" }]
  });

  assert.match(stale.outputs.skip_reason, /expected_sha does not match/);
  assert.equal(stale.outputs.database_mode, "reset");
  assert.equal(stale.outputs.reset_confirmation, "");
  assert.match(fork.outputs.skip_reason, /head repository is not trusted/);
  assert.equal(fork.outputs.database_mode, "reset");
  assert.match(closed.outputs.skip_reason, /is not open/);
  assert.equal(closed.outputs.database_mode, "reset");
  assert.match(protectedChange.outputs.skip_reason, /trusted preview control-plane files/);
  assert.equal(protectedChange.outputs.database_mode, "reset");
  for (const result of [stale, fork, closed, protectedChange]) {
    assert.equal(result.outputs.resolution_status, "blocked");
    assert.equal(result.outputs.should_deploy, "false");
  }
});

test("the real workflow resolver blocks missing CI and every artifact provenance mismatch", async () => {
  const missingCi = await executeWorkflowResolver({ runs: [] });
  assert.match(missingCi.outputs.skip_reason, /no successful Fast CI run/);

  const mismatches = [
    { schemaVersion: 2 },
    { repository: "someone/fork" },
    { prNumber: 999 },
    { headSha: "2222222222222222222222222222222222222222" },
    { headRef: "feature/other" },
    { workflowRunId: 999999 }
  ];

  for (const mismatch of mismatches) {
    const execution = await executeWorkflowResolver({
      artifactContext: {
        schemaVersion: 1,
        repository: expectedRepository,
        prNumber: 130,
        headSha,
        headRef: "feature/rehearsal",
        headRepository: expectedRepository,
        baseRef: "main",
        baseRepository: expectedRepository,
        workflowRunId: 123456,
        ...mismatch
      }
    });
    assert.equal(execution.outputs.resolution_status, "blocked");
    assert.equal(execution.outputs.should_deploy, "false");
    assert.match(execution.outputs.skip_reason, /Fast CI context/);
  }
});

test("the real workflow resolver validates lifecycle inputs before deployment", async () => {
  const preserve = await executeWorkflowResolver({ databaseMode: "preserve", resetConfirmation: "" });
  const reset = await executeWorkflowResolver({ databaseMode: "reset", resetConfirmation: "RESET PREVIEW DATABASE" });
  const blankReset = await executeWorkflowResolver({ databaseMode: "reset", resetConfirmation: "" });
  const caseReset = await executeWorkflowResolver({ databaseMode: "reset", resetConfirmation: "reset preview database" });
  const invalidMode = await executeWorkflowResolver({ databaseMode: "wipe", resetConfirmation: "RESET PREVIEW DATABASE" });

  assert.equal(preserve.outputs.resolution_status, "deploy");
  assert.equal(preserve.outputs.database_mode, "preserve");
  assert.equal(preserve.outputs.reset_confirmation, "");
  assert.equal(reset.outputs.resolution_status, "deploy");
  assert.equal(reset.outputs.database_mode, "reset");
  assert.equal(reset.outputs.reset_confirmation, "RESET PREVIEW DATABASE");
  assert.equal(blankReset.outputs.resolution_status, "blocked");
  assert.equal(blankReset.outputs.database_mode, "reset");
  assert.match(blankReset.outputs.skip_reason, /reset_confirmation must exactly equal/);
  assert.equal(caseReset.outputs.resolution_status, "blocked");
  assert.equal(caseReset.outputs.database_mode, "reset");
  assert.match(caseReset.outputs.skip_reason, /reset_confirmation must exactly equal/);
  assert.equal(invalidMode.outputs.resolution_status, "blocked");
  assert.equal(invalidMode.outputs.database_mode, "preserve");
  assert.match(invalidMode.outputs.skip_reason, /database_mode must be preserve or reset/);
});

test("the real workflow resolver fails closed on GitHub API errors", async () => {
  const execution = await executeWorkflowResolver({ pullError: new Error("API unavailable") });

  assert.equal(execution.outputs.resolution_status, "blocked");
  assert.equal(execution.outputs.should_deploy, "false");
  assert.equal(execution.outputs.skip_reason, "BLOCKED: preview release resolver execution failed");
});

test("Preview Release preserves one-image, immutable-digest and Windows no-build sequencing", () => {
  const workflow = read(".github/workflows/preview-release.yml");
  const build = splitJobBlock(workflow, "build-preview-image", "report-deploying");
  const deploy = splitJobBlock(workflow, "deploy-preview", "report-final");

  assert.equal((build.match(/docker\/build-push-action/g) ?? []).length, 1);
  assert.match(build, /platforms: linux\/amd64/);
  assert.match(build, /load: true/);
  assert.match(build, /push: false/);
  assert.match(build, /cache-from: type=gha,scope=preview-image/);
  assert.match(build, /cache-to: type=gha,mode=max,scope=preview-image/);
  assertOrdered(build, "Smoke test immutable image", "Log in to GitHub Container Registry");
  assertOrdered(build, "Log in to GitHub Container Registry", "Push immutable preview image");
  assert.match(build, /Expected exactly one pushed registry digest/);
  assert.match(build, /sha256:\[0-9a-f\]\{64\}/);

  assert.match(deploy, /self-hosted/);
  assert.match(deploy, /ref: main/);
  assert.match(deploy, /stale validated SHA/);
  assert.match(deploy, /@sha256:/);
  assert.match(deploy, /scripts\\deploy-preview\.ps1|scripts\/deploy-preview\.ps1/);
  assert.match(deploy, /-ResetConfirmation \$env:RESET_CONFIRMATION/);
  assert.match(deploy, /service -ne "clariobase-ai-crm"/);
  assert.match(deploy, /status -ne "ready"/);
  assert.match(deploy, /checks\.database -ne "ok"/);
  assert.doesNotMatch(deploy, /docker build|docker compose build|--build/);
  assert.match(deploy, /Cleanup secrets and job artifacts/);
  assert.match(deploy, /Log out of GitHub Container Registry/);
  assert.match(splitJobBlock(workflow, "report-final"), /DATABASE_MODE/);
  assert.match(splitJobBlock(workflow, "report-final"), /Database mode:/);
  assert.match(splitJobBlock(workflow, "report-final"), /Database volume:/);
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
  assert.match(previewRelease, /protectedExactPaths = new Set\(\[/);
  assert.match(previewRelease, /\.github\/workflows\/auto-deploy-preview\.yml/);
  assert.match(previewRelease, /\.github\/workflows\/deploy-preview\.yml/);
  assert.match(previewRelease, /security tombstones/i);

  assert.doesNotMatch(previewRelease, /workflow_run:/);
  assert.doesNotMatch(previewRelease, /pull_request_target/);

  const ci = read(".github/workflows/ci.yml");
  assert.doesNotMatch(ci, /workflow_run:/);
  assert.doesNotMatch(ci, /pull_request_target/);
  const fullIntegration = read(".github/workflows/full-integration.yml");
  assert.doesNotMatch(
    fullIntegration,
    /^\s*(?:runs-on:\s*|-\s*)["']?self-hosted["']?\s*$/m
  );
  assert.doesNotMatch(
    fullIntegration,
    /^\s*(?:runs-on:\s*|-\s*)["']?clariobase-preview["']?\s*$/m
  );

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
  assert.match(workflow, /Result: \$result/);
  assert.match(workflow, /Database volume: `\$databaseVolume`/);
});
