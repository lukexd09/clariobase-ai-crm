# Roadmap

## Phase 0 - Documentation foundation

Goal: define what should be built before code starts.

Deliverables:

- Project context.
- Product vision.
- Core workflows.
- Initial data model.
- AI file exchange specification.
- MVP scope.
- Decision log.
- JSON schemas and samples.
- Ways of working.
- Technical stack decision.
- Work item coding standard.

## Phase 0.5 - Implementation readiness

Goal: prepare the repository for coding without starting CRM features too early.

Primary epic/task:

```text
E001 - Define and implement CRM foundation
E001.T001 - Initialize Next.js technical skeleton
```

Deliverables:

- Next.js App Router skeleton.
- TypeScript setup.
- Tailwind setup.
- Prisma setup.
- Dedicated CRM PostgreSQL connection via env variables.
- `.env.example`.
- Basic health/status page or route.
- Basic test command.
- Local setup instructions.

Out of scope:

- CRM feature screens.
- Harvester sync.
- AI exchange implementation.
- Auth.
- Real lead data.

## Phase 1 - Local CRM foundation

Goal: create the basic self-hosted CRM shell over the dedicated CRM database.

Primary epic:

```text
E001 - Define and implement CRM foundation
```

Potential deliverables:

- Initial Prisma models and migrations.
- Lead list.
- Lead detail view.
- Basic status update.
- Basic filters.
- Initial sample/seed data with fake leads only.

## Phase 2 - Sales workflow

Goal: support real ClarioBase lead work.

Primary epic:

```text
E003 - Build ClarioBase sales workflow
```

Potential deliverables:

- Pipeline view.
- Tasks.
- Activities and a lead activity timeline.
- Mini-audit drafts.
- Package fit.
- Basic reporting.

## Phase 3 - File-based AI exchange

Goal: make ChatGPT collaboration operational.

Primary epic:

```text
E002 - Implement file-based AI exchange
```

Potential deliverables:

- Local export for manual ChatGPT review.
- Prepared-file validation before import.
- Manual import of validated files.
- Optional future preview/approval UI.
- Store AI recommendations history.

Implemented current workflow:

```text
data/ai-exchange/
  ->
local export
  ->
manual review/preparation
  ->
validation
  ->
manual import
```

## Phase 4 - Harvester integration

Goal: connect the CRM cleanly with harvested leads through a documented import/sync contract.

Primary epic:

```text
E004 - Connect CRM with harvester data
```

Required first deliverable:

- `docs/11-harvester-integration-analysis.md`

Potential deliverables after analysis:

- Import/sync from existing harvester PostgreSQL database.
- Deduplication by `customer_id` and source identifiers.
- Refresh metadata mapping.
- Lead source tracking.
- Scoring refresh status mapping.

Constraint:

- CRM must not directly mutate harvester tables.

## Phase 5 - UGC pipeline

Goal: validate the same system for UGC outreach.

Primary epic:

```text
E005 - Prepare future UGC outreach pipeline
```

Potential deliverables:

- New pipeline type.
- Brand lead profile.
- Creator fit fields.
- Pitch generation packs.
- Collaboration tracking.

## Phase 6 - Product validation

Goal: decide whether this can become a product.

Potential deliverables:

- Product packaging analysis.
- Repeatable onboarding.
- Multi-workspace design.
- Security model.
- Hosting model.
- Billing concept.

## Critical checkpoint

Do not start building multi-tenant SaaS features before the internal ClarioBase workflow proves that it creates measurable value.
