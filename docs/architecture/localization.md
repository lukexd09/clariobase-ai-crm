# E010 localization architecture

## Status and scope

This is the implemented localization contract for E010/#45 and child tasks #46 and #206–#211. The application supports exactly `pl-PL` and `en-US`. Polish is selected from a Polish browser preference; English is both a supported locale and the deterministic fallback.

Localization covers application-owned presentation copy. It does not translate persisted values, user-authored content, imported content, identifiers, routes, API payload contracts, audit payloads, or developer logs.

## Decision

Use a small repository-owned, dependency-free, typed runtime:

```text
src/i18n/config.ts
src/i18n/types.ts
src/i18n/translate.ts
src/i18n/taxonomy.ts
src/i18n/dictionaries/en-US.ts
src/i18n/dictionaries/pl-PL.ts
src/i18n/resolve-request-locale.ts
src/i18n/server.ts
src/i18n/provider.tsx
src/i18n/format.ts
src/lib/form-date-time.ts
src/app/layout.tsx
```

The English dictionary defines the complete key schema. The Polish dictionary is checked for key and interpolation-placeholder parity. No i18n package is needed: two locales, no locale routes, no message extraction pipeline, and no persisted preference justify framework or dependency overhead.

## Locale resolution

`Accept-Language` is the only locale source. Resolution happens on the server for every request.

| Input | Result |
| --- | --- |
| `pl`, `pl-PL`, any valid `pl-*` | `pl-PL` |
| `en`, `en-US`, any valid `en-*` | `en-US` |
| weighted supported ranges | supported range with highest positive `q`; source order breaks ties |
| supported range with `q=0` | excluded |
| unsupported, malformed, missing, empty, or wildcard-only | `en-US` |

Parsing is deterministic, pure, and fail-closed. Language ranges are case-insensitive. Any syntactically malformed range, unexpected parameter, duplicate `q`, non-numeric `q`, or `q` outside `0..1` makes the entire header invalid and resolves directly to `en-US`; no later entry is considered. A syntactically valid but unsupported range is skipped, so a later supported positive-weight range may win. Wildcards never select Polish or English. If no supported range remains, fallback is `en-US`.

No client code reads `navigator.language`. A browser-language change takes effect on a new request or reload.

## Server and client boundary

The root layout reads `headers()` and resolves locale once. That value controls:

1. server translations and metadata;
2. `<html lang="pl-PL|en-US">`;
3. serialized dictionary and locale passed to the root provider;
4. client translations during hydration and navigation;
5. all presentation formatting helpers.

The provider receives the server-selected locale and dictionary as props. It has no independent resolver and no mount-time locale change, preventing language flash and hydration mismatch. Server Components use request-scoped helpers. Client Components use a provider hook. Static machine endpoints remain outside the provider contract.

## Dictionary and translation API

`en-US.ts` is the required canonical dictionary. Translation keys are stable dotted identifiers grouped by surface, for example `navigation.leads`, `lead.form.businessName`, and `notice.lead.updated`. Keys are not rendered as fallback copy.

Expected API:

```ts
const { locale, messages, t, formatDate, formatDateTime, formatNumber,
  formatPercent, formatCurrency } = await getI18n(); // server
const { locale, t, formatDate, formatDateTime, formatNumber,
  formatPercent, formatCurrency } = useI18n();       // client
```

Interpolation uses named placeholders such as `{count}`. Values are converted to text without evaluating markup. Dictionary validation proves key parity and exact placeholder-name parity. Missing English is an error. A missing Polish entry may fall back to the canonical English entry at runtime, but committed dictionaries must pass parity checks; fallback is a safety net, not an incomplete-translation policy. Raw keys must never reach UI.

Rich translated JSX is avoided. Components compose translated short strings with trusted React elements. User content passed into interpolation remains data, not translatable copy.

## Formatting

All human-facing dates, times, numbers, percentages, and currencies use shared wrappers around `Intl` with the request locale. Helpers accept explicit options and preserve stored currency codes and numeric values. Date/time helpers use the explicit IANA zone `Europe/Warsaw` on both server and client, so rendering does not depend on host/browser time zone. Inputs are `Date`, epoch milliseconds, or validated ISO instants; invalid inputs return the documented localized unavailable value rather than throwing during render.

