# Shadboard Adoption Decision

Decision status: GO  
Date: 2026-06-29

## Base And Upstream

- Epic synchronization commit: `c800ca5e8cebc83a0fc71087e0c6bdc457640725`
- PR base SHA: `c800ca5e8cebc83a0fc71087e0c6bdc457640725`
- Repository: `https://github.com/Qualiora/shadboard`
- Pinned release: `v1.5.1`
- Pinned commit: `ece0dab7282175002f5103afbac6f86306169a4e`

## Licensing Evidence

The pinned Shadboard ref is MIT licensed. The current proof includes genuinely adapted source boundaries:

- `starter-kit/src/components/ui/card.tsx` -> `src/components/clariobase-ui/proof-card.tsx`
- `starter-kit/src/components/ui/button.tsx` -> `src/components/clariobase-ui/button.tsx`
- `starter-kit/src/components/ui/input.tsx` -> `src/components/clariobase-ui/field.tsx` (`Input` export only)
- `starter-kit/src/components/ui/card.tsx` -> `src/components/clariobase-ui/surface.tsx`
- `starter-kit/src/components/ui/sheet.tsx` -> `src/components/clariobase-ui/sheet.tsx`

These adapted boundaries require MIT copyright and permission notice retention, which is recorded in [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

The shell/navigation proof is reference-only:

- `starter-kit/src/components/ui/sidebar.tsx` -> `src/components/app-shell.tsx`
- `starter-kit/src/app/globals.css` -> `src/app/globals.css`

## Exact Inventory

| Upstream path | Kit | ClarioBase target | Classification | Notice required | Dependency requirement | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `starter-kit/src/components/ui/card.tsx` | starter-kit | `src/components/clariobase-ui/proof-card.tsx` | substantially adapted | yes | none for the proof slice | Smallest useful primitive for the proof boundary. |
| `starter-kit/src/components/ui/button.tsx` | starter-kit | `src/components/clariobase-ui/button.tsx` | substantially adapted | yes | none for the proof slice | Dependency-free button adaptation. |
| `starter-kit/src/components/ui/input.tsx` | starter-kit | `src/components/clariobase-ui/field.tsx` (`Input` export only) | substantially adapted | yes | none for the proof slice | Dependency-free input adaptation. |
| `starter-kit/src/components/ui/card.tsx` | starter-kit | `src/components/clariobase-ui/surface.tsx` | substantially adapted | yes | none for the proof slice | Surface abstraction for the new foundation. |
| `starter-kit/src/components/ui/sheet.tsx` | starter-kit | `src/components/clariobase-ui/sheet.tsx` | substantially adapted | yes | `@radix-ui/react-dialog` | Narrow left-side mobile navigation sheet for the shared shell. |
| `starter-kit/src/components/ui/sidebar.tsx` | starter-kit | `src/components/app-shell.tsx` | reference-only | no | none | Sidebar and navigation semantics were studied but not copied. |
| `starter-kit/src/app/globals.css` | starter-kit | `src/app/globals.css` | reference-only | no | none | Informs token/layout direction only. |

## Dependency Inventory

| Package | Version evidence | Authoritative package-license evidence | Commercial-use conclusion | Adoption decision | Reason |
| --- | --- | --- | --- | --- | --- |
| `@radix-ui/react-dialog` | `1.1.3` from npm registry metadata | npm metadata license: `MIT` | allowed | approved | mobile sheet boundary for T003 |
| `lucide-react` | `0.446.0` from npm registry metadata | npm metadata license: `ISC` | allowed | approved | icon layer for the shared shell |

## Architecture Boundary

Current proof boundary:

`src/components/clariobase-ui/`

The exact `/leads` route now renders inside the shared `AppShell`; the old `ProofShell` boundary has been retired.

Project-owned primitives created for this shared-shell boundary include the existing button, field, surface, proof-card, and sheet components.

## Bundle And Dependency Impact

- direct dependencies added: `2`
- lockfile change: `yes`
- build output evidence: remeasure after exact-head verification

## Recommendation

GO - the selective Shadboard adoption strategy remains approved for the shared shell and navigation work.
