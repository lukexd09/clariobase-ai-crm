# Shadboard Adoption Decision

Decision status: CHANGES REQUIRED
Date: 2026-06-29

## Base And Upstream

- ClarioBase base SHA: `578d949f0644f22a69656553260b7b2a8e29343f`
- Shadboard repository: `https://github.com/Qualiora/shadboard`
- Shadboard release: `v1.5.1`
- Shadboard commit: `ece0dab7282175002f5103afbac6f86306169a4e`

## Licensing Evidence

The upstream repository ships an MIT license at the pinned ref. The MIT notice and permission terms must be preserved for any copied or substantially adapted source.

Required handling:

- retain the copyright notice;
- retain the permission notice;
- keep the license text with redistributed source;
- treat assets separately from code;
- document attribution for every copied or materially adapted file boundary.

## Inventory Summary

Status legend:

- APPROVED FOR PROOF
- CANDIDATE FOR T002
- REJECTED
- NOT REQUIRED

### Application shell patterns

- APPROVED FOR PROOF: narrow `/leads`-only shell composition and navigation semantics.
- CANDIDATE FOR T002: broader multi-route shell replacement.

### Responsive navigation

- APPROVED FOR PROOF: desktop-first shell layout with visible active state and keyboard focus.
- CANDIDATE FOR T002: complete starter navigation migration.

### Theme and token structure

- APPROVED FOR PROOF: scoped ClarioBase-owned CSS variables under `[data-ui-foundation="shadboard-proof"]`.
- CANDIDATE FOR T002: global token migration.

### Typography

- APPROVED FOR PROOF: use existing project font stack and local scale.
- REJECTED: wholesale upstream font adoption.

### Spacing and radius conventions

- APPROVED FOR PROOF: local radius/spacing tokens for the `/leads` boundary.
- CANDIDATE FOR T002: global spacing system adoption.

### Buttons

- APPROVED FOR PROOF: project-owned buttons inside the proof route.
- CANDIDATE FOR T002: shared component library expansion.

### Cards

- APPROVED FOR PROOF: project-owned proof cards.
- CANDIDATE FOR T002: registry-wide card migration.

### Inputs

- APPROVED FOR PROOF: proof-scoped select styling only.
- CANDIDATE FOR T002: shared form control registry.

### Labels

- APPROVED FOR PROOF: proof-scoped labels and filter chips.
- NOT REQUIRED: unrelated label redesigns.

### Dialogs

- NOT REQUIRED.

### Dropdown menus

- NOT REQUIRED.

### Tooltips

- NOT REQUIRED.

### Tables

- APPROVED FOR PROOF: `/leads` table styling with preserved data semantics.
- CANDIDATE FOR T002: table system refactor across CRM.

### Feedback and alert patterns

- NOT REQUIRED for the proof slice.

### Icons

- REJECTED: no upstream icon set adoption in this slice.

### Assets

- REJECTED: no upstream images, illustrations or fonts copied.

### CSS files

- APPROVED FOR PROOF: scoped additions only in `src/app/globals.css`.
- REJECTED: wholesale `globals.css` replacement.

### PostCSS and Tailwind configuration

- NOT REQUIRED for the proof slice.

### shadcn configuration

- NOT REQUIRED for the proof slice.

### Server/client component boundaries

- APPROVED FOR PROOF: keep existing server data loading on `/leads`, add a narrow project-owned client boundary only where required by current behavior.
- CANDIDATE FOR T002: broader boundary cleanup.

## Dependency Inventory

Approved for proof:

- existing Next.js
- existing React
- existing TypeScript
- existing Tailwind CSS 3
- existing Prisma 7
- existing Zod
- existing shadcn config metadata

Rejected:

- NextAuth / Auth.js
- `@auth/prisma-adapter`
- Shadboard Prisma schema
- Shadboard Prisma client version
- accounts
- users
- sessions
- organizations
- roles
- permissions
- SSO
- demo data
- demo routes
- chat
- calendar
- kanban
- billing
- payments
- pricing
- email demo modules
- unrelated editors, charts or application modules
- unused dependencies and assets

## Compatibility Matrix

| Area | ClarioBase | Shadboard ref | Decision |
| --- | --- | --- | --- |
| Next.js | Existing app router stack | Upstream starter stack | Compatible for selective reuse |
| React | Existing React 19 | Upstream starter React | Compatible for selective reuse |
| TypeScript | Existing | Existing | Compatible |
| Tailwind | 3.x | Upstream may differ | Do not migrate during T001 |
| PostCSS | Existing repo config | Upstream config may differ | Do not replace during T001 |
| Autoprefixer | Existing | Existing or starter-specific | Keep local version |
| shadcn/ui | Existing config metadata | Upstream starter usage | Selective proof only |
| Radix | Not introduced in proof | Upstream starter may use it | Not required now |
| pnpm | 9.x | Upstream may differ | Do not migrate during T001 |
| Prisma | 7.x | Upstream Prisma 5 baseline | Do not downgrade or copy schema |
| Zod | Existing | Existing or compatible | Compatible |
| Server components | Existing | Upstream starter pattern | Preserve current data loading |
| Client components | Existing | Upstream starter pattern | Preserve narrow boundary only |
| Docker build | Existing project contract | Upstream starter build | Keep unchanged |
| CI/CD | Existing project contract | Upstream starter build | Keep unchanged |
| Clean install | Existing `pnpm install --frozen-lockfile` flow | Upstream starter assumptions | Compatible if no new deps are added |

## Strategy Comparison

### 1. Selective source/component port

- Best architecture fit.
- Lowest dependency footprint.
- Best license traceability.
- Lowest CSS collision risk.
- Best match for project-owned boundary.

### 2. Registry-based adoption

- Good for scaling later.
- Too much scaffolding for the current proof slice.
- Better suited to T002 or later.

### 3. Wholesale starter replacement

- Rejected.
- High regression risk.
- Likely to import foreign routes, auth, Prisma models and build assumptions.
- Would expand beyond the approved proof.

## Architecture Boundary

Adopt the proof boundary under:

`src/components/clariobase-ui/`

Business routes must not import copied Shadboard demo structure directly.

## Early Proof

Implemented a `/leads`-only shell and token boundary with:

- scoped CSS variables;
- visible keyboard focus styles;
- preserved lead filters and pagination behavior;
- preserved server-side data loading;
- no Prisma or auth changes;
- no global theme replacement.

## Results

The proof is intentionally narrow. It demonstrates that a Shadboard-derived shell composition and theme subset can coexist with the current app without shared config migration.

## PR #130 Overlap Assessment

Known overlap files from PR #130:

- `package.json`
- `pnpm-lock.yaml`
- build and workflow files
- several preview/testing docs

This proof avoids those files and stays in app/UI and docs-only surfaces.

## Risks

- More upstream Shadboard assets may have separate licensing terms.
- Global CSS could still drift if future work broadens the proof boundary.
- Registry-based adoption may be needed later for maintainability.

## Limitations

- No upstream icons, fonts or images were adopted.
- No dependency or build-system migration was performed.
- No broad route migration was attempted.

## Required T002 Preconditions

- confirm whether broader Shadboard registry adoption is still desirable;
- review any additional upstream assets separately;
- keep auth, Prisma and Tailwind migration decisions unchanged unless separately approved;
- preserve the current `/leads` behavior contract.

## Final Recommendation

CHANGES REQUIRED
