import type { TranslationKey } from "@/i18n/types";

export type NavigationItem = {
  href: string;
  labelKey: TranslationKey;
  icon: NavigationIconKey;
};

export type NavigationGroup = {
  titleKey: TranslationKey;
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
    titleKey: "navigation.group.workspace",
    items: [
      { href: "/", labelKey: "navigation.dashboard", icon: "dashboard" },
      { href: "/work", labelKey: "navigation.work", icon: "work" },
      { href: "/leads", labelKey: "navigation.leads", icon: "leads" },
      { href: "/reports/sales", labelKey: "navigation.sales", icon: "sales" }
    ]
  },
  {
    titleKey: "navigation.group.dataQuality",
    items: [
      { href: "/imports", labelKey: "navigation.imports", icon: "imports" },
      { href: "/duplicates", labelKey: "navigation.duplicates", icon: "duplicates" }
    ]
  },
  {
    titleKey: "navigation.group.system",
    items: [{ href: "/health", labelKey: "navigation.health", icon: "health" }]
  }
] as const satisfies readonly NavigationGroup[];

export function isNavigationItemActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
