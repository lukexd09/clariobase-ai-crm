# E022.T003/T004 Lead detail terminology mapping

This note records the temporary UI-only wording changes used on `/leads/[id]` while the backend still uses the older data model names.

## Visible UI mappings

- `Lead workspace` -> `Operator workspace`
- `Lead score` -> `Readiness`
- `Customer` -> `Contact`
- `Next recommended action` -> `Recommended next step`
- `Next action` -> `Next task`
- `Package fit` -> `Match`
- `Mini-audit` -> `Review`
- `Outreach sequence` -> `Message plan`
- `Offer generation` -> `Draft preparation`

## Backend names kept intact

- `packageFit`
- `suggestedPackage`
- `miniAuditDraft`
- `outreachDraft`
- `offerDraft`
- persisted status values and actions

The page copy is intentionally neutral for the UGC MVP, but the underlying route, fields, and actions remain unchanged for this slice.
