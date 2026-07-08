# E022.T005 Final UI QA

## Scope

Final QA pass for E022 after #184, #185, #187. This PR is docs-only and records the current exact-head assessment for the UGC-oriented UI cleanup plus the no-lower-layer audit. No product code changes were made for #183.

## Exact baseline

- Branch used: `feature/e022-t005-final-ui-qa`
- Base branch: `origin/epic/e020-shadboard-ui-foundation`
- Base SHA: `cfbc3ed7414a635b4040dfc25fda847606d866c3`
- Current HEAD SHA before this doc change: `cfbc3ed7414a635b4040dfc25fda847606d866c3`
- Working tree before changes: clean
- Final diff: docs-only
- Exact changed files in this PR: `docs/verification/e022-t005-final-ui-qa.md`

## Issues and PRs verified

- `#178` - open
- `#179` - closed/completed
- `#180` - closed/completed
- `#181` - closed/completed
- `#182` - closed/completed
- `#183` - open
- `#184` - merged
- `#185` - merged
- `#187` - merged

## Changed-surface inventory

### Shell / navigation

- Navigation is already workspace-oriented in [`src/lib/navigation.ts`](C:\Serwer\Projekty\Clariobase\clariobase-ai-crm-e022-copy\src\lib\navigation.ts:22), with `Workspace`, `Daily work`, `Leads`, `Imports`, and `System status`.
- The remaining `Sales` route label is still visible in the navigation data and should be treated as deferred route/domain cleanup, not as an implementation blocker for E022.

### Dashboard / home

- The dashboard surface in [`src/app/page.tsx`](C:\Serwer\Projekty\Clariobase\clariobase-ai-crm-e022-copy\src\app\page.tsx:5) still contains sales-era task copy such as `Send revised proposal`, `Send mini-audit summary`, and `No next action was created after the proposal was sent.`
- The page is operational, but this baseline still carries old language in the visible priority card copy.

### `/work`

- [`src/app/work/page.tsx`](C:\Serwer\Projekty\Clariobase\clariobase-ai-crm-e022-copy\src\app\work\page.tsx:37) still shows `Sales workbench`.
- The queue itself is scannable, but the eyebrow keeps the sales-workflow framing visible.
- Column labels such as `Package`, `Next action`, and `No next action` are still present.

### `/leads`

- [`src/app/leads/page.tsx`](C:\Serwer\Projekty\Clariobase\clariobase-ai-crm-e022-copy\src\app\leads\page.tsx:32) still shows `Lead CRM`.
- The list and filters remain usable, but the eyebrow still advertises the old CRM framing.

### `/leads/[id]`

- [`src/app/leads/[id]/page.tsx`](C:\Serwer\Projekty\Clariobase\clariobase-ai-crm-e022-copy\src\app\leads\[id]\page.tsx:193) still uses `Lead workspace sections`.
- The lead detail page is otherwise structured around lighter workspace surfaces, but the navigation aria-label has not yet been neutralized in this baseline.
- Activity logging, technical metadata disclosure, and draft sections remain present and wired.

### Reports / operations exposure

- The `Sales` route label still exists in navigation data, while the route itself remains `/reports/sales`.
- For this E022 QA, that route name is deferred lower-layer cleanup rather than a blocker.

## UI wording review

Searches against current source show:

- Visible old terms still present in primary UI source:
  - `Sales workbench` in [`src/app/work/page.tsx`](C:\Serwer\Projekty\Clariobase\clariobase-ai-crm-e022-copy\src\app\work\page.tsx:37)
  - `Lead CRM` in [`src/app/leads/page.tsx`](C:\Serwer\Projekty\Clariobase\clariobase-ai-crm-e022-copy\src\app\leads\page.tsx:32)
  - `Lead workspace sections` in [`src/app/leads/[id]/page.tsx`](C:\Serwer\Projekty\Clariobase\clariobase-ai-crm-e022-copy\src\app\leads\[id]\page.tsx:193)
- Neutralized wording already present in other current surfaces:
  - `Workspace` in navigation
  - `Operator workspace` and `Workspace`-style labels in lead detail copy from earlier E022 work
  - `Review`, `Message plan`, `Draft preparation`, and `Next task` in the lead-detail forms and sections

Interpretation:

- Old terms inside historical docs, issue text, backend field names, and compatibility tests are not blockers by themselves.
- Old terms in current primary visible UI source are blockers.

## No-lower-layer audit

- No Prisma schema changes.
- No migrations.
- No package or lockfile changes.
- No auth changes.
- No preview workflow changes.
- No `tsconfig` changes.
- No server-action behavior changes.
- No persistence/query changes.
- No scoring/recommendation/import logic changes.
- No final UGC creator/campaign/brand model introduced.

## Local validation

- `corepack pnpm prisma:validate` - passed
- `corepack pnpm prisma:generate` - passed
- `corepack pnpm lint` - passed
- `corepack pnpm test:fast` - passed
- `corepack pnpm build` - passed
- `git diff --check` - passed

## Browser / preview review matrix

- Desktop width: not run in this QA pass.
- 768px/tablet width: not run in this QA pass.
- 360-390px mobile width: not run in this QA pass.
- 200% zoom: not run in this QA pass.
- Browser automation status: not available in this QA pass.

## Accessibility and responsive review

- The lead detail page still exposes the section navigation aria-label, activity log, draft sections, and technical details disclosure in source.
- No browser-level overflow or focus verification was executed in this docs-only pass.

## Owner review questions

1. Does this now feel like a UGC MVP workspace rather than a Clario sales CRM?
   - Answer: PENDING OWNER REVIEW

2. Is the lead/detail screen less overwhelming?
   - Answer: PENDING OWNER REVIEW

3. Is the operator’s next useful action still obvious?
   - Answer: PENDING OWNER REVIEW

4. Are we avoiding premature lower-layer/domain rewrites?
   - Answer: PENDING OWNER REVIEW

## Findings

| ID | Severity | Surface | Finding | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| F-01 | BLOCKER | `/work` | `Sales workbench` is still visible in the work header. | Blocked | Neutralize the workbench eyebrow in a follow-up UI pass. |
| F-02 | BLOCKER | `/leads` | `Lead CRM` is still visible on the leads page eyebrow. | Blocked | Replace the eyebrow with workspace-oriented wording. |
| F-03 | BLOCKER | `/leads/[id]` | `Lead workspace sections` is still visible in the lead-detail aria-label. | Blocked | Update the section-navigation aria-label to the neutral wording. |

## Deferred lower-layer cleanup

- Route/domain cleanup such as `/reports/sales` remains deferred.
- Backend field names such as `lead`, `packageFit`, `suggestedPackage`, `miniAuditDraft`, `offerDraft`, and `outreachDraft` remain as-is.
- Final UGC creator/campaign/brand model remains deferred to a later epic.
- Any remaining sales-derived status values or sample content should be handled in later lower-layer cleanup.

## Final decision

BLOCKED
