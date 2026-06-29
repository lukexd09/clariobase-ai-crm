export const CLARIOBASE_UI_TOKENS = {
  color: {
    background: "#F7F4EF",
    surface: "#FFFDFB",
    elevatedSurface: "#FFFFFF",
    primaryText: "#171717",
    mutedText: "#6B5F5A",
    border: "#E5DCD6",
    accent: "#B36A86",
    accentHover: "#9E5270",
    accentActive: "#87445D",
    focusRing: "#8F5770",
    success: "#2F7D5B",
    warning: "#B7791F",
    danger: "#B44A4A",
    information: "#5A7EA6",
    neutral: "#7A6F68"
  },
  layout: {
    fontFamily: '"Geist", "Geist Sans", sans-serif',
    headingScale: {
      h1: "2rem",
      h2: "1.5rem",
      h3: "1.25rem",
      h4: "1.125rem"
    },
    bodyScale: {
      base: "1rem",
      small: "0.875rem",
      xsmall: "0.75rem"
    },
    spacing: {
      xxs: "0.25rem",
      xs: "0.5rem",
      sm: "0.75rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem"
    },
    density: "comfortable",
    radius: {
      sm: "0.5rem",
      md: "0.75rem",
      lg: "1rem",
      xl: "1.25rem"
    },
    border: "1px solid color-mix(in srgb, var(--cb-border) 90%, transparent)",
    elevation: {
      surface: "0 1px 2px rgba(23, 23, 23, 0.04)",
      raised: "0 10px 30px rgba(23, 23, 23, 0.08)"
    },
    disabledOpacity: "0.56"
  }
} as const;

export type ClarioBaseTokens = typeof CLARIOBASE_UI_TOKENS;
