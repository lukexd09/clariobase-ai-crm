export default function SalesOverviewPage() {
  return <div className="grid gap-3 md:grid-cols-3"><Metric label="Active leads" value="27" /><Metric label="Meetings booked" value="8" /><Metric label="Won this month" value="3" /></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p></div>;
}

