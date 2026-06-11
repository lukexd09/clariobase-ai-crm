export type HomeActionCard = {
  href: string;
  title: string;
  description: string;
  label: string;
};

export const HOME_PRIMARY_ACTION_CARDS = [
  {
    href: "/leads",
    title: "Leads",
    label: "Pipeline",
    description: "Review the current lead list, open records, and keep the queue moving."
  },
  {
    href: "/work",
    title: "Workbench",
    label: "Daily work",
    description: "Focus on today's work in overdue, due-today, upcoming, and empty-action buckets."
  },
  {
    href: "/reports/sales",
    title: "Sales report",
    label: "Reporting",
    description: "Check the light operational summary for status, workbench, drafts, and activity."
  },
  {
    href: "/imports",
    title: "Imports",
    label: "Data intake",
    description: "Review local import batches and row-level results from file-based lead intake."
  },
  {
    href: "/duplicates",
    title: "Duplicates",
    label: "Data quality",
    description: "Inspect likely duplicate candidates before any future merge workflow exists."
  }
] as const satisfies readonly HomeActionCard[];

export const HOME_SYSTEM_LINK = {
  href: "/health",
  title: "Health check",
  description: "Confirm the app is up and responding locally."
} as const;

export const HOME_STATUS_ITEMS = [
  "Lead work stays organized in one CRM workspace.",
  "AI-assisted files stay under your control.",
  "Daily sales work is ready to use."
] as const;

export const HOME_POSITIONING =
  "Use ClarioBase AI CRM to review leads, plan daily outreach, check sales status, and keep imported data under control.";
