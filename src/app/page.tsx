import Link from "next/link";
import {
  HOME_PRIMARY_ACTION_CARDS,
  HOME_POSITIONING,
  HOME_STATUS_ITEMS,
  HOME_SYSTEM_LINK
} from "@/lib/homepage";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_42%,#ffffff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 lg:px-6 lg:py-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1">
                ClarioBase AI CRM
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                Operational
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Light CRM home</p>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.05]">
                Manage leads, follow-ups, and sales work in one calm workspace.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">{HOME_POSITIONING}</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/leads"
                className="rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                Open leads
              </Link>
              <Link
                href="/work"
                className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-700"
              >
                Open workbench
              </Link>
            </div>
          </div>

          <aside className="grid gap-2.5 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:min-w-[300px]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Current operational state
            </p>
            <div className="space-y-1.5">
              <p className="text-xl font-semibold text-slate-950">Ready for daily sales work</p>
              <p className="text-sm leading-[1.35] text-slate-600">
                Lead work stays organized here, while imports, duplicates, reporting, and AI
                review files stay under your control.
              </p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {HOME_STATUS_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </header>

        <section className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {HOME_PRIMARY_ACTION_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_16px_40px_rgba(14,165,233,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-700">
                    {card.label}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-950">{card.title}</h2>
                  <p className="text-sm leading-[1.35] text-slate-600">{card.description}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-400 transition group-hover:border-sky-200 group-hover:text-sky-600"
                >
                  &rarr;
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Built for focused lead review, controlled imports, and calm daily sales work.
            </p>
            <Link
              href={HOME_SYSTEM_LINK.href}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
            >
              <span>{HOME_SYSTEM_LINK.title}</span>
              <span aria-hidden="true" className="text-slate-400">
                &rarr;
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