```text
pl-PL -> Polish date/number conventions
en-US -> United States English conventions
```

Technical transport values remain unchanged: ISO timestamps in machine payloads, `datetime-local` input serialization, database decimals, CSV/raw import fields, IDs, and health/readiness payloads. Currency conversion and business calculations are forbidden; only display formatting changes.

Date-only business fields stay calendar dates: `formatDate()` recognizes validated `YYYY-MM-DD` values and does not reinterpret them as timestamp instants. Timestamp helpers convert instants to `Europe/Warsaw`. Client Components receive the same locale and formatter policy through the provider, eliminating server/client time-zone drift.

## Metadata

Root metadata uses the same request locale as rendering. Route-specific titles and descriptions use server translation helpers or localized metadata functions when introduced. Open Graph or other application-owned metadata follows the same rule. URLs and technical identifiers are not localized.

## Stable technical-value boundary

These values never change:

- Prisma enums and database values;
- route and API paths;
- action names and audit operation codes;
- notice/error codes;
- IDs, customer IDs, slugs, email addresses, URLs;
- stored currency codes and business calculations;
- Better Auth behavior and authorization rules;
- readiness and machine health response fields/values.

UI maps stable values to translation keys. Exhaustive typed maps cover lead status/priority, package fit, activity type, draft/channel/import/duplicate status, and admin role/state. Unknown values use a localized presentation fallback without rewriting the source value.

Server actions return stable codes and structured field issues where a user-visible result crosses the server/client boundary. Rendering selects localized text. Developer diagnostics may keep English internal messages but must not be presented as application copy.

## Content boundary

Translate application-owned navigation, metadata, labels, buttons, placeholders, helper text, accessibility names, state labels, validation notices, empty/loading/error states, and sample/demo guidance authored by the application.

Never automatically translate business names, people, emails, addresses, URLs, imported lead fields, notes, user messages, outreach message bodies, offer body content, raw import snapshots, audit payloads, or developer logs. Surrounding labels and actions are localized while these values pass through byte-for-byte.

## Polish glossary

| English concept | Polish UI term | Decision |
| --- | --- | --- |
| lead | lead | Established Polish CRM term; avoids implying a confirmed customer. |
| leads | leady | Natural operator-facing plural. |
| dashboard | pulpit | Short, familiar application term. |
| workbench / work | panel pracy | Describes operational queue, not a physical workstation. |
| pipeline | lejek sprzedaży | Business meaning over literal technical wording. |
| next action | następne działanie | Consistent across forms, queues, and reports. |
| due today | na dziś | Compact operational label. |
| overdue | po terminie | Clear action state. |
| priority | priorytet | Standard business term. |
| package fit | dopasowanie pakietu | Recommendation, not an assigned package. |
| mini-audit | mini-audyt | Product artifact name remains recognizable. |
| outreach | kontakt wychodzący | Describes operator-initiated communication. |
| message plan | plan kontaktu | Natural umbrella for channel, message, and follow-up. |
| outreach draft | szkic kontaktu | UI artifact, distinct from user-authored message body. |
| offer draft | szkic oferty | Draft remains non-final. |
| duplicate candidate | potencjalny duplikat | Matching suggestion, not confirmed duplicate. |
| keep separate | pozostaw osobno | Review decision without merge implication. |
| import batch | partia importu | One processed import unit. |
| won / lost | wygrany / przegrany | Sales outcome labels. |
| do not contact | nie kontaktować się | Explicit operational restriction. |
| archived | zarchiwizowany | Inactive record state. |
| sign in / sign out | zaloguj się / wyloguj się | Standard account actions. |

Business names such as ClarioBase and package codes/names stored as data are not translated.

### Canonical technical-value labels

These mappings define labels only; left-hand values remain unchanged in Prisma, storage, queries, and actions.

