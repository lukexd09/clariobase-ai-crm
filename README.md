# ClarioBase AI CRM

Self-hosted, file-based AI-assisted CRM for ClarioBase lead management, sales workflow, mini-audits, outreach preparation, offer drafting and future UGC pipeline support.

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
- CRM UI supports lead review, scoring, pipeline, tasks, activities, mini-audits and outreach drafts.
- CRM UI also supports offer drafts for manual commercial preparation.
- No external AI API in v1.
- AI collaboration is file-based through `data/ai-exchange/`.
- All AI imports must be validated and manually reviewed before applying changes.
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
- Outreach drafts
- Offer drafts
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
- `data/ai-exchange/inbox/sample-prepared-leads.json`

For harvester integration work, first create/update:

- `docs/11-harvester-integration-analysis.md`

For the E007 lead detail operator workspace redesign, also read the binding Stitch reference set:

- `docs/design/stitch/operator-workspace/`

For the E009 light CRM homepage and future screen-by-screen visual work, also read:

- `docs/design/light-crm-visual-direction.md`

For the E014 containerized runtime foundation, also read:

- `docs/runtime/container-runtime.md`
- `docs/runtime/container-image.md`
- `docs/decisions/adr-e014-container-runtime.md`
- `.env.compose.example` for the safe Compose variable contract and optional `docker compose --env-file .env.compose.example ...` flow

## Repository structure

```text
clariobase-ai-crm/
- docs/                 # Product, process and technical documentation
- data/ai-exchange/     # Local file exchange workspace
  - inbox/              # Prepared files waiting for validation
  - processing/         # Optional manual staging area
  - outbox/             # Exported CRM files for review or ChatGPT preparation
  - archive/            # Archived exchange files
  - error/              # Invalid or rejected files
- README.md
```

## Current status

Post-UI implementation, workflow stabilization, and light CRM visual foundation phase.

Implemented now:

- lead list and lead detail,
- the lead detail operator workspace,
- the daily sales workbench,
- sales reporting,
- import audit and duplicate review,
- file-based AI export and validation.
- a light CRM homepage that introduces the new business-friendly visual direction.
- a shared light CRM app shell with left navigation on the main CRM screens.

## App shell

The main CRM screens use a shared light shell with grouped left navigation on desktop.
Business work entries stay higher priority than system entries.
The homepage now acts as the Dashboard entry screen inside the shell.

## Sales workbench

Open `/work` to see the first daily sales workbench. It groups actionable leads into overdue, due today, upcoming, and no-next-action buckets, and links each record to the existing quick update form on the lead detail page.

## Sales reporting

Open `/reports/sales` for a text-based operational summary of lead status usage, workbench health, draft readiness, and activity volume. It is intentionally lightweight and does not use charts.

## Activity timeline

Each lead detail page includes a lightweight activity timeline and a manual activity form for logging notes, calls, messages, and other interaction types. Seed data includes fake demo activities for local development.

## Local setup for the Next.js skeleton

1. Install dependencies with `pnpm install`.
2. Create a local `.env.local` file.
3. Set `DATABASE_URL` to your local `clariobase_crm` PostgreSQL database.
4. Do not commit `.env.local`.
5. Generate Prisma Client with `pnpm prisma:generate`.
6. Validate the schema with `pnpm prisma:validate`.
7. If your local CRM database is available, create the initial migration with `pnpm prisma:migrate`.
8. Seed local fake data with `pnpm prisma:seed` if your local CRM database is available.
9. Start the app with `pnpm dev`.

## Available scripts

- `pnpm dev` - start the Next.js app locally
- `pnpm build` - create a production build
- `pnpm start` - run the production server
- `pnpm lint` - run ESLint
- `pnpm test` - run the Node test suite
- `pnpm docker:test-image` - build and smoke-test the production CRM image
- `pnpm prisma:generate` - generate Prisma Client
- `pnpm prisma:validate` - validate the Prisma schema
- `pnpm prisma:migrate` - apply local CRM migrations
- `pnpm prisma:seed` - seed fake local CRM data
- `pnpm leads:import` - import a local JSON lead file
- `pnpm leads:detect-duplicates` - scan leads for likely duplicates
- `pnpm ai:export-leads` - export local CRM context to `data/ai-exchange/outbox/`
- `pnpm ai:validate-import-file` - validate a prepared AI import file before import

