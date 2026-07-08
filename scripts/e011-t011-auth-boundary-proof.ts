import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { DuplicateCandidateStatus } from "@/generated/prisma/client";
import { getAccessContext, getCurrentUser, requireUser, unauthorizedResult } from "@/lib/auth-context";
import { updateLeadAction } from "@/app/leads/actions";
import { createLeadActivityAction } from "@/app/leads/activity-actions";
import { updateDuplicateCandidateAction } from "@/app/duplicates/actions";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

const root = process.cwd();

function run(command: string, args: string[]) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: true
  });
}

async function main() {
  const t010 = run("corepack", ["pnpm", "e011:t010:proof"]);
  assert.equal(t010.status, 0, t010.stderr || t010.stdout);

  const inventory = readFileSync("docs/verification/e011-t011-boundary-inventory.md", "utf8");
  for (const expected of [
    "`/` | page | authenticated",
    "`/leads` | page | authenticated",
    "`/leads/[id]` | page | authenticated",
    "`/work` | page | authenticated",
    "`/duplicates` | page | authenticated",
    "`/duplicates/[id]` | page | authenticated",
    "`/imports` | page | authenticated",
    "`/imports/[id]` | page | authenticated",
    "`/reports/sales` | page | authenticated",
    "`src/app/layout.tsx` | layout | authenticated",
    "`src/app/not-found.tsx` | not-found | public",
    "`/sign-in` | page | public",
    "`/health` | page | operational-public",
    "`/api/ready` | route handler | operational-public",
    "`/api/auth/[...all]` | route handler | auth-owned"
  ]) {
    assert(inventory.includes(expected), `inventory missing ${expected}`);
  }

  assert.equal(await getCurrentUser(), null);
  assert.equal(await getAccessContext(), null);
  assert.equal(await requireUser().then(() => null, () => "unauthorized"), "unauthorized");
  assert.equal(unauthorizedResult().status, 401);
  assert.equal(getSafeRedirectPath("https://evil.example.com"), "/");
  assert.equal(getSafeRedirectPath("/leads?returnTo=https://evil.example.com"), "/");

  const leadUpdateResult = await updateLeadAction("missing-lead-id", new FormData());
  assert.equal(leadUpdateResult.status, 401);
  assert.equal(leadUpdateResult.ok, false);

  const activityResult = await createLeadActivityAction("missing-lead-id", new FormData());
  assert.equal(activityResult.status, 401);
  assert.equal(activityResult.ok, false);

  const duplicateResult = await updateDuplicateCandidateAction(
    "missing-candidate-id",
    DuplicateCandidateStatus.DISMISSED
  );
  assert.equal(duplicateResult, undefined);

  const currentUserShape = await getCurrentUser();
  assert.equal(currentUserShape, null);
  const accessContext = await getAccessContext();
  assert.equal(accessContext, null);

  const authContextSource = readFileSync("src/lib/auth-context.ts", "utf8");
  assert(authContextSource.includes("createAppAuth()"));
  assert(authContextSource.includes("auth.api.getSession"));
  assert(authContextSource.includes("organizationId: null"));
  assert(authContextSource.includes("workspaceId: null"));
  assert(authContextSource.includes("redirect(`/sign-in?returnTo="));
  assert(authContextSource.includes("throw new Error(\"Unauthorized\")"));

  const pagesAndActions = readFileSync("src/app/leads/actions.ts", "utf8");
  assert(pagesAndActions.includes("await requireUser()"));
  assert(pagesAndActions.includes("return unauthorizedResult()"));

  console.log("E011.T011 auth boundary proof: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
