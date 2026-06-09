# Technical Stack Decision

## Decision date

2026-06-09

## Decision

ClarioBase AI CRM will be built as a fullstack Next.js application using TypeScript, PostgreSQL and Prisma.

The CRM will use a separate PostgreSQL database from the harvester database. The harvester remains the lead acquisition system. The CRM database becomes the operational sales system of record for CRM-specific data.

## Selected stack

```text
Application: Next.js App Router
Language: TypeScript
Database: PostgreSQL
ORM / migrations: Prisma
Validation: Zod
UI foundation: Tailwind CSS + shadcn/ui
Package manager: pnpm
Testing: Vitest for unit/integration tests; Playwright later for E2E tests
Deployment target v1: local/self-hosted Docker-ready app
AI integration v1: file-based exchange only, no AI API calls
```

## Why Next.js

The project should not use a temporary MVP-only stack that would likely be replaced later. Next.js is a better fit for the long-term direction because the CRM is expected to become:

- a modern web application,
- a product-like UI rather than an admin-only tool,
- a possible future SaaS or productized internal tool,
- a system with rich tables, filters, forms and workflow screens,
- a single cohesive fullstack application.

## Why not Django for this project

Django would be faster for a simple internal admin-style MVP, but it could become a transitional stack if the product later needs a more modern CRM UI. Since the user prefers to avoid rewriting the product after MVP, Django is not selected as the primary stack.

## Why Prisma

Prisma is selected because it gives:

- readable data model definition,
- straightforward migrations,
- good fit for relational CRM data,
- predictable TypeScript integration,
- implementation clarity for Codex.

Drizzle may be considered in the future only if there is a clear reason to prefer more SQL-like control. For v1, Prisma is the default.

## Database strategy

The CRM will use a separate PostgreSQL database.

Preferred local database names:

```text
clariobase_harvester   # existing or current harvester database
clariobase_crm         # new CRM database
```

Data flow:

```text
Harvester DB
  ↓ import/sync
CRM DB
  ↓ CRM UI and AI exchange
User workflow
```

## Reason for separate CRM database

A separate CRM database reduces the risk of breaking the working harvester. It also creates a clean boundary between:

- lead acquisition and enrichment,
- sales workflow and CRM operations.

The CRM should not directly mutate harvester tables. Integration should happen through a documented import/sync contract.

## Harvester integration principle

Before implementing synchronization, the current harvester database structure must be inspected and documented.

Expected document:

```text
docs/11-harvester-integration-analysis.md
```

The analysis should define:

- source tables,
- source fields,
- CRM mapping,
- deduplication strategy,
- customer ID handling,
- refresh metadata handling,
- import/sync direction,
- risks and open questions.

## Architecture direction

Initial architecture:

```text
Next.js App Router
  ├── Server Components for read-heavy views
  ├── Server Actions or Route Handlers for mutations
  ├── Prisma for database access
  ├── Zod for input and AI file validation
  ├── Tailwind/shadcn for UI
  └── local file system for AI exchange folders
```

Avoid adding a separate backend service in v1 unless a strong need appears.

## First implementation target

The first coding PR should only create the technical skeleton.

In scope for first coding PR:

- initialize Next.js with TypeScript,
- configure Tailwind,
- configure ESLint,
- add Prisma,
- add `.env.example`,
- add basic database connection setup,
- add health/status page or route,
- add basic test setup,
- update local setup instructions.

Out of scope for first coding PR:

- CRM feature screens,
- harvester import,
- AI exchange implementation,
- auth,
- deployment automation,
- production Docker hardening,
- real lead data.

## Constraints for Codex

- Do not introduce external AI API calls.
- Do not add real lead data.
- Do not connect directly to harvester tables without a documented integration contract.
- Do not implement generic CRM features outside MVP.
- Do not build multi-tenant SaaS support in v1.
- Keep the initial implementation small and reviewable.

## Open but non-blocking decisions

These do not block the first coding PR:

- exact auth solution,
- final deployment target,
- visual design system details,
- final harvester sync mechanism,
- E2E test coverage level,
- future SaaS/multi-workspace model.
