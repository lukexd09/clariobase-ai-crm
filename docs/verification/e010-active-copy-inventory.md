# E010 active copy inventory

## Snapshot

Inventory taken from `origin/main` at `f4bd93aba1f5ed1e41e0611586c6f11585ffa767` for E010.T001/#46. It covers all active App Router presentation routes plus shared server/client surfaces. API auth and readiness routes are listed only to preserve their machine contracts.

Ownership states below are planned delivery slices. `T002` supplies shared runtime; `T003` owns shared surfaces; `T004` owns core CRM work; `T005` owns remaining data/admin/system screens; `T006` re-audits the integrated branch.

## Route inventory

| Route/surface | Active source | Application-owned copy and formatting | Data that must pass unchanged | Owner |
| --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx`, `src/components/dashboard-page.tsx`, `src/components/dashboard-primitives.tsx`, `src/components/core-work-primitives.tsx`, `src/lib/homepage.ts` | dashboard heading/description, KPI labels, priority cards, pipeline snapshot, empty guidance, links, aria labels | company names, counts, IDs, dates from records | T004 |
| `/sign-in` | `src/app/sign-in/page.tsx`, `src/components/auth/sign-in-form.tsx` | title, helper copy, email/password labels, button/loading/error text, metadata/a11y | entered email, callback route, Better Auth codes | T003 |
| `/work` | `src/app/work/page.tsx`, `src/lib/work-view.ts` | panel title, bucket names/descriptions, table headings, empty states, open actions, dates, aria labels | company names, record values, query semantics | T004 |
| `/leads` | `src/app/leads/page.tsx`, `src/components/lead-filters.tsx`, `lead-table.tsx`, `lead-pagination.tsx`, `lead-status-pill.tsx`, `src/lib/lead-query.ts` | metadata/header, filters, sorting, chips, table headers, result range, pagination, status labels, dates, links/aria | business/contact/address fields, query values, enum values, IDs | T004; shared taxonomy from T003 |
| `/leads/[id]` | `src/app/leads/[id]/page.tsx`, `lead-update-form.tsx`, `activity-form.tsx`, `mini-audit-draft-form.tsx`, `outreach-draft-form.tsx`, `offer-draft-form.tsx` | breadcrumb, sections/tabs, field labels, placeholders, actions, helper/empty/error/success copy, artifact labels, dates/currency/a11y | lead data, notes, user messages, draft/offer bodies, IDs, stored currency/value | T004; shared taxonomy from T003 |
| `/imports` | `src/app/imports/page.tsx`, `src/lib/imports.ts` | title/description, batch/source/status labels, counters, headers, empty state, result links, dates/a11y | filenames, technical batch IDs, raw source fields | T005 |
| `/imports/[id]` | `src/app/imports/[id]/page.tsx`, `src/lib/imports.ts`, `src/lib/import-contract.ts` | batch/row labels, outcome summaries, headers, lead links, dates/numbers, technical-detail disclosure label | raw rows, imported business data, raw validation details, IDs | T005 |
| `/duplicates` | `src/app/duplicates/page.tsx`, `src/lib/duplicates.ts` | title/description, candidate/reason/status labels, comparison headers, empty state, review links, dates/a11y | business/contact data, score/evidence source values, IDs | T005 |
| `/duplicates/[id]` | `src/app/duplicates/[id]/page.tsx`, `src/app/duplicates/actions.ts`, `src/lib/duplicates.ts` | side-by-side labels, reasons, review decisions/actions/notices, technical disclosure labels, dates/a11y | compared record content, stable decision/status values, IDs | T005 |
| `/reports/sales` | `src/app/reports/sales/page.tsx`, `src/lib/sales-report.ts`, `sales-report-utils.ts`, `sales-status.ts` | report metadata/header, KPI/filter/section/table labels, pipeline descriptions, counts/percent/currency presentation | calculations, enum/group keys, stored values | T005 |
| `/admin/users` | `src/app/admin/users/page.tsx`, `actions.ts`, `src/lib/admin-user-notices.ts`, `user-admin-gateway.ts` | create/update/disable/reactivate/reset/session forms, role/state labels, notices, validation, dates, IP/client fallbacks | user names/emails, IDs, notice codes, audit ops, session/auth semantics | T005; notice renderer from T003 |
| `/health` | `src/app/health/page.tsx`, `src/lib/runtime-readiness.ts` | human page title, field labels, explanatory state text, metadata | service/status/timestamp values and readiness contract | T005 |
| `not-found` | `src/app/not-found.tsx` | heading, explanation, return action, metadata where applicable | route behavior | T005 |
| root layout/metadata | `src/app/layout.tsx` | dynamic `<html lang>`, root title/description, provider boundary | DOM structure and application brand | T002 foundation; remaining metadata T005/T006 |

## Shared presentation inventory

| Surface | Sources | Copy to localize | Owner |
| --- | --- | --- | --- |
| shell and desktop/mobile navigation | `src/components/app-shell.tsx`, `src/lib/navigation.ts` | group/item labels, primary-nav aria label, mobile menu/open/close text, current-route semantics | T003 |
| account/auth UI | `src/components/auth/account-chip.tsx`, `sign-out-button.tsx`, `sign-in-form.tsx`, `src/lib/auth-context.ts` | account fallback labels, sign-in/out/loading/error states; normalize presented auth errors | T003 |
| environment indicator | `src/components/environment-indicator.tsx`, `src/lib/deployment-env.ts` | accessible description; invariant safety marker `TEST` may remain | T003 |
| feedback/empty/error/loading/pagination | `src/components/clariobase-ui/feedback.tsx`, `status.tsx`, `table.tsx`, `sheet.tsx`, `field.tsx`, `proof-card.tsx`, `button.tsx` | default aria labels, generic controls/states and dialog/sheet labels | T003 |
| CRM taxonomy | `src/lib/lead-values.ts`, `activity-values.ts`, `sales-status.ts`, generated Prisma enums | localized labels for all current enum values; never change source values | T003 |
| user-visible notices | `src/lib/admin-user-notices.ts`, lead/detail action files, duplicate/admin actions | stable code → localized render-boundary message; no raw key display | T003 mapping foundation; T004/T005 domain actions |
| validation | `src/lib/lead-form.ts`, `activity-form.ts`, `mini-audit-form.ts`, `outreach-draft-form.ts`, `offer-draft-form.ts`, admin actions | required/invalid/range notices, field-level result mapping | T004/T005 |
| application navigation/accessibility | all pages/components above | link/button names, table/nav/dialog labels, screen-reader-only copy | owning task; audited T006 |

## Required taxonomy coverage

T003 must supply exhaustive translation-key mappings for current technical values:

- `LeadStatus`, `LeadPriority`, `PackageFit`;
- `ActivityType`;
- `MiniAuditStatus`;
- `OutreachDraftStatus`, `OfferDraftStatus`, `OutreachChannel`;
- `ImportBatchStatus`, `ImportRowStatus`, `ImportSourceType`;
- `DuplicateCandidateStatus`;
- admin roles, enabled/disabled state, and session state shown in UI.

The map output is presentation only. Prisma enums, stored strings, request/query parameters, action identifiers, and audit values remain stable.

## Action and validation message inventory

Current lead action modules return English `message` strings for invalid input, not-found results, and created/updated success states:

```text
src/app/leads/actions.ts
src/app/leads/activity-actions.ts
src/app/leads/mini-audit-actions.ts
src/app/leads/outreach-draft-actions.ts
src/app/leads/offer-draft-actions.ts
```

Admin and duplicate actions already expose or can expose stable codes. Integrated design: retain/add stable codes or structured issue identifiers, then translate at render boundary. Mutation semantics, HTTP/auth behavior, and audit operations do not change. Raw Better Auth/internal error messages are normalized before presentation rather than translated as arbitrary data.

Zod schemas contain English user-facing messages in `src/lib/*-form.ts`. Their UI result must become a stable validation identifier or localized at request/render boundary without changing accepted input or validation rules.

## Formatting inventory

Human presentation currently hardcodes `en-GB`/`en-US` or manual formatting in:

```text
src/app/work/page.tsx
src/components/lead-table.tsx
src/components/activity-form.tsx
src/app/leads/[id]/page.tsx
src/app/imports/page.tsx
src/app/imports/[id]/page.tsx
src/app/duplicates/page.tsx
src/app/duplicates/[id]/page.tsx
src/app/admin/users/page.tsx
src/lib/lead-query.ts
```

Lead detail also manually combines stored currency and price. T002 provides shared formatters; T004/T005 migrate each human-facing call. Native `datetime-local` serialization and machine ISO timestamps remain technical formats and are not migrated.

## Metadata inventory

Root metadata is static English in `src/app/layout.tsx`; most routes have no route-local metadata. T002 localizes root foundation. T004 and T005 add localized route metadata where useful and ensure visible page headings/descriptions match dictionary terms. T006 checks root and active routes for remaining English application-owned metadata.

## Hardcoded-copy audit boundaries

Included: JSX text, user-visible component props/defaults, metadata, aria labels, placeholders, helper strings, label/description maps, rendered server-action and validation messages, and application-authored empty/loading/error/demo guidance.

Excluded unless rendered as application copy: tests and fixtures, CSS/classes, IDs, routes, query values, technical names, developer logs, raw import/audit payloads, machine API/health responses, and user/imported content. Any surviving application-owned literal requires a narrow file/value/reason entry in `e010-localization-completeness.md`.

## Delivery checklist

- T002: server-only resolver, root provider, typed dictionaries, interpolation/fallback proof, dynamic lang/metadata, formatters.
- T003: shared shell/auth/UI/a11y/notice foundation and exhaustive taxonomy labels.
- T004: `/`, `/work`, `/leads`, `/leads/[id]` plus all embedded activity/audit/outreach/offer forms and actions.
- T005: imports, duplicates, sales report, admin, health, not-found, remaining metadata/system copy.
- T006: rescan all listed sources and routes, verify dictionary/placeholder parity, formatting and hardcoded exceptions, then browser proof.
- T007: independently audit exact integrated head.

No active presentation route is unassigned.

## Server/client boundary and current proof ledger

Each active surface has an explicit integration boundary and known E010 gap. Existing tests prove current workflow/layout contracts only; none proves locale behavior before T002–T006.

| Surface | Server/client boundary | Existing proof on `main` | E010 gap and planned proof |
| --- | --- | --- | --- |
| `/` | async Server Component selects auth state; dashboard server data flows into shared components; anonymous branch renders client sign-in form | `homepage.test.ts`, `shadboard-dashboard.test.ts`, `dashboard-density.test.ts` | T004 localized authenticated/anonymous render; T006 browser locale and hydration proof |
| `/sign-in` | server page and Suspense boundary render client form; provider locale must be identical on first render and router refresh | `auth-redirect.test.ts`, `auth-runtime-config.test.ts`, `e2e/public-signin.spec.ts` | T003 localized auth states/errors; T006 `pl-PL`, `en-US`, fallback and no-flash proof |
| `/work` | Server Component formats DB timestamps and renders links/tables; no local client resolver | `work-view.test.ts`, `light-core-work-screens.test.ts`, `shadboard-core-work-routes.test.ts` | T004 server translations/formatting; T006 browser navigation proof |
| `/leads` | server query/page copy plus client filter/pagination components under root provider | `leads-pagination.test.ts`, `light-core-work-screens.test.ts`, `shadboard-core-work-routes.test.ts` | T004 server/client copy, query-range formatting and taxonomy; T006 hydration/navigation proof |
| `/leads/[id]` | Server Component supplies records to multiple Client Component action forms; stable result codes cross action boundary | `lead-detail-light-proof.test.ts`, `activity.test.ts`, `lead-drafts.test.ts`, `offer-drafts.test.ts` | T004 localized action/validation results without changing user content; T006 browser form/surface proof |
| `/imports` | server-only list presentation and timestamp formatting | `light-remaining-list-detail-screens.test.ts`, `shadboard-data-quality-routes.test.ts` | T005 localized list/status/format; T006 fallback/browser proof |
| `/imports/[id]` | server-only detail; raw imported/validation data remains outside translator | same route-contract suites as `/imports` | T005 boundary tests proving raw content unchanged; T006 browser proof |
| `/duplicates` | Server Component list; action links only | `light-remaining-list-detail-screens.test.ts`, `shadboard-data-quality-routes.test.ts` | T005 localized evidence/status/date presentation; T006 browser proof |
| `/duplicates/[id]` | Server Component plus server actions; stable candidate decision values remain technical | same data-quality suites; action behavior covered by existing route contracts | T005 localized action notices and unchanged decisions; T006 browser proof |
| `/reports/sales` | server-only report aggregation and presentation; calculations remain in data layer | `sales-report.test.ts`, `light-core-work-screens.test.ts` | T005 localized metadata/sections/number formats; tests retain exact calculations; T006 browser proof |
| `/admin/users` | protected Server Component plus server actions; Better Auth/admin gateway remains authoritative | E011 proof scripts/docs plus `auth-runtime-config.test.ts`; current fast suite has no locale coverage | T005 localized UI/codes with auth/firewall/last-admin/self-lockout regression tests; T006 disposable-admin browser proof |
| `/health` | server-only human page; runtime readiness and `/api/ready` machine contract stay separate | `health-contract.test.ts`, `runtime-readiness.test.ts`, `health-endpoint.test.ts` | T005 localized presentation with byte-stable machine proof; T006 browser proof |
| `not-found` | server-rendered framework boundary under localized root provider | `light-remaining-list-detail-screens.test.ts` source contract | T005 localized content; T006 direct-browser and html-lang proof |
| root layout/metadata | root Server Component resolves headers once and serializes locale/dictionary into Client Provider/AppShell | `ui-foundation.test.ts`, `shadboard-shell-navigation.test.ts` cover structure only | T002 resolver/lang/metadata/provider tests; T006 hydration/no-flash proof |
| API auth | Route Handler owned by Better Auth, outside presentation translator | `auth-runtime-config.test.ts`, E011 proofs | regression only: no locale mutation and no contract change |
| `/api/ready` | Route Handler returns machine JSON, outside presentation translator | `health-contract.test.ts`, `runtime-readiness.test.ts`, `health-endpoint.test.ts` | byte/semantic regression proof; never translate payload |

## Shared boundary and proof ledger

| Shared surface | Boundary | Existing proof | E010 gap and owner |
| --- | --- | --- | --- |
| AppShell/navigation/mobile sheet | Client Components receive server-selected provider state; route/icon values stay static, labels become keys | `navigation.test.ts`, `shadboard-shell-navigation.test.ts`, `clariobase-ui-render.test.ts` | localized labels/a11y and unchanged routes/icons in T003; hydration in T006 |
| account/sign-out | Client Components call existing auth client; only rendered labels/errors localize | E011 auth proofs and auth runtime tests | localized loading/error/account fallbacks plus auth regression in T003 |
| environment indicator | client-safe static deployment state; marker invariant, accessible explanation localized | `environment-indicator.test.tsx`, `deployment-env.test.ts` | provider-driven accessible copy and unchanged production hiding in T003 |
| shared feedback/table/sheet/field | pure/server-capable primitives and client sheet boundary; defaults must obtain translated caller props or provider copy | `clariobase-ui-boundary.test.ts`, `clariobase-ui-render.test.ts`, `ui-foundation.test.ts` | localized default aria/state copy in T003; a11y audit T006 |
| taxonomy label maps | pure typed presentation helpers usable from server/client; no database write path | `navigation.test.ts`, `sales-report.test.ts` cover subsets | exhaustive enum-map tests in T003; parity/completeness in T006 |
| lead/detail action results | server actions return stable codes; Client Components translate codes from provider | existing activity/draft/offer behavior tests | code/message mapping and mutation-regression tests in T004 |
| admin/duplicate notices | server actions redirect with stable query codes or results; server render translates known codes | E011 admin proofs and route contracts | exhaustive localized code mapping, unknown fallback, security regression T005 |
| formatters | pure locale-explicit helpers shared by Server and Client Components; time zone fixed to `Europe/Warsaw` | no centralized formatter proof on `main` | input/locale/time-zone unit tests T002; all call sites audited T004–T006 |
