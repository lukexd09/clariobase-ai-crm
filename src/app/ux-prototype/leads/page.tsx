import Link from "next/link";
import { prototypeLeads, getPrototypeState } from "@/lib/ux-prototype";

export default async function LeadsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = getPrototypeState(await searchParams);
  if (state === "empty") return <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">No matching leads.</div>;
  return <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr><th className="px-3 py-2">Company</th><th className="px-3 py-2">Priority</th><th className="px-3 py-2">Next step</th></tr></thead><tbody>{prototypeLeads.map((lead)=><tr key={lead.id} className="border-t"><td className="px-3 py-2"><Link href={`/ux-prototype/leads/${lead.id}`} className="font-medium text-slate-950 underline-offset-4 hover:underline">{lead.company}</Link><div className="text-xs text-slate-500">{lead.city} · {lead.category}</div></td><td className="px-3 py-2">{lead.priority}</td><td className="px-3 py-2">{lead.nextStep}</td></tr>)}</tbody></table></div>;
}
