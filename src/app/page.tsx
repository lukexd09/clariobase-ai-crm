import Link from "next/link";
import { getHomepageSnapshot } from "@/lib/homepage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getHomepageSnapshot();
  const snapshotUnavailable = snapshot.length === 1 && snapshot[0].label === "Operational snapshot unavailable";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">ClarioBase AI CRM</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Daily CRM workspace
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                Start with leads or the workbench, then keep imports, duplicates, reporting, and health checks secondary.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/leads" prefetch={false} className="rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                  Open leads
                </Link>
                <Link href="/work" prefetch={false} className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                  Open workbench
                </Link>
              </div>
            </div>
            <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-2 lg:w-[28rem]">
              {snapshot.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className={snapshotUnavailable ? "mt-1 text-sm font-medium text-slate-700" : "mt-1 text-lg font-semibold text-slate-950"}>
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </section>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { href: "/reports/sales", title: "Sales report", label: "Reporting", description: "Current pipeline and status summary." },
            { href: "/imports", title: "Imports", label: "Data intake", description: "Review batch outcomes and row results." },
            { href: "/duplicates", title: "Duplicates", label: "Data quality", description: "Check likely duplicate candidates." },
            { href: "/health", title: "Health", label: "System", description: "Runtime and database readiness." }
          ].map((card) => (
            <Link key={card.href} href={card.href} prefetch={false} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow-[0_12px_30px_rgba(14,165,233,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
              <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {card.label}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">{card.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
            </Link>
          ))}
        </section>
        {snapshotUnavailable ? (
          <p className="mt-4 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            CRM data is temporarily unavailable. Open leads, workbench, or Health to keep working while the snapshot refreshes.
          </p>
        ) : null}
      </div>
    </main>
  );
}
