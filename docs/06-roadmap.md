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

## Phase 1 - Local CRM foundation

Goal: create the basic self-hosted CRM shell.

Potential deliverables:

- App skeleton.
- PostgreSQL connection.
- Lead list.
- Lead detail view.
- Basic status update.
- Basic filters.
- Initial migrations.

## Phase 2 - Sales workflow

Goal: support real ClarioBase lead work.

Potential deliverables:

- Pipeline view.
- Tasks.
- Activities.
- Mini-audit drafts.
- Package fit.
- Basic reporting.

## Phase 3 - File-based AI exchange

Goal: make ChatGPT collaboration operational.

Potential deliverables:

- Export AI review pack.
- Export mini-audit generation pack.
- Import AI response.
- Validate response.
- Preview recommendations.
- Approve/reject selected items.
- Store AI recommendations history.

## Phase 4 - Harvester integration

Goal: connect the CRM cleanly with harvested leads.

Potential deliverables:

- Import/sync from existing harvester PostgreSQL tables.
- Deduplication by `customer_id` and source identifiers.
- Refresh metadata.
- Lead source tracking.
- Scoring refresh status.

## Phase 5 - UGC pipeline

Goal: validate the same system for UGC outreach.

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
