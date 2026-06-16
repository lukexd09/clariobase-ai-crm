import Link from "next/link";
import {
  HOME_PRIMARY_ACTION_CARDS,
  HOME_SECONDARY_ACTIONS,
  HOME_POSITIONING,
  HOME_STATUS_ITEMS,
  HOME_SYSTEM_LINK
} from "@/lib/homepage";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <header className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.95fr)] lg:p-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-sky-700">ClarioBase AI CRM</p>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.2rem] lg:leading-tight">
                Lead operations in one focused workspace.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">{HOME_POSITIONING}</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/leads"
                prefetch={false}
                className="rounded-full bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              >
                Open leads
              </Link>
              <Link
                href="/work"
                prefetch={false}
                className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              >
                Open workbench
              </Link>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Data quality routes</p>
              <ul className="flex flex-wrap gap-2">
                {HOME_SECONDARY_ACTIONS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-white hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">Ready for daily sales work</p>
              <p className="text-lg font-semibold text-slate-950">
                Keep lead work moving without extra admin noise.
              </p>
              <p className="text-sm leading-[1.35] text-slate-600">
                Core routes stay in one place, while imports, duplicates, and system checks
                remain available when you need them.
              </p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {HOME_STATUS_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </header>

        <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {HOME_PRIMARY_ACTION_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              prefetch={false}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                    {card.label}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-950">{card.title}</h2>
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

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Keep system checks nearby without turning them into a primary workflow card.
            </p>
            <Link
              href={HOME_SYSTEM_LINK.href}
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              <span>Open {HOME_SYSTEM_LINK.title.toLowerCase()}</span>
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
