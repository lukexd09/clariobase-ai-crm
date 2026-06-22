import { prototypeDuplicates } from "@/lib/ux-prototype";

export default async function DuplicateComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = prototypeDuplicates.find((entry) => entry.id === id) ?? prototypeDuplicates[0];
  return <div className="grid gap-3 md:grid-cols-2"><Detail title="Left record" value={item.left} /><Detail title="Right record" value={item.right} /><div className="md:col-span-2 rounded-2xl border border-slate-200 p-4"><p className="text-sm font-medium text-slate-700">{item.difference}</p><p className="mt-2 text-sm text-slate-600">{item.evidence}</p><p className="mt-2 text-sm font-semibold text-slate-950">{item.decision}</p></div></div>;
}

function Detail({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p><p className="mt-2 text-base font-medium text-slate-950">{value}</p></div>; }
