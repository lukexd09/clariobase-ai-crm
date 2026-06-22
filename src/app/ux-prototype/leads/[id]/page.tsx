import Link from "next/link";
import { prototypeLeads, getPrototypeState } from "@/lib/ux-prototype";

export default async function LeadDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const state = getPrototypeState(await searchParams);
  const lead = prototypeLeads.find((item) => item.id === id) ?? prototypeLeads[0];
  if (state === "loading") return <div className="rounded-2xl border border-slate-200 p-4">Loading lead detail...</div>;
  return <div className="space-y-4"><article className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Lead detail</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{lead.company}</h2><p className="mt-2 text-sm text-slate-600">{lead.contact} · {lead.phone} · {lead.email}</p><p className="mt-3 text-sm text-slate-700">{lead.reason}</p><p className="mt-3 text-sm font-medium text-slate-700">Recommended action: {lead.nextStep}</p></article><Link href="/ux-prototype/daily-work" className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline">Back to daily work</Link></div>;
}
