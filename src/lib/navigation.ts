export type NavigationItem = {
  href: string;
  label: string;
  description?: string;
  priority: "primary" | "secondary";
};

export type NavigationSection = {
  key: string;
  title: string;
  items: readonly NavigationItem[];
};

export const NAVIGATION_SECTIONS = [
  {
    key: "main-work",
    title: "Main work",
    items: [
      {
        href: "/",
        label: "Dashboard",
        description: "Start from the CRM overview.",
        priority: "primary"
      },
      {
        href: "/work",
        label: "Daily work",
        description: "Open the workbench and clear the day.",
        priority: "primary"
      },
      {
        href: "/leads",
        label: "Leads",
        description: "Review and update lead records.",
        priority: "primary"
      },
      {
        href: "/reports/sales",
        label: "Reports",
        description: "Check the sales summary and pipeline health.",
        priority: "primary"
      }
    ] as const
  },
  {
    key: "data",
    title: "Data",
    items: [
      {
        href: "/imports",
        label: "Imports",
        description: "Review local import batches.",
        priority: "primary"
      },
      {
        href: "/duplicates",
        label: "Duplicates",
        description: "Review likely duplicate candidates.",
        priority: "primary"
      }
    ] as const
  },
  {
    key: "system",
    title: "System",
    items: [
      {
        href: "/health",
        label: "Health check",
        description: "Confirm the app is responding locally.",
        priority: "secondary"
      }
    ] as const
  }
] as const satisfies readonly NavigationSection[];

export function isNavigationItemActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
