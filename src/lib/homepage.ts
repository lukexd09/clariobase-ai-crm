export type HomeActionCard = {
  href: string;
  title: string;
  description: string;
  label: string;
};

export type HomeSecondaryAction = {
  href: string;
  title: string;
  description: string;
};

export const HOME_PRIMARY_ACTION_CARDS = [
  {
    href: "/leads",
    title: "Leads",
    label: "Pipeline",
    description: "Review the current lead list and move work forward."
  },
  {
    href: "/work",
    title: "Workbench",
    label: "Daily work",
    description: "Focus on overdue, due-today, upcoming, and empty-action buckets."
  },
  {
    href: "/reports/sales",
    title: "Sales report",
    label: "Reporting",
    description: "Check the operational summary for status, workbench, drafts, and activity."
  }
] as const satisfies readonly HomeActionCard[];

export const HOME_SECONDARY_ACTIONS = [
  {
    href: "/imports",
    title: "Imports",
    description: "Review completed import batches and row outcomes."
  },
  {
    href: "/duplicates",
    title: "Duplicates",
    description: "Review likely duplicate candidates."
  }
] as const satisfies readonly HomeSecondaryAction[];

export const HOME_SYSTEM_LINK = {
  href: "/health",
  title: "Health check",
  description: "Confirm the app is up and responding locally."
} as const;

export const HOME_STATUS_ITEMS = [
  "Lead work stays visible without dashboard clutter.",
  "Imports and duplicate review stay available without taking over the page.",
  "System checks stay secondary but easy to reach."
] as const;

export const HOME_POSITIONING =
  "Review leads, clear follow-ups, check pipeline health, and keep imported data under control from one focused CRM workspace.";
