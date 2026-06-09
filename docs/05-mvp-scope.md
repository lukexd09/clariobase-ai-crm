# MVP Scope

## MVP objective

Build a minimal operational CRM that helps ClarioBase manage harvested leads, prioritize work, prepare mini-audits, plan outreach and collaborate with ChatGPT through structured files.

## In scope for MVP

## 1. Lead management

- List leads.
- Search and filter leads.
- Open lead detail view.
- Update lead status.
- Update priority.
- Update package fit.
- Add notes.
- Set next action date.

## 2. Pipeline

- Status-based view.
- Basic pipeline counts.
- Filters by status, city, category, score and priority.

## 3. Tasks

- Create task manually.
- Auto-create task from approved AI recommendation.
- Mark task as done.
- Show today's tasks.
- Show overdue tasks.

## 4. Activities

- Add manual activity.
- Log status changes.
- Log outreach attempts.
- Log mini-audit creation.

## 5. Mini-audits

- Create mini-audit draft.
- Edit mini-audit draft.
- Approve mini-audit.
- Store suggested outreach message.

## 6. AI exchange export

CRM should generate export files for:

- lead review,
- mini-audit generation,
- outreach message generation,
- follow-up recommendation.

## 7. AI exchange import

CRM should import response files from `ai_exchange/outbox`.

Required import flow:

```text
Scan outbox
  ↓
Validate file
  ↓
Show preview
  ↓
User approves selected items
  ↓
Apply changes
  ↓
Archive file
```

## 8. Basic reporting

- Total leads.
- Leads by status.
- Leads by city.
- Leads by priority.
- Mini-audits prepared.
- Outreach attempts.
- Replies.
- Offers sent.
- Won / lost.

## Out of scope for MVP

- External AI API calls.
- Automated message sending.
- Full email inbox integration.
- Calendar integration.
- Billing and invoices.
- Multi-tenant SaaS.
- Advanced permissions.
- Marketing campaigns.
- Full project delivery management.
- Complex role-based access.

## Non-negotiable requirements

- Real data must not be committed by default.
- AI imports require preview and manual approval.
- Database must keep AI recommendations separate from approved CRM state.
- PostgreSQL must remain the source of truth.
- The app should remain simple enough for a solo operator.
