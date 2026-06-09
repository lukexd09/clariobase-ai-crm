# Harvester Integration Analysis

## Purpose

This document defines the first controlled import boundary between the harvester system and the CRM system.
It explains why the systems stay separate, how the CRM may import lead data safely, and what rules apply before any future sync work is introduced.

## Why the databases remain separate

- The harvester database is the source of truth for acquisition and enrichment.
- The CRM database is the source of truth for operational sales workflow.
- Keeping them separate reduces the risk of damaging the harvester while CRM workflows evolve.
- The CRM should only import selected data by contract, not mutate harvester tables directly.

## Why the initial integration is file/import based

- File-based import is easier to review and audit than a direct database link.
- It supports controlled local testing with fake data before any real sync is considered.
- It allows validation, preview and rejection of bad rows before the CRM state changes.
- It keeps the first integration simple enough for a solo operator to reason about.

## Import boundaries

Allowed:

- Import selected lead fields from a JSON file.
- Use `customerId` as the stable CRM identifier when available.
- Use `source + sourceRecordId` as the preferred idempotent external identity when available.
- Store `googlePlaceId` only as optional metadata.

Forbidden:

- Direct reads or writes against harvester tables from CRM code.
- Automatic overwrite of protected CRM fields without contract rules.
- Importing real lead data by default.
- Background sync or silent refresh behavior.

## Identity strategy

- `customerId` is the stable CRM identifier.
- `source` plus `sourceRecordId` is the preferred external source trace for idempotent upserts.
- `googlePlaceId` is optional metadata and must not be treated as the sole business key.
- If `customerId` is missing, the importer may generate one deterministically from the import payload.

## Overwrite rules

- Existing operational fields may be updated when the import contract allows it.
- Protected source fields should not be overwritten silently.
- If the importer finds a conflict, it should prefer idempotent behavior and report what happened.
- Imported data should be traceable back to the source row.

## Duplicate risks

- Duplicate CRM leads can appear when source records are incomplete.
- A record with a missing `customerId` but matching `source + sourceRecordId` should still upsert safely.
- A deterministic fallback `customerId` prevents accidental duplicate creation when the source trace is missing.

## Auditability requirements

- Every rejected row should include a clear reason.
- Every import run should print a summary of created, updated, rejected and skipped rows.
- Import behavior should be deterministic and repeatable against the same file.
- Future review tooling may use these summaries as an audit trail.

## Future path

This import contract is a foundation for later API or service-based sync, but not for this task.
Future work may replace the file importer with a documented service integration only after the file-based workflow is stable.

## Supported fields in the import file

- `customerId`
- `businessName`
- `category`
- `city`
- `region`
- `country`
- `source`
- `sourceRecordId`
- `googlePlaceId`
- `websiteUrl`
- `instagramUrl`
- `facebookUrl`
- `phone`
- `email`
- `address`
- `leadStatus`
- `priority`
- `packageFit`
- `scoreTotal`
- `scoreLabel`
- `nextActionAt`
- `lastReviewedAt`
- `lastImportedAt`

## Validation rules

- `businessName` is required.
- Enum values must be validated against the CRM enums.
- Invalid rows must be rejected with a clear reason.
- If `customerId` is missing, the importer may create a deterministic fallback ID.
- `source + sourceRecordId` should be used for idempotent upsert when both are present.

