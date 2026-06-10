import Link from "next/link";
import { getLeads } from "@/lib/leads";
import { getWorkBuckets } from "@/lib/work-view";
import { StatusPill } from "@/components/lead-status-pill";

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Sales workbench</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Work queue</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            Open the day here, see which leads need attention first, and jump straight into the
            existing quick update form on each lead.
          </p>
        </header>

        <div className="space-y-8">
          {buckets.map((bucket) => (
            <section key={bucket.key} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-xl font-medium">{bucket.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{bucket.description}</p>
                </div>
                <p className="text-sm text-slate-400">{bucket.leads.length} leads</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900">
                    <tr className="text-left text-slate-400">
                      <th className="px-4 py-3">Business</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Package</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Next action</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bucket.leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-4">
                          <Link
                            href={`/leads/${lead.id}#quick-update`}
                            className="font-medium text-cyan-200 hover:text-cyan-100"
                          >
                            {lead.businessName}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-slate-300">{lead.city ?? "-"}</td>
                        <td className="px-4 py-4 text-slate-300">{lead.category ?? "-"}</td>
                        <td className="px-4 py-4">
                          <StatusPill value={lead.leadStatus} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill value={lead.priority} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill value={lead.packageFit} />
                        </td>
                        <td className="px-4 py-4 text-slate-200">
                          <div className="space-y-1">
                            <p>{lead.scoreTotal}</p>
                            {lead.scoreLabel ? (
                              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                                {lead.scoreLabel}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">{formatDate(lead.nextActionAt)}</td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/leads/${lead.id}#quick-update`}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200"
                          >
                            Quick update
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {bucket.leads.length === 0 ? (
                      <tr>
                        <td className="px-4 py-10 text-center text-slate-400" colSpan={9}>
                          No leads in this bucket.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
