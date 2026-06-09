# Data Model Draft

This is an initial conceptual model. It should be refined before implementation and converted into migrations.

## Design principles

- PostgreSQL is the source of truth.
- `customer_id` should be the stable business identifier, not Google Place ID.
- Google-specific identifiers are source metadata, not primary business keys.
- AI recommendations should be stored separately from approved CRM state.
- Importing AI output must not overwrite core data without user approval.

## Core tables

## `leads`

Represents a potential business/client.

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
archived_at
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

```text
id
lead_id
activity_type
activity_at
channel
summary
content
result
created_by
created_at
```

Activity types:

```text
note
call
email
instagram_dm
meeting
offer
follow_up
status_change
mini_audit
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

## `mini_audits`

Stores audit drafts and approved audit content.

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
created_at
updated_at
approved_at
```

## `offers`

Future table for commercial offers.

```text
id
lead_id
offer_status
package_name
price_net
scope_summary
sent_at
accepted_at
rejected_at
notes
created_at
updated_at
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
