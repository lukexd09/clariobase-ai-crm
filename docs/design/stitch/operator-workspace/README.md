# Stitch operator workspace design reference

This folder contains the binding Stitch design reference for the ClarioBase CRM operator workspace redesign.

These files are not a loose inspiration board. Future UI implementation work should follow this design direction closely while translating it into the existing Next.js, React and Tailwind application.

## Selected direction

- Main implementation target: `lead-workspace-v2-refined-operator-flow.html`
- Component and style source: `clariobase-component-style-guide.html`
- Design tokens and style rules: `DESIGN.md`

The selected product direction is a desktop-first, dark, calm, premium operator workspace for a solo ClarioBase sales operator.

## Implementation rule

Future UI work should follow these assets closely:

- layout hierarchy,
- spacing rhythm,
- dark surface layering,
- card structure,
- status pill style,
- button style,
- form/input style,
- workflow artifact card structure,
- operator-focused information hierarchy.

This is not a generic SaaS dashboard and not an enterprise CRM redesign. The design should support the local ClarioBase lead workflow first.

## Usage notes

The exported HTML files are references, not runtime dependencies.

Future implementation tasks should translate the visual design into existing project conventions, use real app data and current routes/server actions, preserve existing CRM behavior, and keep implementation incremental and reviewable.

Do not copy fake Stitch content into production UI.

## Included files

```text
DESIGN.md
lead-workspace-v2-refined-operator-flow.html
lead-workspace-v2-refined-operator-flow.png
clariobase-component-style-guide.html
clariobase-component-style-guide.png
```

## Next implementation task

Expected next task:

```text
E007.T002 - Implement lead detail operator workspace from Stitch design
```

That task should read this folder before touching UI code and should treat the selected Stitch design as a binding reference, not just inspiration.