| Technical family | Value → `en-US` / `pl-PL` label |
| --- | --- |
| `LeadStatus` | `NEW` → New / Nowy; `QUALIFIED` → Qualified / Zakwalifikowany; `TO_AUDIT` → To audit / Do audytu; `AUDITED` → Audited / Po audycie; `CONTACTED` → Contacted / Skontaktowano; `REPLIED` → Replied / Odpowiedział; `DISCOVERY_SCHEDULED` → Discovery scheduled / Rozmowa zaplanowana; `OFFER_SENT` → Offer sent / Oferta wysłana; `WON` → Won / Wygrany; `LOST` → Lost / Przegrany; `NURTURE` → Nurture / Do podtrzymania; `BAD_FIT` → Bad fit / Niedopasowany; `DO_NOT_CONTACT` → Do not contact / Nie kontaktować się; `ARCHIVED` → Archived / Zarchiwizowany. |
| `LeadPriority` | `LOW` → Low / Niski; `MEDIUM` → Medium / Średni; `HIGH` → High / Wysoki; `URGENT` → Urgent / Pilny. |
| `PackageFit` | `UNKNOWN` → Unknown / Nieustalone; `BASE` → Base / Base; `CLARITY` → Clarity / Clarity; `MOMENTUM` → Momentum / Momentum; `NOT_FIT` → Not a fit / Brak dopasowania. Package names remain product names. |
| `ActivityType` | `NOTE` → Note / Notatka; `CALL` → Call / Rozmowa; `MESSAGE` → Message / Wiadomość; `STATUS_CHANGE` → Status change / Zmiana statusu; `AUDIT` → Audit / Audyt; `OTHER` → Other / Inne. |
| `MiniAuditStatus` | `DRAFT` → Draft / Szkic; `READY_FOR_REVIEW` → Ready for review / Gotowy do weryfikacji; `APPROVED` → Approved / Zatwierdzony; `ARCHIVED` → Archived / Zarchiwizowany. |
| `OutreachDraftStatus` | `DRAFT` → Draft / Szkic; `READY` → Ready / Gotowy; `SENT_MANUALLY` → Sent manually / Wysłany ręcznie; `ARCHIVED` → Archived / Zarchiwizowany. |
| `OfferDraftStatus` | `DRAFT` → Draft / Szkic; `READY` → Ready / Gotowy; `SENT_MANUALLY` → Sent manually / Wysłany ręcznie; `ACCEPTED` → Accepted / Przyjęty; `REJECTED` → Rejected / Odrzucony; `ARCHIVED` → Archived / Zarchiwizowany. |
| `OutreachChannel` | `EMAIL` → Email / E-mail; `INSTAGRAM_DM` → Instagram DM / Wiadomość na Instagramie; `FACEBOOK_DM` → Facebook DM / Wiadomość na Facebooku; `PHONE_CALL` → Phone call / Rozmowa telefoniczna; `OTHER` → Other / Inny. |
| `ImportBatchStatus` | `RUNNING` → Running / W toku; `COMPLETED` → Completed / Zakończony; `COMPLETED_WITH_ERRORS` → Completed with errors / Zakończony z błędami; `FAILED` → Failed / Nieudany. |
| `ImportRowStatus` | `CREATED` → Created / Utworzony; `UPDATED` → Updated / Zaktualizowany; `REJECTED` → Rejected / Odrzucony; `SKIPPED` → Skipped / Pominięty. |
| `ImportSourceType` | `LOCAL_JSON` → Local JSON / Lokalny JSON; `HARVESTER_EXPORT` → Harvester export / Eksport Harvester; `MANUAL_AI_PREPARED_FILE` → Manually prepared AI file / Ręcznie przygotowany plik AI. |
| `DuplicateCandidateStatus` | `OPEN` → Open / Otwarty; `NEEDS_REVIEW` → Needs review / Wymaga weryfikacji; `DISMISSED` → Dismissed / Odrzucony; `RESOLVED` → Resolved / Rozstrzygnięty. |
| admin role/state | `admin` → Administrator / Administrator; `user` → User / Użytkownik; `banned=false` → Active / Aktywny; `banned=true` → Disabled / Wyłączony; active session → Active session / Aktywna sesja; expired session → Expired session / Wygasła sesja; revoked session → Revoked session / Unieważniona sesja. |

### Canonical system, report, and validation terms

