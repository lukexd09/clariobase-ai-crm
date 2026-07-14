# Shadboard Adoption Decision

Decision status: GO
Date: 2026-06-29

## Historical T001 Base And Upstream

- Current `main` incorporated: `77d888947276ac079650a9eec58d0a84e4690bc6`
- Epic synchronization commit: `2363f540f0ef1a6d49e6eda1c0939d3d7b28eece`
- PR base SHA: `2363f540f0ef1a6d49e6eda1c0939d3d7b28eece`
- Repository: `https://github.com/Qualiora/shadboard`
- Pinned release: `v1.5.1`
- Pinned commit: `ece0dab7282175002f5103afbac6f86306169a4e`

## Licensing Evidence

The pinned Shadboard ref is MIT licensed. The current proof includes genuinely adapted source boundaries:

- `starter-kit/src/components/ui/card.tsx` -> `src/components/clariobase-ui/proof-card.tsx`
- `starter-kit/src/components/ui/button.tsx` -> `src/components/clariobase-ui/button.tsx`
- `starter-kit/src/components/ui/input.tsx` -> `src/components/clariobase-ui/field.tsx` (`Input` export only)
- `starter-kit/src/components/ui/card.tsx` -> `src/components/clariobase-ui/surface.tsx`

That adapted boundary requires MIT copyright and permission notice retention, which is recorded in [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

The shell/navigation proof remains reference-only:

- `starter-kit/src/app/layout.tsx` -> `src/components/app-shell.tsx`
- `starter-kit/src/components/ui/sidebar.tsx` -> `src/components/app-shell.tsx`
- `starter-kit/src/app/globals.css` -> `src/app/globals.css`

No Shadboard demo route or placeholder path was copied.

Project-owned primitives created for the new foundation and aligned with the approved direction include `Badge`, `Select`, `TableSurface` and the other non-copied primitives documented in `docs/design/clariobase-ui-v1.md`.

Legacy routes retain their current presentation until their approved migration task.

## Exact Inventory

Legend:

- copied
- substantially adapted
- pattern/reference only
- rejected

| Upstream path | Kit | ClarioBase target | Classification | Notice required | Dependency requirement | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `starter-kit/src/components/ui/card.tsx` | starter-kit | `src/components/clariobase-ui/proof-card.tsx` | substantially adapted | yes | none for the proof slice | Smallest useful primitive for the proof boundary. |
| `starter-kit/src/components/ui/button.tsx` | starter-kit | `src/components/clariobase-ui/button.tsx` | substantially adapted | yes | none for the proof slice | Dependency-free button adaptation. |
| `starter-kit/src/components/ui/input.tsx` | starter-kit | `src/components/clariobase-ui/field.tsx` (`Input` export only) | substantially adapted | yes | none for the proof slice | Dependency-free input adaptation. |
| `starter-kit/src/components/ui/card.tsx` | starter-kit | `src/components/clariobase-ui/surface.tsx` | substantially adapted | yes | none for the proof slice | Surface abstraction for the new foundation. |
| `starter-kit/src/app/layout.tsx` | starter-kit | `src/components/app-shell.tsx` | pattern/reference only | no | none | Informs current shell composition and route isolation. |
| `starter-kit/src/components/ui/sidebar.tsx` | starter-kit | `src/components/app-shell.tsx` | pattern/reference only | no | none | Informs sidebar/navigation semantics only. |
| `starter-kit/src/app/globals.css` | starter-kit | `src/app/globals.css` | pattern/reference only | no | none | Informs token/layout direction only. |
| `starter-kit/src/app/page.tsx` | starter-kit | not adopted | rejected | no | none | Not needed for the proof and would broaden scope. |
| `starter-kit/src/components/ui/button.tsx` | starter-kit | not adopted | rejected | no | `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` would be needed later | Not required for the proof slice. |
| `starter-kit/src/components/ui/dialog.tsx` | starter-kit | not adopted | rejected | no | `@radix-ui/react-dialog` | Not required for the proof slice. |
| `starter-kit/src/components/ui/dropdown-menu.tsx` | starter-kit | not adopted | rejected | no | `@radix-ui/react-dropdown-menu` | Not required for the proof slice. |
| `starter-kit/src/components/ui/tooltip.tsx` | starter-kit | not adopted | rejected | no | `@radix-ui/react-tooltip` | Not required for the proof slice. |

## Dependency Inventory

The exact upstream starter-kit dependency versions are:

### T001 candidate evidence

| Package | Upstream version evidence | Authoritative package-license evidence | Commercial-use conclusion | Adoption decision | Reason |
| --- | --- | --- | --- | --- | --- |
| `pnpm` | `10.8.1` from `starter-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | repo remains on pnpm 9 for T001 |
| `next` | `15.2.4` from `starter-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | candidate | upstream app baseline only |
| `react` | `19.1.0` from `starter-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | candidate | upstream app baseline only |
| `react-dom` | `19.1.0` from `starter-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | candidate | upstream app baseline only |
| `tailwindcss` | `4.1.3` from `starter-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | T001 must not migrate Tailwind 4 |
| `zod` | `3.23.8` from `starter-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | candidate | validation baseline only |
| `class-variance-authority` | `0.7.1` from `starter-kit/package.json` | npm metadata license: `Apache-2.0` | allowed | candidate | useful for T002 UI primitives |
| `clsx` | `2.1.1` from `starter-kit/package.json` | npm metadata license: `MIT` | allowed | candidate | utility only |
| `tailwind-merge` | `2.5.2` from `starter-kit/package.json` | npm metadata license: `MIT` | allowed | candidate | utility only |
| `lucide-react` | `0.446.0` from `starter-kit/package.json` | npm metadata license: `ISC` | allowed | candidate | icon layer candidate |
| `@radix-ui/react-slot` | `1.1.1` from `starter-kit/package.json` | npm metadata license: `MIT` | allowed | candidate | button/card convenience only |
| `@radix-ui/react-dialog` | `1.1.3` from `starter-kit/package.json` | npm metadata license: `MIT` | allowed | candidate | T002-only if dialog UI is adopted |
| `@radix-ui/react-dropdown-menu` | `2.1.1` from `starter-kit/package.json` | npm metadata license: `MIT` | allowed | candidate | T002-only if menu UI is adopted |
| `@radix-ui/react-tooltip` | `1.1.5` from `starter-kit/package.json` | npm metadata license: `MIT` | allowed | candidate | T002-only if tooltip UI is adopted |
| `@auth/prisma-adapter` | `2.6.0` from `full-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | auth boundary is out of scope |
| `next-auth` | `4.24.11` from `full-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | auth boundary is out of scope |
| `@prisma/client` | `5.20.0` from `full-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | current app stays on Prisma 7 |
| `prisma` | `5.20.0` from `full-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | current app stays on Prisma 7 |
| `@fullcalendar/*` | `6.1.15` from `full-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | calendar module not needed |
| `@hello-pangea/dnd` | `18.0.1` from `full-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | drag-and-drop module not needed |
| `@tanstack/react-table` | `8.20.5` from `full-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | current proof does not require table framework migration |
| `@tiptap/react` | `2.11.7` from `full-kit/package.json` | package license not verified for adoption - BLOCKED for T002 | not verified | rejected | editor module not needed |

## Compatibility Matrix

| Area | ClarioBase current | Shadboard ref evidence | Decision |
| --- | --- | --- | --- |
| pnpm | `9.15.0` | `10.8.1` | keep pnpm 9 for T001 |
| Next.js | `15.3.3` | `15.2.4` | compatible for selective adoption |
| React | `19.0.0` | `19.1.0` | compatible |
| Tailwind CSS | `3.4.17` | `4.1.3` | do not migrate to Tailwind 4 in T001 |
| Zod | `4.1.0` | `3.23.8` | keep current version |
| Prisma | `7.8.0` | `5.20.0` | do not downgrade |
| PostCSS | `8.5.4` | starter-kit uses standard PostCSS setup | keep current config |

## Strategy Comparison

### Selective source/component port

- best fit
- smallest footprint
- preserves project-owned route boundary
- lowest risk

### Registry-based adoption

- candidate for T002
- would add more dependencies and more adaptation work
- not needed for T001

### Wholesale starter replacement

- rejected
- imports too much foreign architecture
- conflicts with T001 constraints

## Historical T001 Architecture Boundary

T001 proof boundary at the time of validation:

`src/components/clariobase-ui/`

The exact `/leads` route renders `ProofShell` once, while `AppShell` returns children unchanged for exact pathname `/leads`.

## Historical T001 Early Proof Results

- exact `/leads` route uses one shell only
- `/leads/[id]` and all other routes keep `AppShell`
- adapted card primitive lives behind the project-owned boundary
- filtering, pagination and URL state are preserved
- no Prisma/auth/demo module changes were introduced

## Historical T001 Bundle And Dependency Impact

- direct dependencies added: `0`
- lockfile change: `no`
- build output evidence: `/leads` remains a small dynamic route at `1.97 kB`
- expected T002 impact: measured by dependency count, lockfile delta, and route/shared chunk changes

## Notice Handling

The adapted boundary is covered by [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

## PR #130 Overlap Assessment

- no overlap with `pnpm-lock.yaml`
- no workflow/build config changes
- `package.json` only updates the current test classification and proof test inclusion

## Historical T001 Manual Validation Evidence

- Validation date: `2026-06-29`
- Environment: approved Preview Release
- Preview URL: `http://Serwer:3001`
- Validated runtime head: `e775723053da914fc3bfe532c82b9fa83f1ec692`
- Browser and exact version: `unknown`

Observed results:

- `/leads` rendered with exactly one proof shell
- no nested or duplicate AppShell was visible
- widths checked: `368 px`, `768 px`, `834 px`, `1024 px`, desktop
- no visible whole-page horizontal overflow
- no clipped controls or overlapping layout regions
- `368 px`, `768 px` and `834 px` used the stacked responsive layout
- `1024 px` used the sidebar/content layout correctly
- keyboard Tab navigation worked
- focus indicators were visible and not clipped
- browser console was clean
- 200% browser zoom remained usable without clipped or overlapping controls
- at least one non-exact `/leads` route retained the legacy E009 AppShell
- no ProofShell appeared on the checked non-`/leads` route

Not claimed:

- data-populated lead rows, because the preview showed zero leads
- refresh/back-navigation
- filter-state persistence
- lead-detail runtime validation

## Risks

- additional upstream source boundaries may still need separate review in T002
- each new dependency and copied source boundary still requires its own exact license review

## Limitations

- proof is still intentionally narrow
- only one upstream source file was adapted
- no upstream assets were adopted
- T001 approves the architecture and bounded adoption mode only
- T001 does not approve broad route migration inside T001
- visual refinements for the UGC creator audience belong to T002, T003 and later route-migration tasks

## Required T002 Preconditions

- decide whether registry adoption is desired
- review any new upstream file boundary separately
- re-audit assets if any are imported later

## Historical T001 Recommendation

GO - the selective Shadboard adoption strategy is approved for E020.T002.

## T003 Addendum

T003 PR base:
`c800ca5e8cebc83a0fc71087e0c6bdc457640725`

Current implementation state:
- all active routes render inside the shared AppShell
- the exact `/leads` AppShell bypass has been removed
- ProofShell has been retired
- `/leads` retains the temporary scoped proof compatibility wrapper until T005
- direct dependencies added: 2
- pnpm-lock.yaml changed for the approved dependency graph
- `@radix-ui/react-dialog` `1.1.3` is approved
- `lucide-react` `0.446.0` is approved
- no Prisma, auth, workflow, preview or deployment changes
- manual responsive shell QA remains pending

- `starter-kit/src/components/ui/sheet.tsx` -> `src/components/clariobase-ui/sheet.tsx`
- classification: substantially adapted
- bundle evidence: `/leads` remains `1.97 kB` in the build output
- residual manual QA remains required for the responsive shell
