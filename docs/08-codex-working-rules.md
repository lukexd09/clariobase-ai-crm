# Codex Working Rules

This document defines how Codex or another coding assistant should work on this repository.

For the full team process, use `docs/09-ways-of-working.md` as the source of truth.

## General rules

- Do not invent broad CRM features outside the documented MVP scope.
- Read `docs/00-project-context.md` before planning implementation.
- Read `docs/09-ways-of-working.md` before starting implementation work.
- Read `docs/04-ai-file-exchange.md` before touching AI exchange logic.
- Preserve PostgreSQL as the source of truth.
- Do not add external AI API calls in v1.
- Do not implement automatic message sending in v1.
- Prefer small, reviewable changes.
- Work from a clear issue/task and keep the change within scope.
- Provide changed files, test commands and known limitations before finishing.

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

## UX priority

The app is for a solo operator. Optimize for:

- fast daily review,
- clear next actions,
- low cognitive load,
- minimal manual duplication,
- reliable follow-up discipline.

## Product warning

Do not build a generic CRM clone. Build the smallest useful sales operating system for ClarioBase first.
