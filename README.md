# ClarioBase AI CRM

Self-hosted, file-based AI-assisted CRM for ClarioBase lead management, sales workflow, mini-audits, outreach preparation and future UGC pipeline support.

## Core idea

This is not intended to be a generic CRM. It is a lightweight operational CRM designed around:

- a lead harvester,
- PostgreSQL as the source of truth,
- sales pipeline management,
- scoring and prioritization,
- mini-audits,
- manual ChatGPT-assisted analysis through structured file exchange.

## Key principles

- PostgreSQL is the source of truth.
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

For AI exchange work, also read:

- `docs/04-ai-file-exchange.md`
- `ai_exchange/schemas/ai_review_pack.schema.json`
- `ai_exchange/schemas/ai_response.schema.json`

## Repository structure

```text
clariobase-ai-crm/
├── docs/                 # Product, process and technical documentation
├── ai_exchange/          # File-based AI exchange workspace
│   ├── inbox/            # CRM-generated files for ChatGPT review
│   ├── outbox/           # ChatGPT-generated files ready for CRM import
│   ├── processed/        # Archived processed exchange files
│   ├── rejected/         # Invalid or rejected exchange files
│   ├── schemas/          # JSON schemas for import/export contracts
│   └── samples/          # Safe anonymized examples
└── README.md
```

## Current status

Project foundation and documentation phase.
