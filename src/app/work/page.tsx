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

const workIndicatorToneMap = {
  overdue: {
    card: "border-rose-200 bg-rose-50",
    label: "text-rose-700",
    marker: "bg-rose-500"
  },
  dueToday: {
    card: "border-amber-200 bg-amber-50",
    label: "text-amber-700",
    marker: "bg-amber-500"
  },
  upcoming: {
    card: "border-sky-200 bg-sky-50",
    label: "text-sky-700",
    marker: "bg-sky-500"
  },
  noAction: {
    card: "border-violet-200 bg-violet-50",
    label: "text-violet-700",
    marker: "bg-violet-500"
  },
  neutral: {
    card: "border-slate-200 bg-white",
    label: "text-slate-600",
    marker: "bg-slate-300"
  }
} as const;

type WorkBucketKey = keyof typeof workIndicatorToneMap;

function getWorkIndicatorStyles(key: WorkBucketKey, count: number) {
  if (count === 0) {
    return workIndicatorToneMap.neutral;
  }

  return workIndicatorToneMap[key];
}

function WorkIndicatorCard({
  bucketKey,
  label,
  count
}: {
  bucketKey: WorkBucketKey;
  label: string;
  count: number;
}) {
  const styles = getWorkIndicatorStyles(bucketKey, count);

  return (
    <div className={`flex min-h-16 items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${styles.card}`}>
      <div className="flex min-w-0 items-center gap-2">
        <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.marker}`} />
        <p className={`min-w-0 text-xs font-semibold uppercase tracking-[0.12em] ${styles.label}`}>
          {label}
        </p>
      </div>
      <p className="shrink-0 text-right text-2xl font-semibold leading-none tabular-nums text-slate-950">
        {count}
      </p>
    </div>
  );
}

export default async function WorkPage() {
  const leads = await getLeads();
  const buckets = getWorkBuckets(leads);
  const indicatorLabels: Record<string, string> = {
    overdue: "Overdue",
    dueToday: "Due today",
    upcoming: "Upcoming",
    noAction: "No next action"
  };
  const bucketCounts = buckets.map((bucket) => ({
    key: bucket.key,
    label: indicatorLabels[bucket.key] ?? bucket.title,
    count: bucket.leads.length
  }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <header className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.6fr)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Sales workbench
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
              Work queue
            </h1>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {bucketCounts.map((bucket) => (
              <WorkIndicatorCard
                key={bucket.key}
                bucketKey={bucket.key as WorkBucketKey}
                label={bucket.label}
                count={bucket.count}
              />
            ))}
          </div>
        </header>

        <div className="space-y-5">
          {buckets.map((bucket) => (
            <section key={bucket.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">{bucket.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{bucket.description}</p>
                </div>
                <p className="text-sm font-medium tabular-nums text-slate-500">{bucket.leads.length} leads</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <caption className="sr-only">{bucket.title} work queue</caption>
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <th scope="col" className="px-4 py-2.5">Business</th>
                        <th scope="col" className="px-4 py-2.5">City</th>
                        <th scope="col" className="px-4 py-2.5">Category</th>
                        <th scope="col" className="px-4 py-2.5">Status</th>
                        <th scope="col" className="px-4 py-2.5">Priority</th>
                        <th scope="col" className="px-4 py-2.5">Package</th>
                        <th scope="col" className="px-4 py-2.5">Score</th>
                        <th scope="col" className="px-4 py-2.5">Next action</th>
                        <th scope="col" className="px-4 py-2.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {bucket.leads.map((lead) => (
                        <tr key={lead.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-2.5 align-top">
                            <Link
                              href={`/leads/${lead.id}#quick-update`}
                              className="block min-w-0 truncate font-semibold text-slate-900 transition hover:text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              {lead.businessName}
                            </Link>
                            <div className="text-xs text-slate-500">
                              {lead.lastImportedAt ? `Last activity ${formatDate(lead.lastImportedAt)}` : "No activity yet"}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 align-top text-slate-600">{lead.city ?? "Not set"}</td>
                          <td className="px-4 py-2.5 align-top text-slate-600">{lead.category ?? "Not set"}</td>
                          <td className="px-4 py-2.5 align-top">
                            <StatusPill value={lead.leadStatus} appearance="light" />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <StatusPill value={lead.priority} appearance="light" />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <StatusPill value={lead.packageFit} appearance="light" />
                          </td>
                          <td className="px-4 py-2.5 align-top tabular-nums text-slate-700">
                            <div className="space-y-1">
                              <p className="font-medium tabular-nums text-slate-900">{lead.scoreTotal}</p>
                              {lead.scoreLabel ? (
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  {lead.scoreLabel}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 align-top tabular-nums text-slate-600">{formatDate(lead.nextActionAt)}</td>
                          <td className="px-4 py-2.5 align-top">
                            <Link
                              href={`/leads/${lead.id}#quick-update`}
                              aria-label={`Update ${lead.businessName}`}
                              className="inline-flex min-h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              Update
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {bucket.leads.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                            {bucket.key === "noAction" ? "No leads need a next action yet." : "No leads in this bucket."}
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
