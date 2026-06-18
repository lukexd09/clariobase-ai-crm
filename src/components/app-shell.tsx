"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavigationItemActive, NAVIGATION_SECTIONS } from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <aside className="border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-4">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-sky-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">
            CB
          </span>
          <span className="space-y-0.5 leading-tight">
            <span className="block text-sm font-semibold text-slate-950">ClarioBase AI CRM</span>
            <span className="block text-xs text-slate-500">Light CRM workspace</span>
          </span>
        </Link>

        <details className="group mt-4 rounded-2xl border border-slate-200 bg-slate-50 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset">
            <span>Navigation</span>
            <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </summary>
          <nav aria-label="Main navigation" className="border-t border-slate-200 p-3">
            <div className="space-y-4">
              {NAVIGATION_SECTIONS.map((section) => (
                <section key={section.key} className="space-y-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isNavigationItemActive(item.href, pathname);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          aria-current={active ? "page" : undefined}
                          className={[
                            "group flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                            active
                              ? "border-sky-200 bg-sky-50/80 text-slate-950 shadow-sm ring-1 ring-sky-200"
                              : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                          ].join(" ")}
                        >
                          <span
                            aria-hidden="true"
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[0.65rem] font-semibold leading-none transition",
                              active
                                ? "border-sky-500 bg-white text-sky-700 shadow-sm"
                                : "border-slate-300 bg-slate-50 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600"
                            ].join(" ")}
                          >
                            {active ? "✓" : ""}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={["block leading-5", active ? "font-semibold text-slate-950" : "font-medium"].join(" ")}>
                              {item.label}
                            </span>
                            {item.description ? (
                              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </nav>
        </details>

        <nav aria-label="Main navigation" className="mt-5 hidden space-y-4 lg:block">
          {NAVIGATION_SECTIONS.map((section) => (
            <section key={section.key} className="space-y-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isNavigationItemActive(item.href, pathname);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "group flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        active
                          ? "border-sky-200 bg-sky-50/80 text-slate-950 shadow-sm ring-1 ring-sky-200"
                          : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[0.65rem] font-semibold leading-none transition",
                          active
                            ? "border-sky-500 bg-white text-sky-700 shadow-sm"
                            : "border-slate-300 bg-slate-50 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600"
                        ].join(" ")}
                      >
                        {active ? "✓" : ""}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={["block leading-5", active ? "font-semibold text-slate-950" : "font-medium"].join(" ")}>
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
