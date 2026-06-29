# ClarioBase UI v1

Canonical design tokens and project-owned UI boundary guidance for the light CRM workspace.

## Source of truth

This document overrides conflicting values in the Stitch export.

## Tokens

```yaml
background: '#F7F4EF'
surface: '#FFFDFB'
elevated-surface: '#FFFFFF'
text-primary: '#171717'
text-secondary: '#6B5F5A'
border: '#E5DCD6'
accent: '#B36A86'
accent-hover: '#9E5270'
accent-active: '#87445D'
focus-ring: '#8F5770'
success: '#2F7D5B'
warning: '#B7791F'
danger: '#B44A4A'
information: '#5A7EA6'
neutral: '#7A6F68'
```

## Foundations

- Font family policy: Geist only for the current product scope.
- Heading scale: editorial, compact and dense, with a 32/24/20/18 px rhythm.
- Body scale: 16 px base, 14 px small, 12 px helper text.
- Spacing scale: 4 px base.
- Content density: comfortable by default, with compact table and sidebar options only when needed.
- Radius: 8 px standard, 12 px for grouped containers, 20 px only for larger status surfaces.
- Border treatment: subtle, light-weight, always readable.
- Elevation: surface shadows are minimal; raised surfaces stay restrained.
- Disabled state: reduced opacity plus pointer suppression.
- Focus-visible state: always visible, never removed.
- Primary controls: minimum 44 px height.
- Gutters: `clamp(16px, 2vw, 32px)`.
- Sidebar width: `clamp(212px, 14vw, 236px)`.

## Theme Policy

Light mode only for the current product scope.
Dark mode deferred and unsupported until separately approved.

## Import Convention

- Import project-owned primitives from `src/components/clariobase-ui/`.
- Import shared tokens from `src/lib/design-tokens.ts`.
- Do not import route UI from Shadboard demo paths.
- Keep route components free of starter-kit or demo-application structure.

## Primitive Inventory

- `Button`, `ButtonLink`
- `Surface`, `SurfaceHeader`, `SurfaceTitle`, `SurfaceDescription`, `SurfaceContent`
- `Badge`, `StatusMessage`
- `Input`, `Select`, `Label`, `FormMessage`
- `TableSurface`, `Table`, `TableHead`, `TableHeadCell`, `TableBody`, `TableRow`, `TableCell`
- `PaginationControls`
- `EmptyState`, `Skeleton`

## Application shell

- Dashboard is the production landing page.
- At 1100 px and wider, the global top header is removed and the sidebar is the only shell navigation surface.
- Below 1100 px, a compact app bar shows only `ClarioBase` and the `Menu` disclosure.
- The shell must not rely on viewport JavaScript detection for the responsive switch.
- Operator section shows a lightweight static account chip with `Łukasz Chmiel` and `Operator`.
- The operator identity is visible, but the account menu is intentionally not interactive before account functionality exists.
- Do not show notification controls before notifications exist.
- Do not show calendar controls before calendar functionality exists.
- Do not expose working logout actions before authentication exists.
- Primary nav: Dashboard, Daily work, Leads, Sales.
- Data quality nav: Imports, Possible duplicates.
- System status stays available but secondary and must not use a placeholder description.
- Support, Settings, add-lead affordances, team members, and employee analytics are excluded.

## Dashboard density

- Page title is compact and prominent, roughly 30 to 32 px on desktop and 27 to 29 px on mobile.
- Subtitle is compact, roughly 14 to 16 px.
- Standard section gaps stay around 16 to 20 px.
- Main workspace padding stays around 20 to 24 px on desktop and 16 px on mobile.
- Standard cards stay around 14 to 16 px of padding.
- KPI cards are lightweight, short, border-only surfaces without shadows or decorative icons.
- Today&apos;s priorities uses one grouped list with divider-separated rows rather than nested cards.
- Pipeline snapshot is secondary and compact.
- The data-quality warning is placed after the main priorities/pipeline area as a restrained warning row.
- Use warning semantics for duplicate review messaging, but do not rely on color alone.
- Do not show fake account menus or placeholder logout actions before authentication exists.

## Design Direction

Creator-first, not admin-first.
Warm and elegant, not stereotypically pink.
Clear and efficient, not decorative at the cost of usability.

