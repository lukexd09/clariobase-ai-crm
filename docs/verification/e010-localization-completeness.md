# E010 localization completeness

## Scope and audited state

This T006 report audits the integrated E010 branch after T005 base `fe4fcb981009c9b61a25f366dc7f6641559254fd`. The T006 commit SHA is recorded in issue #210 evidence because a commit cannot truthfully contain its own hash.

Verdict before independent review: implementation complete; final command results are recorded below after the integrated rerun.

## Refreshed route and component coverage

The authoritative integrated table is in `docs/verification/e010-active-copy-inventory.md`. It covers `/`, `/sign-in`, `/work`, `/leads`, `/leads/[id]`, `/imports`, `/imports/[id]`, `/duplicates`, `/duplicates/[id]`, `/reports/sales`, `/admin/users`, `/health`, not-found, root metadata, shell/account/environment UI, shared forms/dialogs/tables/feedback, notices, taxonomy and formatting.

Unassigned active user-facing surfaces: none.

## Dictionary audit

`scripts/verify-localization.ts` parses dictionary source with the TypeScript AST before module execution. It proves:

- exact `en-US`/`pl-PL` key parity;
- exact named-placeholder parity;
- no duplicate source properties hidden by JavaScript object evaluation;
- complete canonical English fallback;
- every literal `t("key")` in production source exists in canonical English;
- deterministic missing-Polish fallback returns English copy, never a raw key.

Committed count at audit time: 628 unique English keys and 628 unique Polish keys.

Unused-key enforcement is intentionally report-only/deferred: taxonomy and notice keys are reached through typed maps, so a simple textual gate would create material false positives. Exact map coverage is tested separately.

## Hardcoded-copy audit

The repository-owned AST audit scans active `.tsx` files under `src/app` and `src/components`. It inspects JSX text, direct JSX expressions, metadata-like properties and literal user-facing props including labels, placeholders, descriptions, headings and accessibility names. It excludes classes, routes, IDs, query values, data-layer fixtures and translated `t()` calls by syntax rather than by a broad text regex.

The allowlist is executable in `HARDCODED_COPY_EXCEPTIONS`; the test fails for both an unexplained finding and a stale exception.

### Approved hardcoded-copy exceptions

| File | Exact value | Reason |
| --- | --- | --- |
| `src/components/app-shell.tsx` | `C` | Brand-mark glyph hidden from assistive technology. |
| `src/components/app-shell.tsx` | `ClarioBase` | Product brand name. |
| `src/components/auth/sign-in-form.tsx` | `ClarioBase` | Product brand name. |
| `src/components/environment-indicator.tsx` | `TEST` | Invariant safety watermark; screen-reader description is localized. |
| `src/components/clariobase-ui/status.tsx` | `i` | Decorative information glyph hidden from assistive technology. |
| `src/app/duplicates/[id]/page.tsx` | `&larr;` | Symbol-only back arrow beside localized copy. |
| `src/app/leads/[id]/page.tsx` | `v` | Decorative chevron hidden from assistive technology. |
| `src/app/leads/[id]/page.tsx` | `&rarr;` | Symbol-only forward arrow beside localized content. |
| `src/app/duplicates/[id]/page.tsx` | `Instagram` | Platform brand name. |
| `src/app/duplicates/[id]/page.tsx` | `Facebook` | Platform brand name. |

`src/lib/homepage.ts` contains unused historical English constants but has no importer under `src`; it is dead/non-rendered code, not an active presentation exception. User/imported content, raw unknown duplicate evidence and persisted activity/audit payloads are stored data and remain verbatim.

## Formatting audit and technical exceptions

Active presentation code has no fixed `en-GB`/`en-US` formatter and no direct `toLocale*` call. Dates, timestamps, numbers, percentages and currencies use shared locale helpers with `Europe/Warsaw`. Dashboard deadline fixtures now store ISO instants and use `formatDateTime` rather than translated time strings.

| File/contract | Exact value | Reason |
| --- | --- | --- |
| `src/i18n/format.ts` | `en-CA` | Stable numeric parts for technical `datetime-local` serialization. |
| `src/lib/form-date-time.ts` | `en-CA` | Stable Warsaw wall-clock parts for technical `datetime-local` parsing. |
| `src/app/health/page.tsx` | ISO timestamp, `clariobase-ai-crm`, `ok` | Machine contract values displayed verbatim; only surrounding presentation is localized. |
| `/api/ready` | machine JSON | Entire readiness payload is outside presentation localization. |

No storage value, report calculation, currency value or machine timestamp was changed.

## Metadata and accessibility audit

Root metadata, document `lang`, navigation names, mobile sheet controls, table captions, form labels/placeholders/hints, live feedback, action notices, empty states, health and not-found copy use the request-resolved locale. The product deliberately uses root-only metadata; active pages inherit that localized title/description rather than defining divergent route metadata.

The AST audit has no unexplained literal aria/label/placeholder finding. Browser proof collects hydration console/page errors and compares server HTML with post-hydration language.

## Browser context matrix

The disposable `i18n` Playwright area covers:

| Browser locale / `Accept-Language` | Expected | Anonymous | Authenticated/representative proof |
| --- | --- | --- | --- |
| `pl-PL` | Polish | sign-in SSR/hydration | shell, lead workflow, imports, duplicates, report, admin, health, 404 |
| `en-US` | English | sign-in SSR/hydration | same representative route families |
| `de-DE` | English fallback | sign-in SSR/hydration | fallback contract |
| `en-US;q=0.8,pl-PL;q=0.9` | Polish | sign-in SSR/hydration | resolver context |
| `pl-PL;q=0.8,en-US;q=0.9` | English | sign-in SSR/hydration | resolver context |

Authenticated proof also uses a real client-side shell link and a browser-window sentinel that survives only client navigation, retains the server locale without a document reload, checks raw imported/user evidence, executes a disposable duplicate decision and observes its localized stable-code notice. No production, preview or persistent database is contacted.

## Machine, auth and data boundaries

- Health/readiness service, state and ISO contracts remain unchanged.
- Admin authorization, last-admin/self-lockout policy and Better Auth calls remain unchanged.
- Report calculations and stable enum/query values remain unchanged.
- Business names, contacts, notes, draft bodies, imported rows, raw validation reasons, technical IDs and unknown duplicate evidence are never automatically translated.
- Known application-generated duplicate signals are translated by stable `signal`; unknown labels and all evidence values pass through verbatim.

## Commands and exact results

Final T006 evidence is populated after the integrated checks:

- `pnpm verify:localization`: PASS; 628 English keys, 628 Polish keys, zero duplicate, parity, placeholder, raw-copy, stale-exception, or formatting findings
- `pnpm lint`: PASS
- `pnpm test:fast`: PASS; 113/113
- `pnpm test:full`: PASS; fast 113/113 and infrastructure 84/84
- `pnpm test:e2e:area i18n`: PASS; 9/9 in the disposable Docker runtime
- `pnpm build`: PASS
- `git diff --check`: PASS

## Independent review and residual risk

Independent GPT-5.6 Sol review is required before T006 closes and is recorded in the work-item evidence rather than self-attested here. Manual/persistent language selection remains explicitly deferred. The only material operational risk is future UI copy bypassing `t()`; the AST audit and fast-suite gate now detect that class of regression for active presentation files.
