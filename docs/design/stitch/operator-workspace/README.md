# ClarioBase operator workspace design reference

These files are the binding Stitch design reference for the ClarioBase CRM operator workspace.
This is not a loose inspiration board.

Future UI work for the lead detail operator workspace should follow these assets closely:

- `lead-workspace-v2-refined-operator-flow.html` is the main implementation target.
- `clariobase-component-style-guide.html` is the component and style source.
- `DESIGN.md` contains the design tokens, color rules, spacing, and typography guidance.

Important notes:

- The exported HTML is reference material, not a runtime dependency.
- Do not import the exported HTML directly into the app.
- Do not add CDN scripts, fonts, or icons from the Stitch export without explicit approval.
- Do not copy fake Stitch business content into production UI.
- Translate the design into the existing Next.js + Tailwind codebase using real CRM data and current app behavior.
