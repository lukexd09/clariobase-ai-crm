---
document_id: DOC-E010-EPIC-QUALITY-AUDIT
epic: E010
work_item: E010.T007 / #211
status: local-assurance-pass-external-ci-evidence
date: 2026-07-21
---

# E010 Epic Quality Audit

## Verdict and immutable references

Local audit verdict: **PASS after corrections**. Final exact-head CI and whole-diff review results are recorded in #211 and the Draft PR before this task closes.

| Reference | SHA |
| --- | --- |
| audited `origin/main` base and merge-base | `f4bd93aba1f5ed1e41e0611586c6f11585ffa767` |
| T006 integrated implementation head | `63500199d3c6bb53585d2c6987bcd145cdeff7e7` |
| T007 accepted correction head | `d76047305bf64b09e6e364fe79e238dd7676a44e` |

The report commit cannot contain its own Git object ID. Its exact SHA and the exact-head CI run are therefore recorded in #211 and the Draft PR. The implementation audit target above is immutable; the report commit adds evidence only.

Task commits audited in order:

| Task | Commit |
| --- | --- |
| T001 / #46 | `d94f4caff4452d9dca2a950ccfc360aff4cff684` |
| T002 / #206 | `0ad81efa2af8ba614c8be73d502fa8ea35f5d86a` |
| T003 / #207 | `0e9031741a9f96c1537651ed9090006be0bfa119` |
| T004 / #208 | `83347d90658da24d386b55b0d65f7161467a1eb1` |
| T005 / #209 | `fe4fcb981009c9b61a25f366dc7f6641559254fd` |
| T006 / #210 | `63500199d3c6bb53585d2c6987bcd145cdeff7e7` |
| T007 correction / #211 | `d76047305bf64b09e6e364fe79e238dd7676a44e` |

## Architecture and locale resolution

- Supported locales are exactly `pl-PL` and `en-US`.
- `pl` and `pl-*` canonicalize to `pl-PL`; `en` and `en-*` canonicalize to `en-US`.
- Unsupported, missing, syntactically invalid, and wildcard-only headers fall back to English.
- Positive weights and stable source ordering decide between supported ranges; `q=0` excludes a range.
- The server resolves `Accept-Language` once. The same locale drives the dictionary, metadata, server render, `<html lang>`, client provider, and all presentation formatters.
- Client navigation proof uses a `window` sentinel that survives an App Router transition but cannot survive a document reload. Locale and `lang` remain `pl-PL` after the transition.
- No `navigator.language` resolver, preference field, user/organization setting, cookie, local storage, manual switcher, or `/pl`/`/en` route exists.

## Dictionary and copy integrity

The TypeScript-AST audit reports 628 English and 628 Polish keys with:

- zero duplicate source keys;
- exact key and interpolation-placeholder parity;
- complete canonical English fallback;
- no unknown literal `t()` key;
- no raw-key fallback in browser or unit proof;
- no unexplained active hardcoded presentation copy;
- no stale allowlist entry;
- no unexplained direct presentation formatter.

Intentional literal exceptions are limited to brand/technical presentation: `ClarioBase`, the `C` brand mark, the `TEST` environment glyph, the informational `i`, direction/version glyphs, and the provider names Instagram/Facebook. Technical `en-CA` use is limited to stable numeric `datetime-local` serialization/parsing. Exact file/value/reason entries live in `scripts/verify-localization.ts` and are executable regression evidence.

A future locale must extend `SUPPORTED_LOCALES` and `Locale`, add a complete dictionary, register it in `translate.ts`, add resolver mapping, update unavailable-value behavior, and add parity, placeholder, formatter, resolver, browser, documentation, and glossary proof. Partial committed dictionaries are forbidden.

## Complete active UI coverage

