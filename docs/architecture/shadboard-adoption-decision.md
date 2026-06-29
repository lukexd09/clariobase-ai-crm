# Shadboard Adoption Decision

Decision status: CHANGES REQUIRED
Date: 2026-06-29

## Base And Upstream

- ClarioBase base SHA: `77d888947276ac079650a9eec58d0a84e4690bc6`
- Shadboard repository: `https://github.com/Qualiora/shadboard`
- Shadboard release: `v1.5.1`
- Shadboard commit: `ece0dab7282175002f5103afbac6f86306169a4e`

## Licensing Evidence

The pinned Shadboard ref is documented as MIT licensed. No Shadboard source file was copied or substantially adapted into the current proof slice, so no third-party notice file is required yet.

Required handling if T002 later copies source:

- keep the MIT copyright notice;
- keep the MIT permission notice;
- preserve attribution for every copied or substantially adapted boundary;
- assess assets separately from code.

## Exact Inventory

Legend:

- copied
- substantially adapted
- pattern/reference only
- rejected

### Considered source or pattern inventory

| Shadboard path at `ece0dab7282175002f5103afbac6f86306169a4e` | ClarioBase target path | Classification | MIT notice needed | Asset provenance |
| --- | --- | --- | --- | --- |
| `app/layout.tsx` | `src/components/app-shell.tsx` | pattern/reference only | no | none |
| `app/leads/page.tsx` | `src/app/leads/page.tsx` | pattern/reference only | no | none |
| `components/navigation.tsx` | `src/components/app-shell.tsx` | pattern/reference only | no | none |
| `components/ui/button.tsx` | `src/components/clariobase-ui/proof-card.tsx` and later T002 candidates | pattern/reference only | no | none |
| `components/ui/card.tsx` | `src/components/clariobase-ui/proof-card.tsx` | pattern/reference only | no | none |
| `components/ui/table.tsx` | `src/components/lead-table.tsx` | pattern/reference only | no | none |
| `app/globals.css` | `src/app/globals.css` | pattern/reference only | no | none |
| `components/theme-provider.tsx` | not adopted | rejected | no | none |
| `components/ui/input.tsx` | not adopted | rejected | no | none |
| `components/ui/select.tsx` | not adopted | rejected | no | none |
| `components/ui/dialog.tsx` | not adopted | rejected | no | none |
| `components/ui/dropdown-menu.tsx` | not adopted | rejected | no | none |
| `components/ui/tooltip.tsx` | not adopted | rejected | no | none |
| `components/ui/sonner.tsx` | not adopted | rejected | no | none |

No copied or substantially adapted Shadboard source exists in this proof slice.

## Dependency Inventory

The pinned upstream ref does not declare the T002 UI dependency set in a way we can rely on for this proof. For T002 planning, the following packages are candidate dependencies or explicit rejects.

| Package | Exact upstream version | Purpose | Adopted now / candidate / rejected | Authoritative license | Commercial-use conclusion | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `class-variance-authority` | not declared at this ref | component variant helpers | candidate | MIT | allowed | Useful for T002 UI primitives, but not required for the proof slice. |
| `clsx` | not declared at this ref | class composition | candidate | MIT | allowed | Generic utility only. |
| `tailwind-merge` | not declared at this ref | Tailwind class dedupe | candidate | MIT | allowed | Good fit for T002, but unnecessary now. |
| `lucide-react` | not declared at this ref | icons | candidate | ISC | allowed | Useful for a later shared icon layer. |
| Radix primitives | not declared at this ref | accessible primitives | candidate | MIT | allowed | Valid T002 candidate if registry adoption is approved. |
| `next-auth` / Auth.js | not declared at this ref | auth | rejected | ISC / MIT | allowed in general, but rejected for this slice | Explicitly out of scope and would expand the architecture. |
| `@auth/prisma-adapter` | not declared at this ref | auth adapter | rejected | ISC | allowed in general, but rejected for this slice | Would drag auth and Prisma boundary changes into T001. |
| Prisma 5 starter schema | not declared at this ref | starter ORM baseline | rejected | Apache 2.0 / Prisma terms | allowed in general, but rejected for this slice | Would require a downgrade and schema replacement. |
| chat/editor/dnd starter deps | not declared at this ref | unrelated starter modules | rejected | varies | mixed | Not needed for CRM shell adoption and would add unwanted surface area. |

