export type HomeActionCard = {
  href: string;
  title: string;
  description: string;
};

export const HOME_ACTION_CARDS = [
  {
    href: "/leads",
    title: "Leads",
    description: "Review the current lead list, open records, and keep the queue moving."
  },
  {
    href: "/work",
    title: "Workbench",
    description: "Focus on today's work in overdue, due-today, upcoming, and empty-action buckets."
  },
  {
    href: "/reports/sales",
    title: "Sales report",
    description: "Check the light operational summary for status, workbench, drafts, and activity."
  },
  {
    href: "/imports",
    title: "Imports",
    description: "Review local import batches and row-level results from file-based lead intake."
  },
  {
    href: "/duplicates",
    title: "Duplicates",
    description: "Inspect likely duplicate candidates before any future merge workflow exists."
  },
  {
    href: "/health",
    title: "Health check",
    description: "Confirm the app and CRM stack are up and responding locally."
  }
] as const satisfies readonly HomeActionCard[];

export const HOME_STATUS_ITEMS = [
  "CRM database is the source of truth",
  "File-based AI workflow stays local",
  "Sales routes are live and accessible"
] as const;

export const HOME_POSITIONING =
  "A calm, light CRM entry point for ClarioBase sales review, imports, duplicates, and reporting.";
