# Core Workflows

## 1. Lead intake workflow

```text
Harvester finds lead
  ↓
Lead is stored in PostgreSQL
  ↓
CRM shows lead as New
  ↓
User reviews basic data
  ↓
Lead is qualified, rejected or sent to AI review
```

Expected statuses:

```text
New
Qualified
To audit
Audited
Contacted
Replied
Discovery scheduled
Offer sent
Won
Lost
Nurture
Bad fit
Do not contact
```

## 2. Lead review workflow

Goal: decide which leads deserve attention.

```text
User selects leads or view
  ↓
CRM exports AI review pack
  ↓
User sends file to ChatGPT
  ↓
ChatGPT returns structured response
  ↓
CRM imports response into preview
  ↓
User approves selected recommendations
  ↓
CRM updates priorities, statuses and next actions
```

## 3. Mini-audit workflow

Goal: prepare a concrete reason to contact a lead.

```text
Lead is marked as To audit
  ↓
CRM exports mini-audit generation pack
  ↓
ChatGPT prepares draft mini-audit
  ↓
CRM imports draft
  ↓
User reviews and edits
  ↓
Lead becomes Audited
```

Mini-audit should usually contain:

- 2-3 concrete observations,
- recommended improvement,
- proposed package fit,
- suggested first outreach message,
- risk notes.

## 4. Outreach workflow

```text
Lead is Audited
  ↓
User prepares message
  ↓
Message is manually sent through selected channel
  ↓
Activity is logged
  ↓
Next follow-up date is set
```

Initial outreach channels:

- Instagram DM,
- email,
- phone,
- manual other.

No automatic mass sending in v1.

## 5. Follow-up workflow

```text
CRM shows due tasks
  ↓
User reviews lead context
  ↓
Optional AI follow-up recommendation pack is exported
  ↓
User sends follow-up manually
  ↓
Activity and next action are updated
```

## 6. Pipeline health workflow

```text
CRM exports pipeline health pack
  ↓
ChatGPT reviews pipeline data
  ↓
ChatGPT returns bottlenecks and recommendations
  ↓
User decides operational changes
```

Questions to answer:

- Are enough leads being qualified?
- Are enough mini-audits being prepared?
- Is outreach being sent?
- Are follow-ups overdue?
- Where does the pipeline lose leads?

## 7. UGC workflow - future

The future UGC pipeline will reuse the same technical foundation but with different lead types and statuses.

Potential statuses:

```text
Brand found
Fit checked
Contact found
Pitch prepared
Contacted
Replied
Brief received
Offer sent
Deal won
Content delivered
Invoice sent
Nurture
Lost
```
