# E022.T001 Clario UI Language and Surfaces Inventory

## Purpose

Discovery-only audit for `#179`. This document inventories visible ClarioBase website-sales language and UI surfaces that should be removed, renamed, neutralized, or deferred before the CRM MVP moves toward a UGC-focused workspace.

## Verified GitHub state

- PR `#177` is merged and is the accepted E020.T007 source of truth.
- Issue `#138` is closed.
- PR `#175` is closed and not merged.
- Issue `#131` remains open because `#139` is still open.
- Issue `#178` is open.
- Issue `#179` is the current task.

## Scope note

This inventory only covers visible UI and UI-facing documentation. It does not change product code, Prisma schema, migrations, auth, preview workflow, package files, lockfiles, or `tsconfig`.

## Removal / rename matrix

| Surface | Current Clario-specific term | Keep / remove / rename / defer | Proposed temporary UGC-neutral wording | Notes |
| ------- | ---------------------------- | ------------------------------ | -------------------------------------- | ----- |
| Shell / brand header | `ClarioBase`, `Creator workspace` | rename | `Workspace` or `Operator workspace` | Brand lockup still reads as ClarioBase in the shell and is the first visible product identity. |
| Shell / navigation group | `Workspace`, `Sales`, `Possible duplicates`, `System status` | rename | `Workspace`, `Tasks`, `Sources`, `Health` | Group labels are mostly neutral already, but `Sales` is the biggest visible legacy wedge in primary nav. |
| Home dashboard | `Today's priorities`, `Send mini-audit summary`, `Confirm booking flow`, `schedule the next follow-up`, `proposal` | rename | `Today's priorities`, `Publish draft`, `Confirm details`, `Follow up` | Dashboard cards still read like a sales operator queue, not a UGC operator workspace. |
| Home dashboard metrics | `Overdue`, `Due today`, `Upcoming`, `No next action` | neutralize | `Overdue`, `Due today`, `Upcoming`, `Idle` | Metric structure can stay, but `No next action` is sales-workflow language and may need a softer neutral label. |
| Daily work route `/work` | `Sales workbench`, `Work queue`, `next action`, `lead`, `package`, `Quick update` | rename | `Operator queue`, `Work queue`, `Next task`, `Item`, `Quick edit` | This is the clearest visible sales-workflow surface and needs future wording cleanup even if the route survives. |
| Daily work buckets | `Overdue`, `Due today`, `Upcoming`, `No next action` | neutralize | `Overdue`, `Due today`, `Upcoming`, `Idle` | Bucket logic can remain, but the final naming should stop implying lead-sales tasking. |
| Leads list `/leads` | `Lead CRM`, `queue`, `current result window`, `lead` | rename | `Workspace`, `Items`, `Current results`, `Record` | The page is still acceptable operationally, but it advertises the old CRM framing at the entry point. |
| Leads list table | `Package`, `Score`, `Next action` | neutralize | `Bundle`, `Priority`, `Next task` | Table headers are visible everywhere and should stop encoding website-sales semantics. |
| Lead filters | `Package fit` | neutralize | `Bundle fit` or `Match` | This is a visible filter label and a strong legacy signal. |
| Lead detail breadcrumb | `Leads` | keep | `Items` if list naming changes later | Breadcrumb is fine for now; the surrounding page copy is the bigger problem. |
| Lead detail hero | `Lead workspace`, `Lead score`, `Customer`, `Next recommended action` | rename | `Workspace`, `Readiness`, `Owner`, `Recommended next step` | `Lead workspace` and `Customer` still anchor the page in the old CRM model. |
| Lead detail hero CTA | `Open workbench` | rename | `Open queue` or `Open workspace` | This points back to sales terminology and should be normalized with the route rename plan. |
| Lead detail section nav | `Mini-audit`, `Outreach`, `Offer` | remove / defer | `Notes`, `Message`, `Draft` or `Prepare` | These are the strongest ClarioBase sales artifacts on the page. They are visible UI terms, but the underlying draft models are lower-layer cleanup. |
| Lead detail summary card | `Next recommended action` text that mentions `package fit`, `mini-audit`, `outreach`, `commercial offer` | neutralize | `Recommended next step` with generic task language | The recommendation logic can remain for now, but visible copy should stop exposing the sales playbook. |
| Mini-audit panel | `Mini-audit`, `diagnosis`, `package fit`, `draft message angle`, `Problem 1/2/3`, `Suggested package` | remove / neutralize / defer | `Review`, `Findings`, `Match`, `Draft note` | Visible wording is tightly tied to the old service model. The field names in storage can stay for later domain cleanup. |
| Outreach panel | `Outreach sequence`, `Linked mini-audit`, `Channel`, `Opening hook`, `Call to action` | remove / neutralize / defer | `Message draft`, `Linked review`, `Channel`, `Opening line`, `Next step` | This is still a sales campaign surface and should be de-branded in UI first. |
| Offer panel | `Offer generation`, `commercial draft`, `Package fit`, `Price net`, `Valid until`, `Accepted`, `Rejected` | remove / neutralize / defer | `Draft`, `Bundle match`, `Price`, `Expires`, `Approved`, `Declined` | The visible surface is the most ClarioBase-sales-specific block after mini-audit. |
| Lead controls | `Operational update`, `state`, `priority`, `package fit`, `next action` | neutralize | `Status update`, `priority`, `match`, `next step` | These controls are still valid operationally, but the label set should be moved away from sales vocabulary. |
| Activity log | `Notes, calls, messages, and updates` | keep / rename | `Notes, messages, and updates` | This is mostly neutral and can stay, but the wording should be reviewed once the UGC model is defined. |
| Sales report `/reports/sales` | `Sales reporting`, `Operational pipeline report`, `Lead status summary`, `Package fit summary`, `Draft readiness`, `Activity summary` | rename | `Operations report`, `Workspace report`, `Match summary`, `Draft readiness`, `Activity summary` | This page is explicitly sales-coded and should be renamed before broad UGC-facing exposure. |
| Sales report metrics | `Leads with mini-audit drafts`, `Leads with outreach drafts`, `Leads with offer drafts` | neutralize / defer | `Items with review drafts`, `Items with message drafts`, `Items with proposal drafts` | The counts can survive, but the labels should stop naming the old sales artifacts in the UI. |
| Status metadata | `To audit`, `Audited`, `Discovery scheduled`, `Offer sent`, `Won`, `Lost`, `Do not contact` | defer | `TBD` | These are lower-layer workflow semantics. They are visible today, but changing them cleanly depends on later domain/model work. |
| README | `website-sales CRM`, `mini-audits`, `offer drafting`, `ClarioBase first`, `UGC outreach second` | rename | `operator workspace`, `draft preparation`, `workspace first`, `UGC workspace` | UI-facing docs still describe the old product framing and will confuse the next UI cleanup slices. |
| Product docs | `mini-audit preparation`, `package fit`, `sales workflow`, `business presence`, `lead work` | rename / defer | `review prep`, `match`, `operator workflow`, `workspace work` | These docs are the best source of truth for current UI expectations, but they also preserve the old sales vocabulary. |
| Seed data / sample AI payloads | `Clarity`, `Momentum`, `Base`, `mini-audit`, `package fit`, `offer`, `website conversion` | defer | `TBD` | This is useful evidence of the old vocabulary, but it is not the right layer for the E022 UI cleanup slices. |

## UI-only cleanup vs later domain cleanup

- UI-only cleanup for E022: shell labels, navigation labels, page titles, section headings, buttons, helper text, empty states, and recommendation copy visible in the browser.
- Later domain cleanup: `mini_audit_drafts`, `offer_drafts`, `packageFit`, `suggestedPackage`, `sales-status` semantics, and sample data that still encode the old sales model.
- Practical rule for follow-up PRs: if a user can see the term, it belongs in the E022 cleanup path; if the term mainly exists in storage, schema, or fixture structure, defer it.

## High-priority follow-ups for `#180` to `#182`

- Replace the shell / nav `Sales` entry with UGC-neutral wording.
- Reframe `/work` as a generic operator queue instead of a sales workbench.
- Neutralize `/leads` and `/leads/[id]` labels that still mention lead-sales artifacts.
- Remove `mini-audit` and `offer generation` from visible panel headings first, even if the underlying forms remain unchanged for now.
- Reword the sales report so it reads like an operations report, not a ClarioBase pipeline report.

## Validation

- `git diff --check` was run after this document update and passed.
- No product code, schema, migrations, package, lockfile, auth, or preview workflow files were changed.
