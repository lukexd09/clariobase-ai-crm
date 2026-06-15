import process from "node:process";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_REPOSITORY = "lukexd09/clariobase-ai-crm";

type Options = {
  repository: string;
  requestedRef: string;
};

export function normalizeRequestedRef(requestedRef: string) {
  const trimmed = requestedRef.trim();

  if (!trimmed) {
    throw new Error("Requested ref must not be empty.");
  }

  if (trimmed.includes(":") || trimmed.includes("..") || trimmed.includes(" ") || trimmed.includes("\t")) {
    throw new Error(`Requested ref contains disallowed characters: ${requestedRef}`);
  }

  if (/^refs\/pull\//.test(trimmed) || trimmed.startsWith("pull/")) {
    throw new Error("Pull request refs are not trusted preview deployment targets.");
  }

  if (trimmed.startsWith("refs/heads/")) {
    return trimmed.replace(/^refs\/heads\//, "");
  }

  if (trimmed.startsWith("refs/tags/")) {
    return trimmed.replace(/^refs\/tags\//, "");
  }

  return trimmed;
}

export function assertTrustedRequestedRef(requestedRef: string, repository: string) {
  if (repository !== EXPECTED_REPOSITORY) {
    throw new Error(`Preview workflows may only run inside ${EXPECTED_REPOSITORY}, got ${repository}.`);
  }

  return normalizeRequestedRef(requestedRef);
}

function runGit(args: string[]) {
  return spawnSync("git", args, {
    encoding: "utf8",
    stdio: "pipe"
  });
}

function assertGitSuccess(result: ReturnType<typeof runGit>, description: string) {
  if (result.status !== 0) {
    throw new Error(`${description} failed: ${(result.stderr ?? result.stdout ?? "").trim()}`);
  }
}

function resolveRefOrSha(requestedRef: string) {
  if (/^[0-9a-f]{40}$/i.test(requestedRef)) {
    const containsResult = runGit(["branch", "-r", "--contains", requestedRef]);
    assertGitSuccess(containsResult, "git branch -r --contains");

    if (!containsResult.stdout.includes("origin/")) {
      throw new Error(`Requested commit SHA ${requestedRef} is not reachable from a trusted origin ref.`);
    }

    return requestedRef.toLowerCase();
  }

  const candidates = [
    `refs/remotes/origin/${requestedRef}^{commit}`,
    `refs/tags/${requestedRef}^{commit}`
  ];

  for (const candidate of candidates) {
    const result = runGit(["rev-parse", "--verify", candidate]);

    if (result.status === 0) {
      return result.stdout.trim().toLowerCase();
    }
  }

  throw new Error(`Could not resolve trusted origin branch, tag, or commit for requested ref: ${requestedRef}`);
}

function parseArgs(argv: string[]): Options {
  const parsed = {
    repository: "",
    requestedRef: ""
  } satisfies Options;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--repository") {
      parsed.repository = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--requested-ref") {
      parsed.requestedRef = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return parsed;
}

function writeGithubOutput(requestedRef: string, resolvedSha: string) {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    return;
  }

  const lines = [
    `requested_ref=${requestedRef}`,
    `resolved_sha=${resolvedSha}`
  ];

  const fs = require("node:fs") as typeof import("node:fs");
  fs.appendFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const trustedRequestedRef = assertTrustedRequestedRef(options.requestedRef, options.repository);

  const fetchResult = runGit([
    "fetch",
    "--force",
    "--no-tags",
    "origin",
    "+refs/heads/*:refs/remotes/origin/*",
    "+refs/tags/*:refs/tags/*"
  ]);
  assertGitSuccess(fetchResult, "git fetch trusted refs");

  const resolvedSha = resolveRefOrSha(trustedRequestedRef);
  writeGithubOutput(trustedRequestedRef, resolvedSha);

  console.log(
    JSON.stringify(
      {
        requestedRef: trustedRequestedRef,
        resolvedSha
      },
      null,
      2
    )
  );
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedScriptPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (currentFilePath === invokedScriptPath) {
  main();
}