## Compatibility Matrix

| Area | ClarioBase current | Shadboard ref evidence | Decision |
| --- | --- | --- | --- |
| Next.js | `15.3.3` | upstream is a Next.js app | compatible for selective pattern reuse |
| React | `19.0.0` | upstream React app | compatible for selective pattern reuse |
| TypeScript | `5.8.3` | upstream TypeScript app | compatible |
| Tailwind CSS | `3.4.17` | upstream Tailwind app | keep Tailwind 3 for T001 |
| PostCSS | `8.5.4` | upstream app uses PostCSS | keep current config |
| Autoprefixer | `10.4.21` | upstream app uses autoprefixing | keep current config |
| shadcn/ui | configured in ClarioBase | upstream starter influence only | no registry import in T001 |
| Radix | not installed in this slice | candidate for T002 only | not needed now |
| pnpm | `9.15.0` | current repo standard | do not migrate |
| Prisma | `7.8.0` | upstream starter baseline is older | do not downgrade or copy schema |
| Zod | `4.1.0` | upstream-compatible validation layer | compatible |
| Server components | current app uses them | proof keeps `/leads` server data loading | compatible |
| Client components | current app uses them | proof only adds a narrow client boundary where already needed | compatible |
| Docker build | current repo contract | no build config change required | compatible |
| CI/CD | current repo contract | no workflow change required | compatible |
| Clean install | `pnpm install --frozen-lockfile` passes | no new deps added | compatible |

## Strategy Comparison

### Selective source/component port

- best fit
- smallest footprint
- easiest to trace
- lowest CSS collision risk

### Registry-based adoption

- good candidate for T002
- better if a shared component layer is needed later
- not necessary for this proof

### Wholesale starter replacement

- rejected
- would import foreign routes, auth, data model and build assumptions
- too risky for T001

## Architecture Boundary

Current proof boundary:

`src/components/clariobase-ui/`

The exact `/leads` route renders `ProofShell` once, while `AppShell` returns children unchanged for exact pathname `/leads`.

## Early Proof Results

- exact `/leads` route uses one shell only
- `/leads/[id]` and all other routes keep `AppShell`
- filtering, pagination and URL state are preserved
- no Prisma/auth/build config changes were required
- no new dependencies were added

## Bundle And Dependency Impact

- direct dependencies added: `0`
- lockfile change: `no`
- proof source-size/build-output evidence: the `/leads` route remains a small server-rendered route; current build output shows `/leads` at `1.97 kB` route size in `.next` build output
- expected T002 impact: measured by any added registry dependency count, lockfile delta, and the resulting route size / shared chunk delta in build output

## Notice Handling

No third-party notice file is needed yet because no substantial upstream code was copied or adapted.

## PR #130 Overlap Assessment

The corrected proof avoids the PR #130 overlap surface:

- `package.json` is changed only for test classification and current suite alignment
- `pnpm-lock.yaml` remains unchanged
- workflows remain unchanged
- Docker/build config remains unchanged
- no preview automation files were touched

## Risks

- T002 may still need a separate dependency/license audit if registry adoption is chosen.
- Manual browser checks were not performed in this environment.

## Limitations

- This is an architectural/pattern proof, not a copied-code proof.
- No Shadboard source was imported.
- No upstream assets were adopted.

## Required T002 Preconditions

- decide whether registry-based adoption is worth doing
- pin exact T002 dependencies before any install
- re-audit assets separately

## Recommendation

CHANGES REQUIRED
