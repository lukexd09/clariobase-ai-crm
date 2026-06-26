export type NavigationItem = {
  href: string;
  label: string;
  description?: string;
};

export type NavigationGroup = {
  title: string;
  items: readonly NavigationItem[];
};

export const NAVIGATION_GROUPS = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/work", label: "Daily work" },
      { href: "/leads", label: "Leads" },
      { href: "/reports/sales", label: "Sales" }
    ]
  },
  {
    title: "Data quality",
    items: [
      { href: "/imports", label: "Imports" },
      { href: "/duplicates", label: "Possible duplicates" }
    ]
  },
  {
    title: "System",
    items: [{ href: "/health", label: "System status" }]
  }
] as const satisfies readonly NavigationGroup[];

export function isNavigationItemActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
