import { prototypeImports } from "@/lib/ux-prototype";

export default async function ImportBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = prototypeImports.find((item) => item.id === id) ?? prototypeImports[0];
  return <article className="rounded-2xl border border-slate-200 p-4"><h2 className="text-lg font-semibold text-slate-950">{batch.label}</h2><p className="mt-2 text-sm text-slate-600">{batch.summary}</p><p className="mt-3 text-sm font-medium text-slate-700">{batch.status} · {batch.rows}</p></article>;
}
