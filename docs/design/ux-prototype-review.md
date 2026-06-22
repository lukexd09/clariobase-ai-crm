# UX Prototype Review

## Route map

- `/ux-prototype`
- `/ux-prototype/dashboard`
- `/ux-prototype/daily-work`
- `/ux-prototype/leads`
- `/ux-prototype/leads/[id]`
- `/ux-prototype/sales-overview`
- `/ux-prototype/import-batches`
- `/ux-prototype/import-batches/[id]`
- `/ux-prototype/duplicate-candidates`
- `/ux-prototype/duplicate-candidates/[id]`
- `/ux-prototype/system-status`

## Route and state matrix

| Route | Default | Loading | Empty | Error / unavailable | Success | Stress |
| --- | --- | --- | --- | --- | --- | --- |
| `/ux-prototype` | Hub links | - | - | - | - | - |
| `/ux-prototype/dashboard` | KPI row, priorities, pipeline | Yes | Yes | Yes | Yes | - |
| `/ux-prototype/daily-work` | Queue sections and actions | Yes | Yes | Yes | - | - |
| `/ux-prototype/leads` | Search, filters, sort, pagination | Yes | Yes | Yes | Yes | Yes |
| `/ux-prototype/leads/[id]` | Contact, recommended action, timeline | Yes | - | Yes | Yes | Yes |
| `/ux-prototype/sales-overview` | Date range and funnel snapshot | Yes | Yes | Yes | - | Yes |
| `/ux-prototype/import-batches` | Batch list and status examples | Yes | Yes | Yes | - | - |
| `/ux-prototype/import-batches/[id]` | Row outcomes and validation | Yes | Yes | Yes | - | - |
| `/ux-prototype/duplicate-candidates` | Confidence and compare actions | Yes | Yes | Yes | Yes | Yes |
| `/ux-prototype/duplicate-candidates/[id]` | Compare detail and review controls | Yes | Yes | Yes | Yes | Yes |
| `/ux-prototype/system-status` | Availability and technical details | Yes | Yes | Yes | - | - |

## State parameters

- `state=default`
- `state=loading`
- `state=empty`
- `state=error`
- `state=success`
- `state=stress`

## Local run

1. Start the app with `corepack pnpm dev`.
2. Open `/ux-prototype`.
3. Use the state controls in the prototype header.
4. Review desktop, tablet, mobile and 200% zoom behavior.

## UX review checklist

- The hub links all ten prototype screens.
- The persistent banner is visible on every prototype screen.
- The language stays business-first.
- Focus states are visible.
- 320 CSS px layouts do not create page-level horizontal scrolling.
- Tables scroll only when the content genuinely requires it.
- No prototype screen depends on database access.
- The state selector changes the visible copy on each route.

## Manual WCAG gates still pending

- Keyboard-only walkthrough.
- Screen-reader smoke pass.
- 200% zoom reflow pass.
- Mobile overflow pass on a real device.

## Approval note

Prototype approval is required before any production implementation resumes.
