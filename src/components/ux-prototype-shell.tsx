"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PROTOTYPE_ROUTE_MAP, PROTOTYPE_STATES, type PrototypeState } from "@/lib/ux-prototype";

const stateLabels: Record<PrototypeState, string> = {
  default: "Default",
  loading: "Loading",
  empty: "Empty",
  error: "Error / unavailable",
  success: "Success",
  stress: "Long-data stress"
};

const compactNavigationGroups = [
  {
    title: "Daily work",
    items: [
      { href: "/ux-prototype/dashboard", label: "Dashboard" },
      { href: "/ux-prototype/daily-work", label: "Daily work" },
      { href: "/ux-prototype/leads", label: "Leads" },
      { href: "/ux-prototype/sales-overview", label: "Sales" }
    ]
  },
  {
    title: "Data quality",
    items: [
      { href: "/ux-prototype/import-batches", label: "Imports" },
      { href: "/ux-prototype/duplicate-candidates", label: "Possible duplicates" },
      { href: "/ux-prototype/system-status", label: "System status" }
    ]
  }
] as const;

const desktopNavigationGroups = [
  {
    title: "Daily work",
    items: [
      { href: "/ux-prototype/dashboard", label: "Dashboard" },
      { href: "/ux-prototype/daily-work", label: "Daily work" },
      { href: "/ux-prototype/leads", label: "Leads" },
      { href: "/ux-prototype/sales-overview", label: "Sales" }
    ]
  },
  {
    title: "Data quality",
    items: [
      { href: "/ux-prototype/import-batches", label: "Imports" },
      { href: "/ux-prototype/duplicate-candidates", label: "Possible duplicates" }
    ]
  },
  {
    title: "System",
    items: [{ href: "/ux-prototype/system-status", label: "System status" }]
  }
] as const;

type PrototypeNavItem = (typeof desktopNavigationGroups)[number]["items"][number];

const detailParentMap: Array<{ href: string; parentLabel: string }> = [
  { href: "/ux-prototype/dashboard", parentLabel: "Dashboard" },
  { href: "/ux-prototype/daily-work", parentLabel: "Daily work" },
  { href: "/ux-prototype/leads", parentLabel: "Leads" },
  { href: "/ux-prototype/sales-overview", parentLabel: "Sales" },
  { href: "/ux-prototype/import-batches", parentLabel: "Imports" },
  { href: "/ux-prototype/duplicate-candidates", parentLabel: "Possible duplicates" },
  { href: "/ux-prototype/system-status", parentLabel: "System status" }
];

function getActivePrototypeLabel(pathname: string) {
  const exact = PROTOTYPE_ROUTE_MAP.find((route) => pathname === route.href);
  if (exact) return exact.label;

  const parent = detailParentMap.find((entry) => pathname.startsWith(`${entry.href}/`));
  if (parent) return parent.parentLabel;

  return "Hub";
}

function isPrototypeItemActive(item: PrototypeNavItem, pathname: string) {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  if (item.href === "/ux-prototype/leads" && pathname.startsWith("/ux-prototype/leads/")) return true;
  if (item.href === "/ux-prototype/import-batches" && pathname.startsWith("/ux-prototype/import-batches/")) return true;
  if (item.href === "/ux-prototype/duplicate-candidates" && pathname.startsWith("/ux-prototype/duplicate-candidates/")) return true;
  return false;
}

function getDetailReturnLabel(pathname: string) {
  const match = detailParentMap.find((entry) => pathname.startsWith(`${entry.href}/`));
  return match?.parentLabel;
}

export function UxPrototypeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/ux-prototype";
  const searchParams = useSearchParams();
  const state = (searchParams.get("state") as PrototypeState) || "default";
  const isHub = pathname === "/ux-prototype";
  const activeSectionLabel = getActivePrototypeLabel(pathname);
  const returnLabel = getDetailReturnLabel(pathname);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#prototype-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow"
      >
        Skip to content
      </a>
      <div className="mx-auto flex min-h-screen w-full flex-col gap-3 px-3 py-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-950">
          <span>UX prototype</span>
          <span aria-hidden="true">•</span>
          <span>No data is saved</span>
          <Link
            href="/ux-prototype"
            prefetch={false}
            className="ml-auto text-sm font-semibold text-amber-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            Hub
          </Link>
        </div>
        <div className="grid gap-3 min-[1100px]:grid-cols-[clamp(13rem,16vw,18rem)_minmax(0,1fr)]">
          <aside className="hidden min-[1100px]:block">
            <nav aria-label="Prototype sections" className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prototype sections</p>
              <div className="mt-3 space-y-1">
                {desktopNavigationGroups.map((section) => (
                  <section key={section.title} className="space-y-1.5">
                    <p className="px-2 text-[11px] font-medium text-slate-500">{section.title}</p>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const active = isPrototypeItemActive(item, pathname);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            aria-current={active ? "page" : undefined}
                            className={[
                              "flex min-h-10 items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                              active
                                ? "border-sky-200 bg-sky-50 text-slate-950"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            ].join(" ")}
                          >
                            <span className="min-w-0 flex-1">
                              <span className={active ? "block font-semibold" : "block font-medium"}>{item.label}</span>
                            </span>
                            {active ? (
                              <span className="inline-flex shrink-0 rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                                Current
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </nav>
          </aside>

          <div className="space-y-3 min-[1100px]:hidden">
            <details className="rounded-2xl border border-slate-200 bg-white p-3" open={isHub}>
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
                Menu · {activeSectionLabel}
              </summary>
              <div className="mt-3 space-y-3">
                {compactNavigationGroups.map((section) => (
                  <section key={section.title} className="space-y-1">
                    <p className="px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{section.title}</p>
                    <div className="grid gap-2 min-[640px]:grid-cols-2">
                      {section.items.map((item) => {
                        const active = isPrototypeItemActive(item, pathname);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            aria-current={active ? "page" : undefined}
                            className={[
                              "flex min-h-10 items-center rounded-2xl border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                              active
                                ? "border-sky-200 bg-sky-50 text-slate-950"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            ].join(" ")}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </details>
          </div>

          <section id="prototype-content" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
            <details className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" open={isHub}>
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
                Review tools
              </summary>
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Route state</span>
                  <span aria-hidden="true">•</span>
                  <span>{stateLabels[state]}</span>
                  <span aria-hidden="true">•</span>
                  <span>Manual keyboard, zoom and screen-reader checks remain pending.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROTOTYPE_STATES.map((item) => (
                    <Link
                      key={item}
                      href={`${pathname}?state=${item}`}
                      prefetch={false}
                      aria-current={item === state ? "page" : undefined}
                      className={[
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        item === state
                          ? "border-sky-200 bg-sky-50 text-sky-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      ].join(" ")}
                    >
                      {stateLabels[item]}
                    </Link>
                  ))}
                </div>
              </div>
            </details>
            {returnLabel ? (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                <Link href={pathname.replace(/\/[^/]+$/, "")} prefetch={false} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                  {returnLabel}
                </Link>
                <span aria-hidden="true">/</span>
                <span>{returnLabel === "Leads" ? "Aurora Bikes Studio" : returnLabel === "Imports" ? "Batch details" : "Compare records"}</span>
              </div>
            ) : null}
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
