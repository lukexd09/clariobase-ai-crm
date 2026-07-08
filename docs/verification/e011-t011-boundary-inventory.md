# E011.T011 Boundary Inventory

| Path / boundary | Type | Decision | Reason |
| --- | --- | --- | --- |
| `/` | page | authenticated | CRM dashboard contains protected workspace data |
| `/leads` | page | authenticated | CRM lead list is business data |
| `/leads/[id]` | page | authenticated | Lead detail exposes workflow and mutation entry points |
| `/work` | page | authenticated | Protected operational workbench |
| `/duplicates` | page | authenticated | Duplicate review is CRM data |
| `/duplicates/[id]` | page | authenticated | Duplicate review detail is CRM data |
| `/imports` | page | authenticated | Import history is CRM data |
| `/imports/[id]` | page | authenticated | Import batch detail is CRM data |
| `/reports/sales` | page | authenticated | Sales report is CRM data |
| `src/app/layout.tsx` | layout | authenticated | Wraps the app shell around protected CRM pages |
| `src/app/not-found.tsx` | not-found | public | Generic missing-page response, not CRM data |
| `/sign-in` | page | public | Auth entry page |
| `/health` | page | operational-public | Explicit operational health endpoint |
| `/api/ready` | route handler | operational-public | Explicit readiness endpoint |
| `/api/auth/[...all]` | route handler | auth-owned | Better Auth boundary |
| `src/app/leads/actions.ts` | server action | authenticated | Lead mutation entry point |
| `src/app/leads/activity-actions.ts` | server action | authenticated | Activity mutation entry point |
| `src/app/leads/mini-audit-actions.ts` | server action | authenticated | Draft mutation entry point |
| `src/app/leads/offer-draft-actions.ts` | server action | authenticated | Draft mutation entry point |
| `src/app/leads/outreach-draft-actions.ts` | server action | authenticated | Draft mutation entry point |
| `src/app/duplicates/actions.ts` | server action | authenticated | Duplicate review mutation entry point |
| static assets and framework metadata | not-applicable/static | public | Static delivery only |
