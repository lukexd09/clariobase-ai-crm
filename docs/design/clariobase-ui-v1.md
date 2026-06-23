# ClarioBase UI v1

Canonical design tokens and production shell guidance for the light CRM workspace.

## Source of truth

This document overrides conflicting values in the Stitch export.

## Tokens

```yaml
primary: '#006194'
on-primary: '#FFFFFF'
background: '#F8FAFC'
surface: '#FFFFFF'
surface-subtle: '#F1F5F9'
text-primary: '#0F172A'
text-secondary: '#475569'
border: '#CBD5E1'
success: '#047857'
warning: '#B45309'
error: '#B91C1C'
```

## Foundations

- Font family: Geist only.
- Spacing scale: 4 px base.
- Radius: 8 px standard, 12 px for grouped containers.
- Pills: statuses only.
- Borders: subtle, light-weight, always readable.
- Shadows: almost none.
- Focus: visible and accessible.
- Primary controls: minimum 44 px height.
- Gutters: `clamp(16px, 2vw, 32px)`.
- Sidebar width: `clamp(212px, 14vw, 236px)`.

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