| Surface | Polish/English evidence | States and boundaries |
| --- | --- | --- |
| `/`, shell, navigation, account UI | unit/source + authenticated browser | headings, priorities, pipeline, desktop/mobile nav, sign-in/out, client navigation |
| `/sign-in` | five request-locale contexts + auth tests | SSR/hydration, metadata, loading, error, anonymous redirect |
| `/work` | unit/source + PL/EN browser | groups, counts, urgency, empty copy, stored business values |
| `/leads`, `/leads/[id]` | unit/source + PL/EN browser | filters, pagination, forms, activities, drafts, notices, dates, numbers, currency |
| `/imports`, `/imports/[id]` | unit/source + PL/EN browser | row/batch statuses, empty/validation UI, raw imported evidence verbatim |
| `/duplicates`, `/duplicates/[id]` | unit/source + PL/EN browser | confidence/reasons, stable decision notice, known labels localized, unknown evidence verbatim |
| `/reports/sales` | report tests + PL/EN browser | KPI/count/status/package/activity formatting; calculations unchanged |
| `/admin/users` | admin tests + PL/EN authorized and PL negative browser | labels/notices/sessions; anonymous and ordinary users denied; admin behavior unchanged |
| `/health`, `/api/ready` | unit/runtime + PL/EN browser | localized presentation; machine service/status/checks/ISO timestamp unchanged |
| not-found UI | PL/EN browser | localized heading/action and request `lang` |
| root metadata, environment indicator, shared controls/notices | AST/unit/source + browser | localized metadata/a11y/loading/error/success; stable `TEST` technical glyph |

The refreshed T006 inventory has no unassigned active surface. Inactive `src/lib/homepage.ts` constants are not imported by active UI.

## Formatting and terminology

All human-facing dates, date/times, numbers, percentages, and currencies use shared locale-aware formatters. Timestamp presentation and `datetime-local` round-trip use `Europe/Warsaw`, removing server/browser host-zone drift. Date-only values remain calendar dates. ISO machine timestamps remain unchanged.

Currency formatting never converts amounts or rewrites stored codes. ISO-like three-letter codes use `Intl`; a previously accepted non-letter three-character stored code is displayed verbatim beside the localized number. The baseline trim/exact-length/uppercase write contract is preserved.

Canonical Polish decisions include: `lead/leady`, `pulpit`, `panel pracy`, `lejek sprzedaży`, `następne działanie`, `mini-audyt`, `kontakt wychodzący`, `szkic kontaktu`, `szkic oferty`, `potencjalny duplikat`, and `partia importu`. Product/package names and business data are not translated.

## Stable values, auth, health, and content boundary

- No Prisma schema, migration, enum, `src/app/api` route, or canonical lead/activity value definition changed in the epic diff.
- Routes, API paths, object/customer IDs, query values, action/audit operation identifiers, stable notice codes, stored currency, and report calculations remain technical values.
- Server actions localize only at the rendering boundary through allowlisted codes; authorization status and persistence operations remain unchanged.
- Better Auth configuration and the admin firewall remain intact. Disposable browser proof covers active admin access, anonymous denial, ordinary-user denial, sign-out, and locale stability.
- `/health` remains non-cacheable presentation; `/api/ready` retains `service`, `status`, `checks.database`, `checks.authentication`, and ISO `timestamp` contracts.
- Business names, people, emails, addresses, URLs, imported fields, notes, messages, draft/offer bodies, raw validation snapshots, audit payloads, and unknown duplicate evidence pass through verbatim.
- No production, preview, real user, real session, persistent database, secret, DNS, hosts, certificate, firewall, or persistent Docker volume was touched.

## Browser matrix

| Context | Expected | Result |
| --- | --- | --- |
| `pl-PL` | Polish | PASS |
| `en-US` | English | PASS |
| `de-DE` | English fallback | PASS |
| `en-US;q=0.8,pl-PL;q=0.9` | Polish | PASS |
| `pl-PL;q=0.8,en-US;q=0.9` | English | PASS |

The focused Playwright area contains 10 scenarios: five exact request contexts, localized mobile navigation, localized auth loading/error, authenticated sign-out, anonymous/ordinary-user admin denial, and the authenticated PL/EN representative workflow. It asserts document `lang`, visible copy, metadata, raw stored/imported content, stable-code notices, client navigation, lack of hydration localization errors, admin access boundaries, health/readiness, and not-found UI. Data, users, sessions, and PostgreSQL are disposable and automatically cleaned.

## Findings and correction loop

| Finding | Severity | Correction | Proof | Status |
| --- | --- | --- | --- | --- |
| T006 client-navigation assertion compared navigation-entry counts and could miss a reload | major | replaced with browser-window sentinel | E2E 10/10 and T006 reviewer rerun | closed |
| T007 audit found offer currency validation had narrowed the baseline three-character contract | major | restored exact baseline acceptance; safe raw-code display for non-ISO values | focused schema/formatter tests, fast suite, independent rerun | closed in `d760473` |
| T007 audit found no anonymous/ordinary-user `/admin/users` browser denial proof | major | disposable ordinary user fixture plus negative PL route proof | E2E 10/10, independent rerun | closed in `d760473` |
| T007 boundary subaudit questioned fixed Warsaw `datetime-local` parsing | evaluated | no code change; independent Sol adjudicated it preserves instant round-trip and removes host-zone dependence | winter/summer/DST overlap/gap tests | not a finding |

