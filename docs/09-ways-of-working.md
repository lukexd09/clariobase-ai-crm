# Ways of Working

This document defines how we work on ClarioBase AI CRM. It is based on the working style developed during the harvester work: structured epics, explicit context, small changes, Codex execution, ChatGPT review, user approval and controlled merge.

## Core working model

```text
User defines business need
  ↓
ChatGPT challenges assumptions and shapes scope
  ↓
ChatGPT creates or refines epic/task
  ↓
Codex implements in a branch
  ↓
Codex creates or updates PR
  ↓
ChatGPT reviews PR diff and risks
  ↓
User tests locally
  ↓
Regression checklist is executed
  ↓
User merges only after explicit approval
```

## Work item coding

All epics and tasks must follow `docs/12-work-item-coding.md`.

Required title format:

```text
E001 - Epic name
E001.T001 - Task name
```

Rules:

- Every implementation task must belong to an epic.
- Epic IDs are sequential and stable.
- Task IDs are scoped to the epic.
- Branch and PR names must include the work item code.
- Codex prompts must start with the work item code and title.

## Non-negotiable principles

- Do not start coding from vague ideas.
- Every meaningful change must be tied to an issue or documented task.
- Codex must receive narrow, explicit prompts.
- Changes should be small enough to review.
- No silent architecture changes.
- Selected stack is Next.js App Router, TypeScript, PostgreSQL, Prisma, Zod, Tailwind CSS and shadcn/ui.
- Do not replace the selected stack with a temporary MVP stack.
- CRM and harvester databases must remain separate.
- No direct mutation of harvester tables from CRM.
- No destructive database changes without explicit migration plan and rollback note.
- No real lead data in Git by default.
- No external AI API calls in v1.
- No automatic outreach sending in v1.
- User approval is required before merge.
- Codex must create a PR or update the existing PR before considering a task finished.

## Roles

## User

The user is the product owner and final approver.

Responsibilities:

- decides business priority,
- runs local tests when needed,
- checks whether the feature makes operational sense,
- approves merge,
- provides real data samples only when necessary and sanitized when possible.

## ChatGPT

ChatGPT acts as product/technical partner and reviewer.

Responsibilities:

- challenges unclear or risky assumptions,
- writes epics and task breakdowns,
- prepares Codex prompts,
- reviews PRs/diffs,
- creates test and regression checklists,
- validates whether implementation matches the business process,
- keeps the project focused on MVP.

## Codex

Codex is the implementation agent.

Responsibilities:

- reads required documentation before coding,
- implements only the requested scope,
- works on a branch named with the work item code,
- creates a PR or updates the existing PR for the same work item,
- explains changed files,
- provides test commands and results,
- avoids unrelated refactoring,
- flags blockers instead of guessing.

## Pull request requirement

A task is not finished until Codex has created or updated a pull request.

Required behavior:

- If no PR exists for the work item, Codex must create one.
- If a PR already exists for the work item, Codex must push changes to the same branch and update the PR description or add a comment.
- PR title must use the work item code, for example `E001.T001 - Initialize Next.js technical skeleton`.
- PR body must include summary, scope, out of scope, changed files, test commands and regression checklist.
- Codex must share the PR link after finishing.

PRs are the mandatory checkpoint for ChatGPT review and user approval. Direct commits to `main` are not acceptable for implementation work unless the user explicitly requests it.

## Definition of Ready

An epic or task is ready for Codex only when it has:

- work item code,
- clear goal,
- business context,
- technical context,
- explicit scope,
- out-of-scope section,
- acceptance criteria,
- files/modules likely affected if known,
- test expectations,
- regression risks,
- rollback considerations if data or migrations are involved.

If these are missing, ChatGPT should refine the task before Codex starts.

## First coding PR readiness

The first coding PR must be limited to implementation readiness.

In scope:

- initialize Next.js App Router with TypeScript,
- configure pnpm,
- configure Tailwind CSS,
- prepare shadcn/ui foundation if it can be done safely,
- configure Prisma without real credentials,
- add `.env.example`,
- add basic health/status page or route,
- add basic test/lint commands,
- update local setup instructions.

Out of scope:

- CRM feature screens,
- real lead data,
- harvester import/sync,
- AI exchange implementation,
- auth,
- Docker hardening,
- deployment automation,
- multi-tenant support.

## Epic template

```markdown
# E001 - <epic name>

## Goal

## Background / context

## Source of truth

## Scope

## Out of scope

## Functional requirements

## Technical requirements

## Data requirements

## UX requirements

## Acceptance criteria

## Child tasks

- `E001.T001 - <task name>`

## Test plan

## Regression checklist

## Risks and open questions
```

## Task template

```markdown
# E001.T001 - <task name>

Parent epic: E001 - <epic name>

## Goal

## Context

## Scope

## Out of scope

## Acceptance criteria

## Test instructions

## Notes for Codex
```

## Codex prompt template

