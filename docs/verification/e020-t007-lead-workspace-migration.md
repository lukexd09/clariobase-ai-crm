# E020.T007 lead workspace migration note

## Scope

- Route: `/leads/[id]`
- Shared route-only components: `src/components/lead-update-form.tsx`, `src/components/activity-form.tsx`, `src/components/mini-audit-draft-form.tsx`, `src/components/outreach-draft-form.tsx`, `src/components/offer-draft-form.tsx`
- Server actions: `src/app/leads/actions.ts`, `src/app/leads/activity-actions.ts`, `src/app/leads/mini-audit-actions.ts`, `src/app/leads/outreach-draft-actions.ts`, `src/app/leads/offer-draft-actions.ts`

## Inventory

The current lead detail workspace exposes:

- lead identity and business name
- lead status, priority, package fit, and score
- contact and business context
- next action information
- update form for lead state
- activity creation and timeline
- mini-audit, outreach, and offer draft panels
- technical metadata disclosure

## Parity checklist

- Preserved business name, contact data, status, priority, score, package, and next action
- Preserved the existing update, activity, mini-audit, outreach, and offer actions
- Kept the one-page operator context intact
- Kept technical metadata secondary and collapsible
- Kept the page dense and scanable instead of introducing a workflow split
- Kept the approved light E020 surface language and focus treatment

## Notes

- This route already uses the approved E020 light CRM foundation and shadboard-derived surface language.
- Validation is protected by `tests/lead-detail-light-proof.test.ts`.
- No persistence, schema, or route hierarchy changes were needed for this slice.