| English | Polish |
| --- | --- |
| System status | Stan systemu |
| Healthy / Unavailable | Sprawny / Niedostępny |
| Sales report | Raport sprzedaży |
| Lead status summary | Podsumowanie statusów leadów |
| Priority summary | Podsumowanie priorytetów |
| Package fit summary | Podsumowanie dopasowania pakietu |
| Workbench health | Stan panelu pracy |
| Draft readiness | Gotowość szkiców |
| Activity summary | Podsumowanie aktywności |
| Required field | Pole wymagane |
| Invalid value | Nieprawidłowa wartość |
| Invalid date | Nieprawidłowa data |
| Not found | Nie znaleziono |
| Could not load | Nie udało się wczytać |
| Save failed / Saved | Nie udało się zapisać / Zapisano |
| Loading / No results | Wczytywanie / Brak wyników |
| Unknown IP / Unknown client | Nieznany adres IP / Nieznany klient |
| Authentication required | Wymagane logowanie |
| Active administrator access required | Wymagane uprawnienia aktywnego administratora |
| Revoke session(s) | Unieważnij sesję / Unieważnij wszystkie sesje |

## Exceptions

Allowed hardcoded presentation exceptions are narrow and executable in `scripts/verify-localization.ts`, with file, exact value, and reason mirrored in `docs/verification/e010-localization-completeness.md`. Categories are product/platform brand names, invariant environment marker `TEST`, decorative glyphs hidden from assistive technology, and symbol-only navigation adornments. `TEST` remains invariant because it is an environment safety marker, but its accessible explanation is localized.

Test fixtures, developer logs, CSS classes, identifiers, query values, and raw imported examples are outside hardcoded-copy enforcement; they are not presentation exceptions.

## Adding new UI copy

1. Add a stable dotted key to the canonical `en-US` dictionary.
2. Add the same key to `pl-PL` with exactly the same named placeholders.
3. Render it with server `getI18n().t` or client `useI18n().t`; do not use rich translated JSX.
4. For enums or result codes, extend a typed key map without changing the technical value.
5. Format dates, numbers, percentages and currencies with the shared locale helpers.
6. Keep user/imported/audit content outside translation interpolation unless it is only embedded as a value.
7. Run `pnpm verify:localization`, `pnpm test:fast` and the relevant disposable Playwright area.

## Adding a future language

A third locale requires an explicit product change. Extend `SUPPORTED_LOCALES` and `Locale`, add a complete dictionary, register it in `translate.ts`, teach the resolver its primary-language range, and replace the current two-locale unavailable-value branch in `format.ts`. Then add parity, placeholder, resolver, formatter and browser-context proof, and update this document and glossary. Partial dictionaries are not accepted as committed state.

## Deferred manual and persistent selection

Manual selection remains intentionally deferred. There is no switcher, locale route, cookie, local storage value, user/organization preference or database field. A browser-language change is applied on a new request or reload. Adding persistence requires a separate precedence and hydration design; it is not hidden inside the current resolver.

## Verification

- `pnpm verify:localization` — AST dictionary, hardcoded-copy and presentation-format audit.
- `pnpm test:fast` — typed runtime, parity, placeholder, fallback, content-boundary and route contracts.
- `pnpm test:e2e:area i18n` — disposable browser matrix, hydration, client navigation and representative routes.
- `pnpm test:full` and `pnpm build` — integrated regression proof.

## Delivery ownership

- T002/#206: runtime, resolver, dictionaries, root integration, metadata foundation, formatting helpers, integrity tests.
- T003/#207: shell/navigation/auth/account/shared UI, environment marker context, notices, accessibility defaults, exhaustive technical-value label maps.
- T004/#208: dashboard, workbench, leads list/detail, activities, mini-audits, outreach and offer draft UI/actions.
- T005/#209: imports, duplicates, reports, admin, health presentation, not-found, remaining metadata/system UI.
- T006/#210: refreshed inventory, parity/copy/format/a11y audits, browser proof, approved exception list.
- T007/#211: independent integrated audit and final evidence.

## Non-goals

No language preference, database or Prisma change, Better Auth field, organization setting, cookie, local storage, switcher, `/pl` or `/en` route, translation service, automatic translation, production/preview deployment, or mutation of persistent/real data.
