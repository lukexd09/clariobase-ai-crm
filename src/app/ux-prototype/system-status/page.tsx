export default function SystemStatusPage() {
  return <div className="grid gap-3 md:grid-cols-2"><Status label="Application" value="Ready" /><Status label="Database" value="Unavailable in prototype" /><Status label="Environment" value="Local review build" /><Status label="Last checked" value="A few seconds ago" /></div>;
}

function Status({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-sm font-medium text-slate-950">{value}</p></div>; }

