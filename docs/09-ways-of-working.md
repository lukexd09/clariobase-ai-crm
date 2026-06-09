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
Codex implements in a branch/PR
  ↓
ChatGPT reviews diff and risks
  ↓
User tests locally
  ↓
Regression checklist is executed
  ↓
User merges only after explicit approval
```

## Non-negotiable principles

- Do not start coding from vague ideas.
- Every meaningful change must be tied to an issue or documented task.
- Codex must receive narrow, explicit prompts.
- Changes should be small enough to review.
- No silent architecture changes.
- No destructive database changes without explicit migration plan and rollback note.
- No real lead data in Git by default.
- No external AI API calls in v1.
- No automatic outreach sending in v1.
- User approval is required before merge.

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
- explains changed files,
- provides test commands and results,
- avoids unrelated refactoring,
- flags blockers instead of guessing.

## Definition of Ready

An epic or task is ready for Codex only when it has:

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

## Epic template

Use this structure for larger work packages.

```markdown
# Epic: <name>

## Goal

What business or technical outcome should this epic achieve?

## Background / context

Why this matters and what previous decisions must be respected.

## Source of truth

Required docs to read before implementation:

- `docs/...`
- related issues
- relevant existing modules

## Scope

What must be included.

## Out of scope

What must not be included, even if tempting.

## Functional requirements

Concrete behavior expected from the system.

## Technical requirements

Architecture, database, file, security and integration constraints.

## Data requirements

Tables, fields, migrations, import/export contracts, sample data.

## UX requirements

Expected screens, buttons, flows, validation and user feedback.

## Acceptance criteria

Checklist that must be true before the epic can be considered done.

## Test plan

Manual and automated tests expected.

## Regression checklist

Existing flows that must still work.

## Risks and open questions

Known uncertainties or decisions needed before/during work.
```

## Task template

Use this for smaller implementation tasks.

```markdown
# Task: <name>

## Goal

## Context

## Scope

## Out of scope

## Acceptance criteria

## Test instructions

## Notes for Codex
```

## Codex prompt template

Prompts to Codex should be specific and bounded. Avoid asking Codex to "build the CRM" or "improve the app".

Recommended format:

```text
You are working in the `clariobase-ai-crm` repository.

Read first:
- docs/00-project-context.md
- docs/05-mvp-scope.md
- docs/08-codex-working-rules.md
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
- Do not add external AI API calls.
- Do not commit real lead data.
- Do not change unrelated files.
- Keep the change small and reviewable.

Acceptance criteria:
- <criterion 1>
- <criterion 2>

Before finishing:
- list changed files,
- explain key decisions,
- provide test commands,
- mention anything not completed.
```

## Bad Codex prompts

Avoid prompts like:

```text
Build the CRM app.
```

```text
Add AI to this project.
```

```text
Make the UI nicer.
```

```text
Refactor the database.
```

They are too broad and invite uncontrolled changes.

## Good Codex prompts

Good prompts are narrow:

```text
Implement JSON schema validation for files placed in `ai_exchange/outbox`. Validate against `ai_exchange/schemas/ai_response.schema.json`, return readable errors, and do not apply any CRM changes yet.
```

```text
Create the initial `leads` table migration based on `docs/03-data-model.md`, but include only fields required for MVP lead list and lead detail. Do not add UGC-specific fields yet.
```

```text
Add a read-only lead list page that displays business name, city, category, status, priority, score and next action date. No editing in this task.
```

## Branching and PR rules

Preferred flow:

```text
main
  ↓
feature/<short-description>
  ↓
PR
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
- PR description must explain what changed and how to test it.
- Large PRs should be split.

## PR description template

```markdown
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
- [ ] Existing lead list/detail still works
- [ ] No real data committed
- [ ] No secrets committed
- [ ] No external AI API calls added
- [ ] AI exchange schemas/samples still valid if touched

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
- implementation is reviewed,
- test instructions were followed or consciously skipped with reason,
- regression checklist passes,
- documentation is updated if behavior changed,
- no real lead data or secrets are committed,
- user approves merge.

## Testing strategy

## Minimum for every change

- App starts.
- No obvious console/runtime errors.
- Relevant page or command works.
- No secrets or real lead data were committed.

## Backend/data changes

- Migration applies cleanly.
- Migration can be reasoned about safely.
- Existing data is not destroyed.
- New fields have sensible defaults or nullable strategy.
- Import/export paths are tested with sample files.

## AI exchange changes

Test with:

- valid sample response,
- malformed JSON,
- wrong schema version,
- unknown `batch_id`,
- unknown `lead_id`,
- invalid `decision`,
- attempt to modify protected fields,
- empty `items` array.

AI import must fail safely.

## UI changes

Manual checks:

- page loads,
- empty state works,
- loading state works if applicable,
- validation messages are understandable,
- primary action is clear,
- destructive actions require confirmation.

## Regression checklist

Before merge, check relevant items:

```markdown
- [ ] App starts locally
- [ ] Database connection works
- [ ] Lead list still loads
- [ ] Lead detail still loads
- [ ] Status update still works
- [ ] Task/activity flow still works if touched
- [ ] AI export still creates valid file if touched
- [ ] AI import still validates sample response if touched
- [ ] No `.env` or secrets committed
- [ ] No real lead data committed
- [ ] No external AI API dependency added
- [ ] No automatic outreach sending added
```

## Database change rules

- Every schema change must be documented.
- Every migration must explain intent.
- Avoid destructive migrations in early MVP.
- Prefer additive changes unless cleanup is explicitly planned.
- Do not rename/drop columns without a migration and fallback plan.
- Do not change `customer_id` semantics casually.
- Do not use Google Place ID as the main business key.

## Documentation rules

Update docs when:

- workflow changes,
- data model changes,
- AI exchange contract changes,
- MVP scope changes,
- a major decision is made,
- Codex needs a new rule to avoid repeating a mistake.

Important docs:

- `docs/00-project-context.md` - why project exists,
- `docs/03-data-model.md` - data model direction,
- `docs/04-ai-file-exchange.md` - AI exchange contract,
- `docs/05-mvp-scope.md` - current scope boundaries,
- `docs/07-decisions-log.md` - architecture/product decisions,
- `docs/08-codex-working-rules.md` - rules for coding agents,
- `docs/09-ways-of-working.md` - team process.

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

Do not build:

- generic CRM features,
- multi-tenant SaaS,
- complex permissions,
- automated campaigns,
- email inbox,
- billing,
- advanced analytics,
- UGC UI,

until the ClarioBase MVP workflow is working and useful.

## Standard conversation pattern

When starting a new piece of work:

1. User describes need.
2. ChatGPT challenges and narrows scope.
3. ChatGPT writes or updates issue.
4. ChatGPT creates Codex prompt.
5. User runs Codex.
6. Codex creates PR or patch.
7. ChatGPT reviews result.
8. User tests locally.
9. Fixes are requested if needed.
10. User merges.

## Lessons carried over from harvester work

- Big vague tasks create confusion.
- Clear file paths and exact expected outputs help Codex a lot.
- Codex needs explicit out-of-scope boundaries.
- Existing working flows must be protected from accidental breakage.
- UI labels and operational wording matter because the tool is used by a real operator.
- Manual checkpoints are better than premature full automation.
- The user should stay in control of merge and production data.
