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
    title: "Work",
    items: [
      {
        href: "/",
        label: "Dashboard",
        description: "Workspace overview.",
        priority: "primary"
      },
      {
        href: "/work",
        label: "Daily work",
        description: "Queue and follow-ups.",
        priority: "primary"
      },
      {
        href: "/leads",
        label: "Leads",
        description: "Lead records.",
        priority: "primary"
      },
      {
        href: "/reports/sales",
        label: "Sales overview",
        description: "Sales summary.",
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
        label: "Data imports",
        description: "Import batches.",
        priority: "primary"
      },
      {
        href: "/duplicates",
        label: "Possible duplicates",
        description: "Duplicate review.",
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
        label: "System status",
        description: "Status check.",
        priority: "secondary"
      }
    ] as const
  }
] as const satisfies readonly NavigationSection[];

export function isNavigationItemActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
