# Decisions Log

## 2026-06-09 - File-based AI exchange instead of API

Decision: The CRM will not call AI APIs in v1. AI support will work through structured file export/import.

Reason:

- User already has a ChatGPT subscription.
- Lower implementation complexity.
- No API costs.
- Better control over sensitive lead data.
- Fits the current workflow: user exports data, ChatGPT analyzes it, CRM imports approved response.

Implication:

- CRM must support AI export packs and AI response imports.
- Import must include validation, preview and manual approval.
- Repository should contain schemas and examples, not real lead data by default.

## 2026-06-09 - PostgreSQL as source of truth

Decision: PostgreSQL remains the system of record.

Reason:

- Existing harvester already moved toward local PostgreSQL.
- The system should avoid CRM vendor lock-in.
- Future UI and automation layers can change without losing core data.

Implication:

- CRM UI is an operational layer over PostgreSQL.
- Google Place ID and other source IDs are metadata, not primary business identifiers.

## 2026-06-09 - Build focused CRM, not generic CRM clone

Decision: The system should focus on ClarioBase sales workflow first.

Reason:

- Generic CRM scope would slow delivery.
- Current value comes from lead review, mini-audits, outreach and follow-up discipline.
- The product should be validated internally before broadening.

Implication:

- MVP excludes advanced CRM features such as campaigns, inbox, billing, complex permissions and multi-tenant SaaS.

## 2026-06-09 - Manual approval for AI imports

Decision: AI-generated recommendations must never directly update CRM state without user approval.

Reason:

- Prevents accidental status changes.
- Protects against malformed AI output.
- Keeps the user in control of client communication and sales decisions.

Implication:

- Import flow must include validation and preview.
- Imported items start as pending recommendations.
