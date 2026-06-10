# Data Model Draft

This is an initial conceptual model for the dedicated CRM PostgreSQL database. It should be refined before implementation and converted into Prisma schema and migrations.

## Design principles

- The CRM PostgreSQL database is the source of truth for CRM operational data.
- The harvester database remains the source of truth for raw harvested/enriched lead source data.
- CRM and harvester databases should be separate.
- CRM should import/sync from harvester through a documented contract, not mutate harvester tables directly.
- `customer_id` should be the stable business identifier, not Google Place ID.
- Google-specific identifiers are source metadata, not primary business keys.
- AI recommendations should be stored separately from approved CRM state.
- Importing AI output must not overwrite core data without user approval.
- Prisma is the default ORM/migration tool for implementation.

## Database boundary

```text
Harvester PostgreSQL database
  - raw/source lead data
  - Google-specific metadata
  - refresh metadata
  - harvester scoring/enrichment data

CRM PostgreSQL database
  - CRM lead records
  - statuses and priorities
  - tasks and activities
  - mini-audit drafts
  - outreach drafts
  - offer drafts
  - AI exchange batches
  - approved AI recommendations
```

The CRM database may store selected copied/imported fields from the harvester, but it should not become a raw scraping database.

## Core tables

## `leads`

Represents a potential business/client inside CRM.

Suggested fields:

```text
id
customer_id
business_name
category
city
region
country
source
source_record_id
google_place_id
website_url
instagram_url
facebook_url
phone
email
address
lead_status
priority
package_fit
score_total
score_label
next_action_at
created_at
updated_at
last_reviewed_at
last_imported_at
archived_at
```

Notes:

- `id` is the internal CRM primary key.
- `customer_id` is the stable business identifier used across CRM workflows.
- `google_place_id` is optional source metadata.
- `source_record_id` should reference the origin record if imported from harvester.

## `lead_sources`

Tracks where a CRM lead came from and allows future multi-source imports.

```text
id
lead_id
source_system
source_record_id
source_url
external_id
imported_at
last_seen_at
raw_snapshot
created_at
updated_at
```

Examples of `source_system`:

```text
harvester
google_maps
manual
instagram
ugc_brand_research
```

## `contacts`

People or contact points associated with a lead.

```text
id
lead_id
name
role
email
phone
channel
profile_url
is_primary
created_at
updated_at
```

## `lead_scores`

Stores scoring details and reason codes.

```text
id
lead_id
score_total
score_label
online_gap_score
social_activity_score
contactability_score
budget_signal_score
local_fit_score
package_fit
score_reasons
scored_at
scored_by
```

## `activities`

History of actions taken on a lead.

Implemented in Prisma as a lightweight append-first log for the sales workflow. The first version supports manual notes, calls, messages, audits, other interaction types, and optional status-change style entries created from lead updates.

```text
id
lead_id
type
title
body
occurred_at
created_at
updated_at
```

Activity types:

```text
NOTE
CALL
MESSAGE
STATUS_CHANGE
AUDIT
OTHER
```

## `tasks`

Action queue for the operator.

```text
id
lead_id
title
description
task_type
status
due_at
completed_at
created_at
updated_at
```

Task statuses:

```text
open
done
cancelled
deferred
```

## `mini_audit_drafts`

Stores mini-audit drafts and their review status for a lead.

```text
id
lead_id
status
problem_1
problem_2
problem_3
recommendation
suggested_package
outreach_angle
draft_message
risk_notes
approved_at
created_at
updated_at
```

Mini-audit statuses:

```text
DRAFT
READY_FOR_REVIEW
APPROVED
ARCHIVED
```

## `outreach_drafts`

Stores manual outreach drafts for a lead.

```text
id
lead_id
status
channel
subject
opening_hook
message
call_to_action
notes
sent_at
created_at
updated_at
```

Outreach draft statuses:

```text
DRAFT
READY
SENT_MANUALLY
ARCHIVED
```

Outreach channels:

```text
EMAIL
INSTAGRAM_DM
FACEBOOK_DM
PHONE_CALL
OTHER
```

## `offer_drafts`

Stores the first commercial offer draft records for a lead.

```text
id
lead_id
status
title
package_fit
price_net
currency
scope_summary
assumptions
next_step
valid_until
sent_at
accepted_at
rejected_at
rejection_reason
created_at
updated_at
```

Offer draft statuses:

```text
DRAFT
READY
SENT_MANUALLY
ACCEPTED
REJECTED
ARCHIVED
```

Notes:

- Offer drafts are local CRM planning records, not automatic send or payment artifacts.
- `package_fit` uses the same package fit vocabulary as the rest of the CRM.
- A future finalized `offers` table can still be added later if commercial contract tracking becomes a separate need.

## Import/sync tables

## `import_batches`

Tracks data imports from harvester or other future sources.

```text
id
batch_id
source_system
source_database
source_description
status
started_at
finished_at
records_seen
records_created
records_updated
records_skipped
error_message
created_at
```

## `import_batch_items`

Tracks individual import results.

```text
id
batch_id
lead_id
source_record_id
action
status
reason
created_at
```

Possible actions:

```text
created
updated
skipped
duplicate
failed
```

## AI exchange tables

## `ai_review_batches`

Represents one exported/imported AI batch.

```text
id
batch_id
workspace
purpose
status
input_file_path
response_file_path
created_at
imported_at
approved_at
rejected_at
notes
```

Statuses:

```text
exported
response_received
validated
partially_applied
applied
rejected
failed_validation
```

## `ai_recommendations`

Stores imported AI recommendations before or after approval.

```text
id
batch_id
lead_id
recommendation_type
priority
decision
recommended_status
recommended_package
reasoning_summary
recommended_next_action
draft_message
risk_notes
approval_status
applied_at
created_at
```

Approval statuses:

```text
pending
approved
rejected
applied
```

## `ai_generated_drafts`

Stores AI-generated text drafts.

```text
id
batch_id
lead_id
draft_type
content
status
created_at
approved_at
used_at
```

Draft types:

```text
mini_audit
first_message
follow_up
offer_summary
pipeline_review
```

## Future multi-workspace support

The first version can assume one workspace, but the data model should not block future support for:

- ClarioBase sales pipeline,
- UGC outreach pipeline,
- future productized customer workspaces.

Do not implement multi-tenant SaaS in v1. Only avoid hardcoding decisions that would make it impossible later.
