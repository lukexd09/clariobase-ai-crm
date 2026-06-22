"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavigationItemActive, NAVIGATION_SECTIONS } from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? "/";

  if (pathname === "/ux-prototype" || pathname.startsWith("/ux-prototype/")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <aside className="border-b border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r lg:px-3 lg:py-3">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-sky-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <span className="space-y-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
              Light CRM
            </span>
            <span className="block text-sm font-semibold text-slate-950">ClarioBase AI CRM</span>
            <span className="block text-xs leading-5 text-slate-500">
              Daily lead work, data review, and system checks.
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="mt-4 space-y-4">
          {NAVIGATION_SECTIONS.map((section) => (
            <section key={section.key} className="space-y-1.5">
              <p className="px-2 text-[11px] font-medium text-slate-500">
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
                        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        active
                          ? item.priority === "secondary"
                            ? "border-slate-300 bg-slate-100 text-slate-950 shadow-sm"
                            : "border-sky-200 bg-white text-slate-950 shadow-sm"
                          : item.priority === "secondary"
                            ? "border-transparent bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                            : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                      ].join(" ")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={active ? "block font-semibold" : "block font-medium"}>
                          {item.label}
                        </span>
                        {item.priority === "secondary" && item.description ? (
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                      {active ? (
                        <span
                          className={[
                            "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            item.priority === "secondary"
                              ? "border-slate-300 bg-white text-slate-700"
                              : "border-sky-200 bg-sky-50 text-sky-700"
                          ].join(" ")}
                        >
                          Current
                        </span>
                      ) : null}
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
