# ClarioBase UI v1

Canonical design tokens and project-owned UI boundary guidance for the light CRM workspace.

## Product Direction

Creator-first, not admin-first.
Warm and elegant, not stereotypically pink.
Clear and efficient, not decorative at the cost of usability.
Warm off-white background, soft white surfaces, graphite text, muted warm-grey secondary text, and muted berry/mauve accent.

## Theme Policy

Light mode only for the current product scope.
Dark mode deferred and unsupported until separately approved.
The shell should feel elegant, warm, light, calm, modern, and creator-oriented rather than enterprise-admin-oriented.

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

Legacy --clariobase-* presentation variables remain unchanged for unmigrated routes.

The separate --clariobase-ui-* variables mirror the canonical UI v1 token inventory.

Project-owned components consume the UI v1 values through the --cb-* aliases.

## Shared Shell Contract

- mobile horizontal padding: 16px
- tablet horizontal padding: 24px
- desktop horizontal padding: 32px
- desktop maximum content width: approximately 1600px
- standard vertical page padding: approximately 20-24px
- visible accessible focus is required on every interactive element
- the desktop shell uses a persistent left sidebar at 1024 px and wider
- the mobile shell uses a compact sticky app bar with a labeled `Menu` trigger

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

- `starter-kit/src/components/ui/sheet.tsx`
  -> `src/components/clariobase-ui/sheet.tsx`
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

No current route needs the broader UI helper stack. The current shared shell only approves the exact dialog primitive and icon package for T003.

- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- direct Radix packages other than `@radix-ui/react-dialog`
- TanStack Table
- Shadboard auth and demo dependencies

These packages can be reconsidered later with a new exact need and license review.

## T003 Dependency Inventory

- `@radix-ui/react-dialog` `1.1.3`
  - license: MIT
  - commercial use: allowed
  - current consumer: `src/components/clariobase-ui/sheet.tsx` and `src/components/app-shell.tsx`

- `lucide-react` `0.446.0`
  - license: ISC
  - commercial use: allowed
  - current consumer: `src/components/app-shell.tsx`

## Migration Rules For T003-T007

- Keep T002 as the boundary and token foundation task.
- Do not migrate routes in T002.
- Consume only the approved project-owned primitives from the new boundary.
- Preserve legacy route presentation until the approved route task replaces it.
- Do not add new dependency families unless the later task has a direct consumer and license review.

## Dashboard Composition Contract

- Dashboard consumes the project-owned UI boundary.
- KPI information uses one semantic `<dl>` with direct item wrappers containing `<dt>` and `<dd>`.
- KPI labels use `Badge` semantic tones.
- Priorities use `<ol>`, `<li>` and `<article>`.
- Action is primary and company remains a link.
- Priorities are the primary operational region.
- Pipeline and data-quality warning are secondary.
- Pipeline bars are decorative and `aria-hidden`.
- Static data-quality content uses `DashboardDataQualityAlert`, not `StatusMessage`.
- Dashboard-specific compositions remain in `src/components/dashboard-primitives.tsx`.
- No upstream demo route or module was copied.
- No dependencies were added.
- The lockfile is unchanged.
