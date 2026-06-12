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
      <aside className="border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-sky-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold text-slate-950">ClarioBase AI CRM</span>
            <span className="block text-xs text-slate-500">Light CRM workspace</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="mt-6 space-y-5">
          {NAVIGATION_SECTIONS.map((section) => (
            <section key={section.key} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const active = isNavigationItemActive(item.href, pathname);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        active
                          ? "border-sky-200 bg-sky-50 text-slate-950 shadow-sm"
                          : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border",
                          active
                            ? "border-sky-500 bg-sky-500"
                            : "border-slate-300 bg-slate-200 group-hover:border-sky-300 group-hover:bg-sky-300"
                        ].join(" ")}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{item.label}</span>
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
