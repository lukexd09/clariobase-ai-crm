---
name: ClarioBase AI CRM
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#bbc9cd'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#859397'
  outline-variant: '#3c494c'
  surface-tint: '#2fd9f4'
  primary: '#8aebff'
  on-primary: '#00363e'
  primary-container: '#22d3ee'
  on-primary-container: '#005763'
  inverse-primary: '#006877'
  secondary: '#bcc7de'
  on-secondary: '#263143'
  secondary-container: '#3e495d'
  on-secondary-container: '#aeb9d0'
  tertiary: '#ffd6a3'
  on-tertiary: '#462b00'
  tertiary-container: '#ffb13b'
  on-tertiary-container: '#6e4600'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a2eeff'
  primary-fixed-dim: '#2fd9f4'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb957'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
  surface-deep: '#0A0C10'
  surface-raised: '#11141D'
  border-subtle: '#1E293B'
  text-primary: '#F0F4F9'
  text-secondary: '#94A3B8'
  success-calm: '#10B981'
  warning-calm: '#F59E0B'
  error-calm: '#EF4444'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  margin-page: 32px
  gutter-grid: 24px
  padding-card: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for the modern sales operator who demands clarity over clutter. It embodies a **Modern SaaS** aesthetic that prioritizes high readability and a focused, calm atmosphere. The target audience is a small, high-performance sales agency where speed of thought and ease of data entry are paramount.

The UI avoids "corporate boredom" by using a sophisticated dark palette and generous whitespace, creating an "operator-friendly" environment that feels like a precision tool. The style is a blend of **Minimalism** and **Tonal Layering**, utilizing subtle borders and deep shadows rather than loud gradients or flat, uninspired blocks. It projects confidence and practicality without falling into the trap of neon-drenched cyberpunk tropes.

## Colors

This design system utilizes a **dark-first** color strategy to reduce eye strain and establish a premium feel. 

- **Primary Canvas:** The deepest charcoal (`#0A0C10`) serves as the base background, with a slightly lighter navy (`#11141D`) used for card surfaces and navigation rails to create structural depth.
- **Accents:** A crisp Cyan (`#22D3EE`) is reserved strictly for primary actions and key status highlights. This ensures that the most important interactive elements are immediately discoverable.
- **Typography Colors:** High-contrast off-white (`#F0F4F9`) is used for primary headers, while a muted slate is used for secondary body text to maintain a calm hierarchy.
- **Feedback:** Semantic colors for success, warning, and error are desaturated by 20-30% compared to standard palettes, ensuring they communicate status without breaking the serene dark-mode aesthetic.

## Typography

The system uses a pairing of **Geist** and **Inter**. Geist provides a technical, precise feel for headlines and UI labels, while Inter ensures maximum legibility for data-heavy CRM views and body text.

- **Headlines:** Use Geist with tighter letter spacing at larger sizes to create a modern, "designed" look.
- **Body Text:** Inter is used for all narrative and data content. Maintain generous line heights (1.5x) to prevent dense CRM tables from feeling overwhelming.
- **Labels:** Small labels and metadata use Geist Medium or SemiBold with slight tracking increases for clarity in high-density areas.

## Layout & Spacing

The design system follows a **Fixed-Fluid Hybrid** grid. The side navigation and utility panels are fixed-width, while the central data workspace expands fluidly to accommodate varying monitor sizes.

- **Desktop (1440px+):** 12-column grid with 24px gutters and 32px outer margins.
- **Tablet (768px-1024px):** 8-column grid with 16px gutters; sidebars collapse into icons or a hamburger menu.
- **Mobile (<768px):** 4-column grid with 16px gutters. Stack all card components vertically.

A strict 4px/8px baseline rhythm is applied to all components to ensure vertical alignment and visual harmony across complex sales dashboards.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** supplemented by **Deep, Soft Shadows**.

- **Level 0 (Background):** `#0A0C10`. Used for the main application shell.
- **Level 1 (Surface):** `#11141D`. Used for cards, sidebars, and input containers. These should have a subtle 1px border of `#1E293B`.
- **Level 2 (Popovers/Modals):** Lighter navy with a more pronounced shadow. Shadows are long and soft: `0px 10px 30px rgba(0, 0, 0, 0.5)`. 

Avoid any inner glows or heavy gradients. Depth is conveyed by the subtle contrast between the deep charcoal background and the navy surfaces.

## Shapes

The shape language is sophisticated and approachable. A consistent **12px (0.75rem)** radius is used for standard cards and input fields.

- **Standard Elements:** 12px corner radius.
- **Buttons & Chips:** 8px for smaller interactive elements.
- **Parent Containers:** Use `rounded-xl` (24px) for large layout wrappers to create a "containerized" look within the viewport.

## Components

### Buttons
Primary buttons use the Cyan (`#22D3EE`) background with black text for maximum punch. Secondary buttons use a transparent background with a `#1E293B` border and off-white text. Hover states should involve a subtle brightness increase rather than a color shift.

### Cards
Cards are the primary organizational unit. They feature the `#11141D` surface color, a 1px border of `#1E293B`, and 24px internal padding. Title areas within cards should be separated by a thin horizontal divider.

### Input Fields
Inputs use a slightly darker fill than the card surface to create an "etched" look. On focus, the border transitions to Cyan and gains a very soft outer glow (2px blur).

### Chips & Badges
Badges for "Lead Status" or "Stage" use low-saturation background tints with high-contrast text. For example, a "Closed Won" badge uses a dark emerald background with light green text, ensuring it doesn't distract from the primary UI.

### AI Indicators
As an AI CRM, specific "AI-generated" insights should be highlighted with a very subtle 1px gradient border using the primary cyan and a deep violet to distinguish them from manual data entry.
