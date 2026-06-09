# Product Vision

## One-sentence vision

ClarioBase AI CRM is a self-hosted, file-based AI-assisted sales operating system that helps turn harvested leads into qualified opportunities, mini-audits, outreach actions and clients.

## What this product is

- A focused CRM for lead-driven sales.
- A practical operating layer over a dedicated CRM PostgreSQL database.
- A system integrated with the existing harvester through import/sync, not direct table mutation.
- A system designed for human + ChatGPT collaboration through structured files.
- A future foundation for UGC outreach and productization.
- A product-grade web application built with the target stack from the start.

## What this product is not

- Not a full HubSpot/Salesforce clone.
- Not an email automation spam tool.
- Not an AI autopilot that sends messages without approval.
- Not a generic CRM for every industry in v1.
- Not dependent on paid AI API calls in v1.
- Not a temporary MVP built on a stack intended to be replaced later.

## Core value proposition

Traditional CRMs store leads. ClarioBase AI CRM should help decide what to do next.

The system should answer:

- Which leads are worth attention?
- Why are they worth attention?
- What should be the next action?
- What mini-audit angle should be used?
- What message should be sent?
- Which follow-ups are overdue?
- Where is the pipeline stuck?

## Primary user

The initial user is the ClarioBase founder/operator. The system should be optimized for a solo operator with limited time who wants clear prioritization and low-friction execution.

## Future users

- UGC creator outreach workflow.
- Small service businesses.
- Micro-agencies.
- Creators selling collaborations or services.

## Product moat hypothesis

The potential advantage is not a classic CRM feature set. The advantage is the combination of:

```text
lead harvesting + scoring + mini-audit preparation + file-based AI support + controlled CRM import
```

## Product-grade stack principle

The project should use the target stack from the start to avoid rewriting the application after MVP validation. The selected stack is documented in `docs/10-technical-stack-decision.md`.