## Health check

Open `/health` after starting the app to verify the skeleton is running.
`/health` is the current HTTP liveness check.
The approved container runtime contract and planned database readiness semantics for E014 are documented in `docs/runtime/container-runtime.md`.

## Lead activity, mini-audit, outreach and offer drafts

Open a lead in `/leads/[id]` to work with:

- the quick operational update form,
- the activity timeline,
- mini-audit drafts,
- outreach drafts,
- offer drafts.

Safety rules:

- No additional Prisma models beyond the sales workflow foundation are introduced for activities, mini-audits, outreach drafts or offer drafts.
- Offer drafts remain local CRM records only and do not send, export or execute a commercial workflow automatically.
- Drafts are local CRM records only and do not send email, Instagram or other outbound messages.
- The existing lead detail page remains the place where operators review and save these records.

## Local import

Import a local JSON file with fake lead data:

```bash
corepack pnpm leads:import ./data/import/sample-leads.json
```

Safety rules:

- Use fake data only.
- Do not commit `.env.local`.
- Do not mutate the harvester database.
- Re-imports do not overwrite operational CRM fields like status, priority, package fit or next action date.
- The importer validates rows and rejects invalid ones with clear reasons.
- The import is idempotent by `source + sourceRecordId` when available, then by `customerId`.

After importing, review the audit trail in the app:

- `/imports` for the batch list
- `/imports/[id]` for row-level results and lead links

## Duplicate review

After running imports, detect likely duplicate leads with:

```bash
corepack pnpm leads:detect-duplicates
```

Then review candidates in the app:

- `/duplicates` for the candidate list
- `/duplicates/[id]` for side-by-side review

Safety rules:

- Use deterministic rules only; no AI matching.
- Do not auto-merge leads.
- Do not delete leads.
- Do not commit `.env.local`.
- Do not mutate the harvester database.

## AI file exchange

ClarioBase also supports a local, file-based ChatGPT workflow without calling any external AI API.

### Folder convention

```text
data/ai-exchange/
- inbox/       # Prepared files waiting for validation
- processing/  # Optional manual staging area
- outbox/      # Exported CRM files for review or ChatGPT preparation
- archive/     # Archived exchange files
- error/       # Invalid or rejected files
```

### Export a local review file

```bash
corepack pnpm ai:export-leads
```

This writes a JSON file into `data/ai-exchange/outbox/` containing local CRM lead context for review and manual ChatGPT preparation. It does not call any AI service and does not export `.env` data or harvester data.

### Validate a prepared import file

```bash
corepack pnpm ai:validate-import-file ./data/ai-exchange/inbox/prepared-leads.json
```

The validator checks that the file is valid JSON, contains a top-level array, and matches the same row contract used by `leads:import`. It prints total rows, valid rows, invalid rows, and row-level validation errors. A non-zero exit code means the file should not be imported yet.

### Manual workflow

```bash
# user reviews or prepares the file with ChatGPT outside the app
corepack pnpm ai:validate-import-file ./data/ai-exchange/inbox/prepared-leads.json
corepack pnpm leads:import ./data/ai-exchange/inbox/prepared-leads.json
corepack pnpm leads:detect-duplicates
```

### Safety rules

- No external AI API calls are made by the app.
- No automatic ChatGPT invocation exists.
- No file watcher or background sync is included.
- No harvester DB data is exported or mutated.
- No real lead data should be committed to the repository.

## Issue #2 recommendation

Issue `#2` should stay open only if it will become the future AI response preview and approval workflow. If not, it can be closed as superseded by `#16`, `#20`, and `#24` because the current implementation now covers local export, validation, and import without direct AI API integration.
