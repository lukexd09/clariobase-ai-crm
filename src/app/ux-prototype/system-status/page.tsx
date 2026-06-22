import Link from "next/link";
import { getReviewState } from "@/lib/ux-prototype";

export default async function SystemStatusPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getReviewState(await searchParams);
  if (state === "loading") return <Card title="Loading system status" body="Refreshing application, database and environment status." />;
  if (state === "empty") return <Card title="No status data" body="The prototype status panel is empty in this review slice." tone="empty" />;
  if (state === "error") return <Card title="System status unavailable" body="The check could not return fresh data." tone="error" />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <Link href="/ux-prototype/system-status?state=success" className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" aria-label="Refresh system status">
          Refresh
        </Link>
      </div>
      <Metric label="Application" value="Available" />
      <Metric label="Database" value="Available" />
      <Metric label="Environment" value="Preview" />
      <Metric label="Last checked" value="A few seconds ago" />
      <details className="md:col-span-2 rounded-2xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Technical details</summary>
        <div className="mt-3 text-sm text-slate-600">
          Check result: prototype-only.
          <br />
          Persistence: none.
          <br />
          Refresh action: presentation only.
        </div>
      </details>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-sm font-medium text-slate-950">{value}</p></div>;
}
function Card({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
