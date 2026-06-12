# Light CRM visual direction

This document defines the light-first visual direction for ClarioBase CRM.
It is a practical implementation guide for future screen-by-screen UI work.

## Core rules

- Use a light-first interface with white or near-white surfaces.
- Keep the look calm, modern, and business-oriented.
- Prefer subtle borders, soft shadows, and generous whitespace.
- Use one restrained accent color for focus and primary actions.
- Preserve a readable text hierarchy with clear contrast.
- Keep badge usage low and avoid hard, noisy surfaces.
- Prioritize operator clarity over technical density.
- Support both ClarioBase sales work and future UGC outreach.

## Visual language

- Main background: white or a very light neutral.
- Surfaces: white, slate-50, or other near-white panels.
- Borders: subtle slate-200 style separators.
- Accent: a single restrained blue or sky tone.
- Typography: calm, readable, and slightly larger than dense admin UIs.
- Radius: rounded cards and controls, not sharp dashboard blocks.

## Avoid

- Dark cyber or cyberpunk styling.
- Neon glow, heavy gradients, or harsh contrast.
- IT/admin dashboard density.
- Too many badges or tags.
- Overly technical language in UI headings.
- Heavy top-to-bottom borders and grid noise.

## Implementation notes

- Redesign one screen at a time.
- Keep the homepage as the light CRM entry point.
- Keep operator pages practical and uncluttered.
- Use this document as design guidance, not as runtime code.
- Exported design assets, when present, remain reference-only and are not imported directly.

## Shell guidance

- Use semantic navigation with an explicit `Main navigation` label.
- Keep business work entries above system entries.
- Active navigation state is visible without color alone.
- Preserve visible focus-visible states on all navigation links and shell-level actions.
- Keep the shell light, calm, and compact rather than admin-heavy.

## UI foundation

- The app should default to a light color scheme.
- Do not use a dark global body background as the baseline.
- Minimum important text size should generally be at least `text-xs`.
- Tiny uppercase labels should stay decorative or supportive only.
- Secondary text must keep readable contrast against the background.
- System and admin areas should remain visually secondary to business work.
- Future UI PRs should include manual keyboard and contrast checks.

## Future UI checklist

- Can the screen be used with keyboard Tab?
- Is focus visible on every interactive element?
- Is the active navigation state visible without color alone?
- Is important text readable?
- Are system or admin elements visually secondary?
- Does the screen follow the light CRM direction?
- Is the screen avoiding a mix of light shell and dark legacy content unless intentionally deferred?
