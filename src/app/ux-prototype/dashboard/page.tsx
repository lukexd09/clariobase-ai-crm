import { getPrototypeState, prototypeLeads } from "@/lib/ux-prototype";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = getPrototypeState(await searchParams);
  if (state === "loading") return <StateBlock title="Loading dashboard" body="Preparing the latest review snapshot..." />;
  if (state === "error") return <StateBlock title="Dashboard unavailable" body="The review snapshot could not be loaded." tone="error" />;
  if (state === "empty") return <StateBlock title="No priorities yet" body="Everything is caught up for today." tone="empty" />;
  return <div className="space-y-4">{prototypeLeads.slice(0, 2).map((lead) => <PriorityCard key={lead.id} lead={lead} />)}</div>;
}

function StateBlock({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" }) {
  const classes =
    tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}

function PriorityCard({ lead }: { lead: (typeof prototypeLeads)[number] }) {
  return <article className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{lead.priority} priority</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{lead.company}</h2><p className="mt-1 text-sm text-slate-600">{lead.reason}</p><p className="mt-3 text-sm font-medium text-slate-700">{lead.nextStep} · {lead.nextStepDue}</p></article>;
}