```text
Work item: E001.T001 - <task name>

You are working in the `clariobase-ai-crm` repository.

Read first:
- docs/00-project-context.md
- docs/05-mvp-scope.md
- docs/08-codex-working-rules.md
- docs/09-ways-of-working.md
- docs/10-technical-stack-decision.md
- docs/12-work-item-coding.md
- <other relevant docs>

Task:
<clear task description>

Scope:
- <item 1>
- <item 2>

Out of scope:
- <item 1>
- <item 2>

Constraints:
- Use the selected stack: Next.js App Router, TypeScript, PostgreSQL, Prisma, Zod, Tailwind CSS and shadcn/ui.
- Use a dedicated CRM database; do not mutate harvester tables.
- Do not add external AI API calls.
- Do not commit real lead data.
- Do not change unrelated files.
- Keep the change small and reviewable.
- Create a PR or update the existing PR for this work item before finishing.

Acceptance criteria:
- <criterion 1>
- <criterion 2>

Before finishing:
- list changed files,
- explain key decisions,
- provide test commands,
- create/update PR and share PR link,
- mention anything not completed.
```

## Branching and PR rules

Preferred flow:

```text
main
  ↓
feature/e001-t001-nextjs-skeleton
  ↓
PR: E001.T001 - Initialize Next.js technical skeleton
  ↓
review
  ↓
local test
  ↓
merge
```

Rules:

- `main` should remain stable.
- One PR should solve one clear problem.
- Do not mix documentation, architecture, feature work and unrelated cleanup in one PR unless explicitly agreed.
- PR title must include the task code.
- PR description must explain what changed and how to test it.
- Large PRs should be split.
- Codex must not finish by only committing to a branch; it must create or update the PR.

## PR description template

```markdown
## Work item

E001.T001 - <task name>

## Summary

- 

## Scope

- 

## Out of scope

- 

## Changed files

- 

## How to test

1. 
2. 
3. 

## Regression checklist

- [ ] Existing app starts
- [ ] No real data committed
- [ ] No secrets committed
- [ ] No external AI API calls added
- [ ] CRM database remains separate from harvester database
- [ ] Harvester tables are not mutated

## Risks / notes

- 
```

## Review process

ChatGPT review should check:

- Does the change match the issue?
- Did Codex read and respect the relevant docs?
- Are there unrelated changes?
- Are there hidden scope expansions?
- Are database changes safe?
- Does the change preserve separate CRM and harvester database boundaries?
- Is error handling sufficient?
- Are tests or manual checks provided?
- Does this create future product debt?

User review should check:

- Does it work locally?
- Does the workflow feel practical?
- Is the UI understandable?
- Is this useful for ClarioBase now?
- Is anything overbuilt?

## Definition of Done

A task is done only when:

- acceptance criteria are met,
- a PR exists or the existing PR has been updated,
- implementation is reviewed,
- test instructions were followed or consciously skipped with reason,
- regression checklist passes,
- documentation is updated if behavior changed,
- no real lead data or secrets are committed,
- user approves merge.

## Testing strategy

Minimum for every change:

- App starts.
- No obvious console/runtime errors.
- Relevant page or command works.
- No secrets or real lead data were committed.

Backend/data changes:

- Migration applies cleanly.
- Migration can be reasoned about safely.
- Existing data is not destroyed.
- New fields have sensible defaults or nullable strategy.
- Import/export paths are tested with sample files.
- CRM database remains separate from harvester database.

AI exchange changes must fail safely when given malformed files, unknown IDs, invalid decisions or attempts to modify protected fields.

UI changes must include manual checks for page load, empty states, loading states, validation messages and destructive action confirmations.

## Documentation rules

Update docs when:

- workflow changes,
- data model changes,
- AI exchange contract changes,
- MVP scope changes,
- technical stack decisions change,
- database boundary decisions change,
- work item coding changes,
- PR workflow changes,
- a major decision is made,
- Codex needs a new rule to avoid repeating a mistake.

Important docs:

- `docs/00-project-context.md` - why project exists,
- `docs/03-data-model.md` - data model direction,
- `docs/04-ai-file-exchange.md` - AI exchange contract,
- `docs/05-mvp-scope.md` - current scope boundaries,
- `docs/07-decisions-log.md` - architecture/product decisions,
- `docs/08-codex-working-rules.md` - rules for coding agents,
- `docs/09-ways-of-working.md` - team process,
- `docs/10-technical-stack-decision.md` - selected implementation stack,
- `docs/11-harvester-integration-analysis.md` - required before harvester sync,
- `docs/12-work-item-coding.md` - epic/task/branch/PR naming convention.

## Scope control rules

When Codex suggests extra work, classify it:

```text
Must have now
Should do soon
Nice to have later
Do not do
```

Only `Must have now` belongs in the current task.

## Product discipline

The strongest risk is overbuilding. The CRM should first prove that it helps ClarioBase convert harvested leads into conversations and clients.

Do not build generic CRM features, multi-tenant SaaS, complex permissions, automated campaigns, email inbox, billing, advanced analytics or UGC UI until the ClarioBase MVP workflow is working and useful.

## Standard conversation pattern

1. User describes need.
2. ChatGPT challenges and narrows scope.
3. ChatGPT writes or updates issue.
4. ChatGPT creates Codex prompt.
5. User runs Codex.
6. Codex implements on branch.
7. Codex creates or updates PR.
8. ChatGPT reviews PR.
9. User tests locally.
10. Fixes are requested if needed.
11. User merges.

## Lessons carried over from harvester work

- Big vague tasks create confusion.
- Clear file paths and exact expected outputs help Codex a lot.
- Codex needs explicit out-of-scope boundaries.
- Existing working flows must be protected from accidental breakage.
- UI labels and operational wording matter because the tool is used by a real operator.
- Manual checkpoints are better than premature full automation.
- The user should stay in control of merge and production data.
