# Sales status workflow

This document explains how the CRM uses `LeadStatus` values in the sales workflow.

The goal is consistency, not hard automation. Statuses are descriptive operational states that help the team understand where a lead sits in the pipeline and what the next step should be.

## Status flow

Typical path:

```text
NEW -> QUALIFIED -> TO_AUDIT -> AUDITED -> CONTACTED -> REPLIED -> DISCOVERY_SCHEDULED -> OFFER_SENT -> WON / LOST
```

Alternative pause paths:

```text
NURTURE
BAD_FIT
DO_NOT_CONTACT
ARCHIVED
```

## Status meanings

### `NEW`

- Meaning: a fresh lead that still needs qualification.
- Use when: the lead has been imported or created but not yet assessed.
- Do not use when: the lead already has enough context for deeper work.
- Typical next action: confirm fit and fill any missing context.

### `QUALIFIED`

- Meaning: the lead is a clear fit and ready for deeper work.
- Use when: the lead matches the business target and is worth a mini-audit.
- Do not use when: the lead is still too uncertain or lacks basic context.
- Typical next action: create or refine the mini-audit.

### `TO_AUDIT`

- Meaning: the lead is queued for mini-audit or closer review.
- Use when: a review is needed before outreach or offer preparation.
- Do not use when: the mini-audit is already finished.
- Typical next action: prepare the first audit draft.

### `AUDITED`

- Meaning: a mini-audit exists and the lead is ready for outreach work.
- Use when: the diagnosis is done and the next step is message preparation.
- Do not use when: the audit is still incomplete.
- Typical next action: prepare outreach or follow-up actions.

### `CONTACTED`

- Meaning: the first outreach has already been sent.
- Use when: the lead has received an initial message or call attempt.
- Do not use when: no outreach has happened yet.
- Typical next action: monitor for a reply or follow up once.

### `REPLIED`

- Meaning: the lead replied and a conversation is active.
- Use when: there is a back-and-forth and a human reply exists.
- Do not use when: the lead is still silent after outreach.
- Typical next action: move toward discovery or offer preparation.

### `DISCOVERY_SCHEDULED`

- Meaning: a discovery call or meeting is already booked.
- Use when: the next meaningful step is the scheduled conversation.
- Do not use when: a meeting has not been arranged yet.
- Typical next action: prepare the call and confirm the agenda.

### `OFFER_SENT`

- Meaning: a commercial offer has been delivered.
- Use when: pricing or proposal material is already in the lead's hands.
- Do not use when: the conversation is still pre-offer.
- Typical next action: track response, objections and timing.

### `WON`

- Meaning: the lead has become a customer.
- Use when: the commercial objective has been completed successfully.
- Do not use when: the deal is still open or uncertain.
- Typical next action: archive when downstream work is done.

### `LOST`

- Meaning: the opportunity closed without conversion.
- Use when: the lead is no longer moving forward as a sale.
- Do not use when: the lead should still be nurtured.
- Typical next action: record the reason and archive if needed.

### `NURTURE`

- Meaning: the lead is not ready now but may matter later.
- Use when: timing is wrong, but the lead is still worth revisiting.
- Do not use when: the lead is already closed or a bad fit.
- Typical next action: schedule a future check-in.

### `BAD_FIT`

- Meaning: the lead does not match the current offer or target.
- Use when: the lead is unlikely to be worth active work.
- Do not use when: the lead can realistically be converted with normal effort.
- Typical next action: leave paused or archive if needed.

### `DO_NOT_CONTACT`

- Meaning: outreach must stop for this lead.
- Use when: the lead asked not to be contacted or must be protected.
- Do not use when: the lead is still a valid outreach target.
- Typical next action: stop outreach and keep the record protected.

### `ARCHIVED`

- Meaning: the lead is no longer in the active working set.
- Use when: the record should remain for history but not daily work.
- Do not use when: the lead still needs a live sales action.
- Typical next action: no operational action.

## Operational guidance

- `NEW` and `QUALIFIED` belong to intake.
- `TO_AUDIT` and `AUDITED` belong to the audit stage.
- `CONTACTED`, `REPLIED`, `DISCOVERY_SCHEDULED` and `OFFER_SENT` belong to outreach and conversation.
- `WON`, `LOST`, `NURTURE`, `BAD_FIT`, `DO_NOT_CONTACT` and `ARCHIVED` are terminal or paused operational states.
- The CRM should stay descriptive first and enforcement-light unless a future workflow engine is explicitly added.
