# ClarioBase UI v1

Canonical design tokens and project-owned UI boundary guidance for the light CRM workspace.

## Product Direction

Creator-first, not admin-first.
Warm and elegant, not stereotypically pink.
Clear and efficient, not decorative at the cost of usability.

## Theme Policy

Light mode only for the current product scope.
Dark mode deferred and unsupported until separately approved.

## Canonical Token Inventory

```yaml
background: '#F7F4EF'
surface: '#FFFDFB'
elevatedSurface: '#FFFFFF'
primaryText: '#171717'
mutedText: '#6B5F5A'
border: '#E5DCD6'
accent: '#AA5E7B'
accentForeground: '#FFFFFF'
accentHover: '#9E5270'
accentActive: '#87445D'
focusRing: '#8F5770'
success: '#2F7D5B'
successInk: '#22553E'
warning: '#B7791F'
warningInk: '#845915'
danger: '#B44A4A'
dangerInk: '#8E3636'
information: '#5A7EA6'
informationInk: '#35577A'
neutral: '#7A6F68'
neutralInk: '#594F49'
fontFamily: '"Geist", "Geist Sans", sans-serif'
headingScale:
  h1: '2rem'
  h2: '1.5rem'
  h3: '1.25rem'
  h4: '1.125rem'
bodyScale:
  base: '1rem'
  small: '0.875rem'
  xsmall: '0.75rem'
spacing:
  xxs: '0.25rem'
  xs: '0.5rem'
  sm: '0.75rem'
  md: '1rem'
  lg: '1.5rem'
  xl: '2rem'
density: 'comfortable'
radii:
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  xl: '1.25rem'
elevation:
  surface: '0 1px 2px rgba(23, 23, 23, 0.04)'
  raised: '0 10px 30px rgba(23, 23, 23, 0.08)'
disabledOpacity: '0.56'
```

## Legacy-Route Isolation Policy

Legacy routes retain their current presentation until their approved migration task.
The ClarioBase UI v1 variables are available as a foundation but are consumed only by migrated/project-owned components.

## Import Convention

- Import project-owned primitives from `src/components/clariobase-ui/`.
- Import shared tokens from `src/lib/design-tokens.ts`.
- Do not import route UI from Shadboard demo paths.
- Keep route components free of starter-kit or demo-application structure.

## Source Boundary Inventory

- `starter-kit/src/components/ui/card.tsx`
  -> `src/components/clariobase-ui/proof-card.tsx`
  -> `src/components/clariobase-ui/surface.tsx`
  -> substantially adapted

- `starter-kit/src/components/ui/button.tsx`
  -> `src/components/clariobase-ui/button.tsx`
  -> substantially adapted

- `starter-kit/src/components/ui/input.tsx`
  -> `src/components/clariobase-ui/field.tsx` (`Input` export only)
  -> substantially adapted

## Project-Owned Primitive Inventory

Created for known ClarioBase consumers and aligned with the approved Shadboard composition/token direction, but no upstream source code was copied for these:

- `Badge`
- `StatusMessage`
- `Select`
- `Label`
- `FormMessage`
- `TableSurface`
- `Table`
- `TableHead`
- `TableHeadCell`
- `TableBody`
- `TableRow`
- `TableCell`
- `PaginationControls`
- `EmptyState`
- `Skeleton`

## Known Future Consumers

- `T003`: shell and responsive navigation
- `T004`: Dashboard
- `T005`: Leads, Daily work and Sales
- `T006`: Imports and duplicate review
- `T007`: dense lead operator workspace

## Rejected Dependencies

No current T002 consumer requires them; the existing stack supports the selected foundation without additional packages.

- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`
- all Radix packages
- TanStack Table
- Shadboard auth and demo dependencies

These packages can be reconsidered later with a new exact need and license review.

## Migration Rules For T003-T007

- Keep T002 as the boundary and token foundation task.
- Do not migrate routes in T002.
- Consume only the approved project-owned primitives from the new boundary.
- Preserve legacy route presentation until the approved route task replaces it.
- Do not add new dependency families unless the later task has a direct consumer and license review.
