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

export function UxPrototypeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/ux-prototype";
  const searchParams = useSearchParams();
  const state = (searchParams.get("state") as PrototypeState) || "default";
  const isHub = pathname === "/ux-prototype";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#prototype-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow">
        Skip to content
      </a>
      <div className="mx-auto flex min-h-screen w-full flex-col gap-3 px-3 py-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-950">
          <span>UX prototype</span>
          <span aria-hidden="true">•</span>
          <span>No data is saved</span>
          <Link href="/ux-prototype" prefetch={false} className="ml-auto text-sm font-semibold text-amber-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
            Hub
          </Link>
        </div>
        <div className="grid gap-3 xl:grid-cols-[clamp(13rem,16vw,18rem)_minmax(0,1fr)]">
          <nav aria-label="Prototype sections" className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prototype routes</p>
            <div className="mt-3 space-y-1">
              {PROTOTYPE_ROUTE_MAP.map((route) => {
                const active = pathname === route.href;
                const description = "description" in route ? route.description : undefined;
                return (
                  <Link key={route.href} href={route.href} prefetch={false} aria-current={active ? "page" : undefined} className={["flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white", active ? "border-sky-200 bg-sky-50 text-slate-950" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"].join(" ")}>
                    <span aria-hidden="true" className={["mt-0.5 h-2.5 w-2.5 rounded-full", active ? "bg-sky-600" : "bg-slate-300"].join(" ")} />
                    <span className="min-w-0">
                      <span className="block font-medium">{route.label}</span>
                      {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
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
                    <Link key={item} href={`${pathname}?state=${item}`} prefetch={false} aria-current={item === state ? "page" : undefined} className={["rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white", item === state ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"].join(" ")}>
                      {stateLabels[item]}
                    </Link>
                  ))}
                </div>
              </div>
            </details>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
