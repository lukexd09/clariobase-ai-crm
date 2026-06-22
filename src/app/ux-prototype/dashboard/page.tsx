import Link from "next/link";
import { getReviewState, prototypeDashboard } from "@/lib/ux-prototype";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getReviewState(await searchParams);
  if (state === "loading") return <StateCard title="Loading dashboard" body="Preparing priorities, pipeline and work context." />;
  if (state === "empty") return <StateCard title="No priorities yet" body="The queue is clear and the pipeline is quiet." tone="empty" />;
  if (state === "error") return <StateCard title="Dashboard unavailable" body="The snapshot could not be refreshed right now." tone="error" />;
  if (state === "success") return <StateCard title="Review snapshot updated" body="Today’s priorities were refreshed after the latest review." tone="success" />;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {prototypeDashboard.kpis.map((item) => (
          <Metric key={item.label} label={item.label} value={item.value} />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-950">Today’s priorities</h2>
          <div className="mt-3 space-y-3">
            {prototypeDashboard.priorities.map((lead) => (
              <article key={lead.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{lead.priority} priority</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">{lead.company}</h3>
                    <p className="mt-1 text-sm text-slate-600">{lead.reason}</p>
                  </div>
                  <Link
                    href={`/ux-prototype/leads/${lead.id}`}
                    className="inline-flex min-h-10 items-center rounded-full border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                    aria-label={`Open ${lead.company}`}
                  >
                    Open
                  </Link>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">Deadline: {lead.nextStepDue}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-950">Pipeline snapshot</h2>
          <div className="mt-3 space-y-2">
            {prototypeDashboard.pipeline.map((stage) => (
              <div key={stage.stage} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">{stage.stage}</span>
                  <span className="text-sm font-semibold text-slate-950">{stage.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StateCard({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" | "success" }) {
  const toneClasses =
    tone === "error"
      ? "border-rose-200 bg-rose-50"
      : tone === "empty"
      ? "border-amber-200 bg-amber-50"
      : tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : "border-slate-200 bg-slate-50";
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
