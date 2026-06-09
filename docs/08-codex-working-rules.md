# Codex Working Rules

This document defines how Codex or another coding assistant should work on this repository.

For the full team process, use `docs/09-ways-of-working.md` as the source of truth.

## General rules

- Do not invent broad CRM features outside the documented MVP scope.
- Read `docs/00-project-context.md` before planning implementation.
- Read `docs/09-ways-of-working.md` before starting implementation work.
- Read `docs/10-technical-stack-decision.md` before coding.
- Read `docs/12-work-item-coding.md` before creating branches, PRs or task references.
- Read `docs/04-ai-file-exchange.md` before touching AI exchange logic.
- Every implementation task must use a work item code such as `E001.T001`.
- Branches, PRs and Codex prompts should include the work item code.
- Codex must create a PR or update the existing PR for the work item before considering the task finished.
- Codex must share the PR link after finishing.
- Preserve the dedicated CRM PostgreSQL database as the CRM source of truth.
- Keep harvester and CRM databases separate.
- Do not mutate harvester tables directly.
- Do not add external AI API calls in v1.
- Do not implement automatic message sending in v1.
- Prefer small, reviewable changes.
- Work from a clear issue/task and keep the change within scope.
- Provide changed files, test commands and known limitations before finishing.

## Selected stack rules

The selected implementation stack is:

```text
Next.js App Router
TypeScript
PostgreSQL
Prisma
Zod
Tailwind CSS + shadcn/ui
pnpm
```

Codex must not replace this with a temporary MVP stack unless the user explicitly changes the decision.

## Pull request rules

A task is not finished until there is a pull request.

Rules:

- If no PR exists for the work item, create one.
- If a PR already exists for the work item, update the existing PR instead of creating a duplicate.
- PR title must include the work item code, for example `E001.T001 - Initialize Next.js technical skeleton`.
- PR description must include summary, scope, out of scope, changed files, test commands and regression checklist.
- Direct commits to `main` are not acceptable for implementation work unless the user explicitly requests it.

## Data safety rules

- Do not commit real lead exports.
- Do not commit secrets.
- Do not commit `.env` files.
- Treat files in `ai_exchange/inbox`, `outbox`, `processed` and `rejected` as local runtime data.
- Only schemas and anonymized samples should be committed.

## AI import rules

Any implementation of AI response import must include:

1. Schema validation.
2. Batch ID validation.
3. Lead ID validation.
4. Preview before applying.
5. Manual approval.
6. Clear error handling.
7. No direct update of protected fields.

## Harvester integration rules

Before implementing harvester import/sync, create or update:

```text
docs/11-harvester-integration-analysis.md
```

The CRM must not directly mutate harvester tables. Integration should be import/sync based and explicitly documented.

## UX priority

The app is for a solo operator. Optimize for:

- fast daily review,
- clear next actions,
- low cognitive load,
- minimal manual duplication,
- reliable follow-up discipline.

## Product warning

Do not build a generic CRM clone. Build the smallest useful sales operating system for ClarioBase first.
