export type NavigationItem = {
  href: string;
  label: string;
  description?: string;
  icon: NavigationIconKey;
};

export type NavigationGroup = {
  title: string;
  items: readonly NavigationItem[];
};

export type NavigationIconKey =
  | "dashboard"
  | "work"
  | "leads"
  | "sales"
  | "imports"
  | "duplicates"
  | "health";

export const NAVIGATION_GROUPS = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: "dashboard" },
      { href: "/work", label: "Daily work", icon: "work" },
      { href: "/leads", label: "Leads", icon: "leads" },
      { href: "/reports/sales", label: "Sales", icon: "sales" }
    ]
  },
  {
    title: "Data quality",
    items: [
      { href: "/imports", label: "Imports", icon: "imports" },
      { href: "/duplicates", label: "Possible duplicates", icon: "duplicates" }
    ]
  },
  {
    title: "System",
    items: [{ href: "/health", label: "System status", icon: "health" }]
  }
] as const satisfies readonly NavigationGroup[];

export function isNavigationItemActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
