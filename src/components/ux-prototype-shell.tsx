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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#prototype-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow">
        Skip to content
      </a>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-4 lg:px-6">
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow-sm">
          UX prototype — no data is saved
        </div>
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">UX approval prototype</p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">ClarioBase CRM review sandbox</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Review information architecture, responsive behavior, states and wording in an isolated static prototype.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review state</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PROTOTYPE_STATES.map((item) => (
                  <Link
                    key={item}
                    href={`${pathname}?state=${item}`}
                    prefetch={false}
                    aria-current={item === state ? "page" : undefined}
                    className={[
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      item === state ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    ].join(" ")}
                  >
                    {stateLabels[item]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>
        <div className="mt-3 grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label="Prototype sections" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prototype routes</p>
            <div className="mt-3 space-y-1">
              {PROTOTYPE_ROUTE_MAP.map((route) => {
                const active = pathname === route.href;
                const description = "description" in route ? route.description : undefined;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      active ? "border-sky-200 bg-sky-50 text-slate-950" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    ].join(" ")}
                  >
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
          <section id="prototype-content" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Route state</p>
                <p className="text-sm font-medium text-slate-700">{stateLabels[state]}</p>
              </div>
              <p className="text-xs text-slate-500">Keyboard, 320 px and 200% zoom ready</p>
            </div>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