Correction cycles used: two. One T007 focused correction commit was created; no extra branch or worktree was used.

## External formal CR findings

Formal review `4748019314` on Draft PR #212 changed the external verdict to **CHANGES REQUIRED** after the earlier local PASS. The review scope was `f4bd93aba1f5ed1e41e0611586c6f11585ffa767...e27808cbed4b0e8eea56d9d3ad8b7d9c16cfb37e`.

| Finding | Severity | Root cause | Correction | Test proof | Correction commit | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `datetime-local` autumn DST fold could shift an unchanged existing timestamp by one hour | P1 data integrity | `formatDateTimeLocalInput()` maps both Warsaw fold instants to the same visible `2026-10-25T02:30`; the parser chose the earlier candidate when no disambiguation was available | Local ambiguous values now fail validation unless an edit form submits a canonical hidden original ISO that matches the server-loaded existing instant; unchanged existing first/second fold instants return the exact DB instant; changed ambiguous values, spring gaps and tampered originals fail through existing stable `validation.*_invalid` codes | `corepack pnpm exec tsx --test tests/i18n.test.ts tests/t004-localization.test.ts`; `corepack pnpm exec tsx --test tests/t004-localization.test.ts tests/work-view.test.ts tests/activity.test.ts tests/lead-drafts.test.ts tests/offer-drafts.test.ts` | Current correction commit; exact SHA recorded in #211 and PR #212 after commit creation because a commit cannot contain its own hash | fixed, ready for re-review |
| Workbench `overdue / due today / upcoming` used Node process time zone while presentation used `Europe/Warsaw` | P1 operational correctness | `getWorkBuckets()` derived day boundaries with host-local `Date#setHours()` / `setDate()` | Workbench now gets `startOfPresentationDay` and `startOfNextPresentationDay` from explicit Warsaw calendar parts and existing Warsaw local parser; status exclusions, sort order, tie-breaks and preview limits are unchanged | `tests/work-view.test.ts` covers summer and winter near-midnight UTC hosts plus 23-hour spring and 25-hour autumn DST days; focused command above PASS | Current correction commit; exact SHA recorded in #211 and PR #212 after commit creation because a commit cannot contain its own hash | fixed, ready for re-review |

Scope guard: no Prisma schema change, no migration, no timezone persistence, no organization/user timezone setting, no new timezone library, no E017 KPI expansion, no production/preview/persistent data change.

## Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm install --frozen-lockfile` | PASS; lockfile current |
| `corepack pnpm prisma:validate` | PASS |
| `corepack pnpm prisma:generate` | PASS |
| `corepack pnpm verify:localization` | PASS; 628/628, zero findings |
| `corepack pnpm lint` | PASS |
| `corepack pnpm test:fast` | PASS; 114/114 after corrections |
| `corepack pnpm test:full` | PASS; fast 114/114 and infrastructure 84/84 |
| `corepack pnpm build` | PASS after corrections |
| `corepack pnpm test:e2e:area i18n` | PASS; 10/10 after corrections |
| `git diff --check` | PASS |
| exact-head GitHub CI | External evidence recorded in #211 and the Draft PR after this report commit |

## Independent review

- Architecture/UI subaudit: PASS, zero findings.
- Stable-value/content-boundary subaudit: CHANGES REQUIRED, then PASS after currency and admin-negative corrections.
- Independent GPT-5.6 Sol Epic Quality Audit: CHANGES REQUIRED, then implementation correction review PASS.
- Final report-head whole-diff review and exact-head CI are recorded in #211 and the Draft PR because that external evidence postdates this report content.

## Residual risks and manual user checks

- The AST audit covers repository-owned active TSX presentation, but future indirectly rendered constants could bypass `t()`; fast-suite enforcement materially reduces this risk.
- Request locale intentionally has no persistence. A browser-language change requires a new request/reload.
- The user should manually review natural Polish terminology and representative responsive layout in the Draft PR, then decide whether to merge.
- The user performs the merge. This task does not mark the PR Ready, merge it, or close any issue.

Production touched: **NO**. Preview touched: **NO**. Persistent data touched: **NO**.
