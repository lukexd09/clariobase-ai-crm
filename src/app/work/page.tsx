import Link from "next/link";
import { getLeads } from "@/lib/leads";
import { getWorkBuckets } from "@/lib/work-view";
import { StatusPill } from "@/components/lead-status-pill";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium"
      }).format(value)
    : "-";
}

export default async function WorkPage() {
  const leads = await getLeads();
  const buckets = getWorkBuckets(leads);
  const bucketCounts = buckets.map((bucket) => ({
    key: bucket.key,
    title: bucket.title,
    count: bucket.leads.length
  }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-6">
        <header className="mb-5 grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] lg:p-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Sales workbench</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Work queue
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Open the day here, see which leads need attention first, and jump straight into the
              existing quick update form on each lead.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {bucketCounts.map((bucket) => (
              <div key={bucket.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {bucket.title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{bucket.count}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="space-y-5">
          {buckets.map((bucket) => (
            <section key={bucket.key} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">{bucket.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{bucket.description}</p>
                </div>
                <p className="text-sm font-medium text-slate-500">{bucket.leads.length} leads</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <caption className="sr-only">{bucket.title} work queue</caption>
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        <th scope="col" className="px-4 py-3">Business</th>
                        <th scope="col" className="px-4 py-3">City</th>
                        <th scope="col" className="px-4 py-3">Category</th>
                        <th scope="col" className="px-4 py-3">Status</th>
                        <th scope="col" className="px-4 py-3">Priority</th>
                        <th scope="col" className="px-4 py-3">Package</th>
                        <th scope="col" className="px-4 py-3">Score</th>
                        <th scope="col" className="px-4 py-3">Next action</th>
                        <th scope="col" className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {bucket.leads.map((lead) => (
                        <tr key={lead.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3 align-top">
                          <Link
                            href={`/leads/${lead.id}#quick-update`}
                              className="font-medium text-slate-900 transition hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            {lead.businessName}
                          </Link>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-600">{lead.city ?? "-"}</td>
                          <td className="px-4 py-3 align-top text-slate-600">{lead.category ?? "-"}</td>
                          <td className="px-4 py-3 align-top">
                            <StatusPill value={lead.leadStatus} appearance="light" />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <StatusPill value={lead.priority} appearance="light" />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <StatusPill value={lead.packageFit} appearance="light" />
                          </td>
                          <td className="px-4 py-3 align-top text-slate-700">
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">{lead.scoreTotal}</p>
                              {lead.scoreLabel ? (
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  {lead.scoreLabel}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-600">{formatDate(lead.nextActionAt)}</td>
                          <td className="px-4 py-3 align-top">
                          <Link
                            href={`/leads/${lead.id}#quick-update`}
                              className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            Quick update
                          </Link>
                          </td>
                        </tr>
                      ))}
                      {bucket.leads.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                            No leads in this bucket.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
