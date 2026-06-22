import Link from "next/link";
import { getReviewState, prototypeImports } from "@/lib/ux-prototype";

export default async function ImportBatchesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getReviewState(await searchParams);
  if (state === "loading") return <Card title="Loading batches" body="Refreshing batch outcomes and validation status." />;
  if (state === "empty") return <Card title="No import batches" body="There are no batches in the current review slice." tone="empty" />;
  if (state === "error") return <Card title="Import batches unavailable" body="The batch list could not be loaded." tone="error" />;

  return (
    <div className="space-y-3">
      {prototypeImports.map((batch) => (
        <Link key={batch.id} href={`/ux-prototype/import-batches/${batch.id}`} className="block rounded-2xl border border-slate-200 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{batch.status}</p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">{batch.label}</h2>
              <p className="mt-1 text-sm text-slate-600">{batch.company}</p>
              <p className="mt-1 text-sm text-slate-700">{batch.summary}</p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>{batch.rows}</p>
              <p>{batch.importedAt}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Card({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
