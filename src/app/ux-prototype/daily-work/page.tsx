import { prototypeWorkQueue, getPrototypeState } from "@/lib/ux-prototype";

export default async function DailyWorkPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = getPrototypeState(await searchParams);
  if (state === "empty") return <EmptyState />;
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {prototypeWorkQueue.map((item) => (
        <div key={item.title} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.bucket}</p><h2 className="mt-1 text-base font-semibold text-slate-950">{item.title}</h2></div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">{item.owner}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.why}</p>
          <p className="mt-3 text-sm font-medium text-slate-700">Due: {item.due}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState() { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">No tasks are currently waiting.</div>; }
