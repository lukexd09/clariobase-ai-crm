# ClarioBase AI CRM

### A hands-on Technical PM case study: from business workflow to an operable, containerized product

ClarioBase AI CRM is a self-hosted sales workspace designed around a real small-business lead pipeline. It brings lead review, prioritization, activities, mini-audits, outreach drafts, offer preparation and controlled AI-assisted enrichment into one focused product.

The repository demonstrates how I translate a business need into product scope, architecture, a traceable backlog, working software, quality controls and an operational runtime.

| | |
|---|---|
| **My role** | Product owner · Technical Project Manager · solution designer · AI-assisted builder |
| **Delivery scope** | Discovery → MVP definition → architecture → backlog → implementation → QA → containerization → release readiness |
| **Core stack** | Next.js · TypeScript · PostgreSQL · Prisma · Zod · Tailwind CSS · shadcn/ui · Docker |
| **Current status** | Functional CRM workflows, reporting, controlled AI file exchange and Dockerized runtime implemented |

## What this project demonstrates

- translating business operations into product requirements and executable scope,
- making and documenting architecture and technology decisions,
- structuring delivery through stable epic and task identifiers,
- using AI to accelerate implementation while retaining human review and acceptance,
- designing validation, duplicate review and import audit controls around data quality,
- treating security, failure modes, backup/restore and operational readiness as product requirements,
- moving beyond a prototype into a reproducible, containerized environment.

## Product scope

The current solution covers:

- lead and contact management,
- sales pipeline statuses, scoring and prioritization,
- activities, tasks and next-action management,
- a daily sales workbench,
- mini-audit, outreach and offer drafts,
- import audit and deterministic duplicate review,
- lightweight sales reporting,
- file-based AI export, validation and import workflows.

## Architecture and operating principles

- The CRM PostgreSQL database is the source of truth for operational sales data.
- The lead harvester and CRM remain separate systems with separate databases.
- AI collaboration is file-based in v1; the application makes no external AI API calls.
- AI-prepared imports are validated and require manual review before application.
- Duplicate candidates are reviewed rather than automatically merged or deleted.
- Drafts never send outbound messages or execute commercial actions automatically.
- Real lead data and environment secrets must not be committed to the repository.
- Liveness and database-aware readiness checks make failure states visible.
- Docker Compose provides reproducible local, test and preview runtime contracts.

## Delivery approach

Work is organized into coded epics and tasks (`E001`, `E001.T001`) so decisions, implementation and verification remain traceable. Architecture Decision Records, operational runbooks and epic-level quality audits live alongside the product.

AI is used as an implementation and analysis partner, not as an owner of the product. I retain responsibility for scope, trade-offs, acceptance criteria, safety boundaries, verification and release decisions.

## Current product areas

- `/` — business-oriented dashboard
- `/work` — daily sales workbench
- `/leads` and `/leads/[id]` — lead review and operator workspace
- `/reports/sales` — operational sales summary
- `/imports` — import audit and row-level results
- `/duplicates` — side-by-side duplicate review
- `/health` — application liveness
- `/api/ready` — database-aware readiness

## Documentation map

The detailed project documentation is intentionally kept in [`/docs`](./docs):

- [Project context](./docs/00-project-context.md)
- [MVP scope](./docs/05-mvp-scope.md)
- [Ways of working](./docs/09-ways-of-working.md)
- [Technical stack decision](./docs/10-technical-stack-decision.md)
- [Work-item coding](./docs/12-work-item-coding.md)
- [AI file exchange](./docs/04-ai-file-exchange.md)
- [Container runtime](./docs/runtime/container-runtime.md)
- [Preview environment](./docs/architecture/preview-environment.md)
- [Architecture decisions](./docs/decisions)
- [Verification evidence](./docs/verification)

## Run locally

### Application development

```bash
pnpm install
cp .env.example .env.local
pnpm prisma:generate
pnpm prisma:validate
pnpm dev
```

Set `DATABASE_URL` in `.env.local` before starting database-backed workflows.

### Docker Compose runtime

```bash
cp .env.compose.example .env.compose.local
docker compose --env-file .env.compose.local up -d crm-postgres
docker compose --env-file .env.compose.local run --rm crm-app sh -lc "node ./node_modules/prisma/build/index.js migrate deploy"
docker compose --env-file .env.compose.local up -d crm-app
```

See the runtime and operations documentation before using preview, backup/restore or persistent environments.

## Repository structure

```text
src/                  Application code
prisma/               Data model, migrations and seed data
scripts/              Import, validation, AI exchange and runtime checks
docs/                 Product, architecture, process and operations documentation
data/ai-exchange/      Local human-in-the-loop AI exchange workspace
.github/               Delivery workflows and repository automation
```

## Related product

- [ClarioBase production website](https://clariobase.pl/)
- [Website repository](https://github.com/lukexd09/clariobase-main-page)

