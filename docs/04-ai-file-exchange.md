# AI File Exchange

## Goal

The CRM must support manual ChatGPT collaboration without calling external AI APIs in v1.

The exchange is file-based:

```text
CRM export → ChatGPT analysis → structured response → CRM import preview → user approval → apply changes
```

## Folder structure

```text
ai_exchange/
├── inbox/       # CRM-generated files for ChatGPT review
├── outbox/      # ChatGPT-generated files ready for CRM import
├── processed/   # Archived files after successful import
├── rejected/    # Invalid, unsafe or rejected responses
├── schemas/     # JSON schemas for file contracts
└── samples/     # Safe anonymized examples
```

## Important rule

Real lead data should not be committed to the repository by default. The repository should contain schemas and anonymized samples. Real exports can live locally in the same folder structure.

## Exchange principles

- Every export must have a unique `batch_id`.
- Every response must reference the original `batch_id`.
- Every item must reference stable CRM IDs, usually `lead_id` and/or `customer_id`.
- CRM must validate response structure before showing preview.
- CRM must show preview before applying changes.
- User must approve imports manually.
- AI recommendations are advisory until approved.
- AI output should never automatically send messages to clients.

## File naming convention

```text
YYYY-MM-DD_workspace_purpose_batch-id.json
YYYY-MM-DD_workspace_purpose_batch-id.md
YYYY-MM-DD_workspace_purpose_batch-id__response.json
YYYY-MM-DD_workspace_purpose_batch-id__response.md
```

Examples:

```text
2026-06-09_clariobase_lead-review_batch-001.json
2026-06-09_clariobase_mini-audit_batch-002.json
2026-06-09_ugc_brand-review_batch-001.json
```

## Supported exchange purposes for v1

```text
lead_review
mini_audit_generation
outreach_message_generation
followup_recommendation
pipeline_health_review
lost_leads_analysis
```

## Minimal import lifecycle

```text
File found in ai_exchange/outbox
  ↓
Schema validation
  ↓
Business validation
  ↓
Preview screen
  ↓
User accepts selected items
  ↓
CRM applies changes
  ↓
Files moved to processed or rejected
```

## Business validation examples

- Does `batch_id` exist?
- Do all `lead_id` values exist?
- Is `decision` one of allowed values?
- Is `recommended_status` one of known statuses?
- Is the response trying to modify protected fields?
- Is the response empty or malformed?
- Does it include suspicious or unsafe instructions?

## Protected fields

AI imports should not modify these directly in v1:

```text
customer_id
source_record_id
google_place_id
created_at
source
raw harvested data
```

AI may recommend changes to:

```text
priority
lead_status
package_fit
next_action_at
mini_audit draft
message draft
tasks
notes
```

## Human approval

All imported recommendations should default to `pending` and require approval before becoming CRM state.
