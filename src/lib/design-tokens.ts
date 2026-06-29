export const CLARIOBASE_UI_TOKENS = {
  color: {
    background: "#F7F4EF",
    surface: "#FFFDFB",
    elevatedSurface: "#FFFFFF",
    primaryText: "#171717",
    mutedText: "#6B5F5A",
    border: "#E5DCD6",
    accent: "#AA5E7B",
    accentForeground: "#FFFFFF",
    accentHover: "#9E5270",
    accentActive: "#87445D",
    focusRing: "#8F5770",
    success: "#2F7D5B",
    successInk: "#22553E",
    warning: "#B7791F",
    warningInk: "#845915",
    danger: "#B44A4A",
    dangerInk: "#8E3636",
    information: "#5A7EA6",
    informationInk: "#35577A",
    neutral: "#7A6F68",
    neutralInk: "#594F49"
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
    elevation: {
      surface: "0 1px 2px rgba(23, 23, 23, 0.04)",
      raised: "0 10px 30px rgba(23, 23, 23, 0.08)"
    },
    disabledOpacity: "0.56"
  }
} as const;

export type ClarioBaseTokens = typeof CLARIOBASE_UI_TOKENS;
