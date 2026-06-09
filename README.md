# ClarioBase AI CRM

Self-hosted, file-based AI-assisted CRM for ClarioBase lead management, sales workflow, mini-audits, outreach preparation and future UGC pipeline support.

## Core idea

This is not intended to be a generic CRM. It is a lightweight operational CRM designed around:

- a lead harvester,
- a dedicated CRM PostgreSQL database,
- sales pipeline management,
- scoring and prioritization,
- mini-audits,
- manual ChatGPT-assisted analysis through structured file exchange.

## Selected technical direction

```text
Application: Next.js App Router
Language: TypeScript
Database: separate PostgreSQL database for CRM
ORM / migrations: Prisma
Validation: Zod
UI foundation: Tailwind CSS + shadcn/ui
Package manager: pnpm
AI integration v1: file-based exchange only, no AI API calls
```

## Work item coding

All epics and tasks use stable codes:

```text
E001 - Epic name
E001.T001 - Task name
```

See `docs/12-work-item-coding.md` for the full standard.

## Key principles

- CRM PostgreSQL database is the source of truth for CRM operational data.
- Harvester remains the lead acquisition/enrichment system.
- Harvester database and CRM database should be separate.
- CRM UI supports lead review, scoring, pipeline, tasks, activities and mini-audits.
- No external AI API in v1.
- AI collaboration is file-based through `ai_exchange`.
- All AI imports must be validated, previewed and manually approved before applying changes.
- Real lead data should not be committed to the repository by default.
- The system should support ClarioBase first, UGC outreach second, and only later evolve into a product.

## Initial scope

- Leads
- Contacts
- Pipeline statuses
- Scoring
- Activities
- Tasks
- Mini-audits
- AI export packs
- AI response import
- Basic reporting

## Required reading before implementation

Before starting any coding task, read:

- `docs/00-project-context.md`
- `docs/05-mvp-scope.md`
- `docs/08-codex-working-rules.md`
- `docs/09-ways-of-working.md`
- `docs/10-technical-stack-decision.md`
- `docs/12-work-item-coding.md`

For AI exchange work, also read:

- `docs/04-ai-file-exchange.md`
- `ai_exchange/schemas/ai_review_pack.schema.json`
- `ai_exchange/schemas/ai_response.schema.json`

For harvester integration work, first create/update:

- `docs/11-harvester-integration-analysis.md`

## Repository structure

```text
clariobase-ai-crm/
- docs/                 # Product, process and technical documentation
- ai_exchange/          # File-based AI exchange workspace
  - inbox/              # CRM-generated files for ChatGPT review
  - outbox/             # ChatGPT-generated files ready for CRM import
  - processed/          # Archived processed exchange files
  - rejected/           # Invalid or rejected exchange files
  - schemas/            # JSON schemas for file contracts
  - samples/            # Safe anonymized examples
- README.md
```

## Current status

Project foundation and implementation readiness phase.

## Local setup for the Next.js skeleton

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your local CRM database.
3. Generate Prisma Client with `pnpm prisma:generate`.
4. Validate the schema with `pnpm prisma:validate`.
5. If your local CRM database is available, create the initial migration with `pnpm prisma:migrate`.
6. Seed local fake data with `pnpm prisma:seed` if your local CRM database is available.
7. Start the app with `pnpm dev`.

## Available scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm test`
- `pnpm prisma:generate`
- `pnpm prisma:validate`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`

## Health check

Open `/health` after starting the app to verify the skeleton is running.
