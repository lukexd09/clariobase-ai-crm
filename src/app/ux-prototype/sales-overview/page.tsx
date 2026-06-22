import { getReviewState } from "@/lib/ux-prototype";

export default async function SalesOverviewPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getReviewState(await searchParams);
  if (state === "loading") return <Card title="Loading sales overview" body="Refreshing date range, funnel and business metrics." />;
  if (state === "empty") return <Card title="No sales activity in range" body="The selected date range has no qualifying work." tone="empty" />;
  if (state === "error") return <Card title="Sales overview unavailable" body="The summary could not be refreshed." tone="error" />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-700">Date range: 1 Jun 2026 - 21 Jun 2026</div>
      <section className="grid gap-3 md:grid-cols-3">
        <Metric label="Booked meetings" value="8" />
        <Metric label="Proposals sent" value="5" />
        <Metric label="Won deals" value="3" />
      </section>
      <section className="rounded-2xl border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-950">Stage distribution</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {[
            ["New", "6"],
            ["Contacted", "5"],
            ["Qualified", "3"],
            ["Proposal sent", "2"]
          ].map(([stage, value]) => (
            <div key={stage} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">{stage}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p></div>;
}
function Card({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
