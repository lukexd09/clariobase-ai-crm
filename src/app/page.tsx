import Link from "next/link";
import { HOME_ACTION_CARDS, HOME_POSITIONING, HOME_STATUS_ITEMS } from "@/lib/homepage";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_42%,#ffffff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-6 rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1">
                ClarioBase AI CRM
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                Operational
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-500">Light CRM visual foundation</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                A calm entry point for lead review, work, reporting, imports, and duplicates.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">{HOME_POSITIONING}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/leads"
                className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                Open leads
              </Link>
              <Link
                href="/work"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-700"
              >
                Open workbench
              </Link>
            </div>
          </div>

          <aside className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-5 sm:min-w-[320px]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Current operational state
            </p>
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-slate-950">Ready for daily sales work</p>
              <p className="text-sm leading-6 text-slate-600">
                The CRM is live with lead review, workbench, reporting, imports, duplicates, and a
                file-based AI workflow.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              {HOME_STATUS_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HOME_ACTION_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_16px_40px_rgba(14,165,233,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                    Route
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-950">{card.title}</h2>
                  <p className="text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 transition group-hover:border-sky-200 group-hover:text-sky-600"
                >
                  &rarr;
                </span>
              </div>
            </Link>
          ))}
        </section>

        <footer className="mt-8 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-[0_10px_28px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <p>Designed for a solo operator to move quickly without a heavy admin-dashboard feel.</p>
          <p className="font-medium text-slate-500">No real data is shown on the homepage.</p>
        </footer>
      </div>
    </main>
  );
}
