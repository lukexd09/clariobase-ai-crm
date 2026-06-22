import Link from "next/link";
import { getReviewState, prototypeImports } from "@/lib/ux-prototype";

export default async function ImportBatchDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const state = getReviewState(await searchParams);
  const batch = prototypeImports.find((item) => item.id === id) ?? prototypeImports[0];
  if (state === "loading") return <Card title="Loading batch detail" body="Refreshing row outcomes and validation notes." />;
  if (state === "error") return <Card title="Batch detail unavailable" body="The import batch could not be opened." tone="error" />;
  if (state === "empty") return <Card title="No row results" body="This batch has no imported or rejected rows yet." tone="empty" />;

  return (
    <div className="space-y-4">
      <nav aria-label="Import batch detail breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/ux-prototype/import-batches" prefetch={false} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
          Imports
        </Link>
        <span aria-hidden="true">/</span>
        <span>Batch details</span>
      </nav>
      <section className="rounded-2xl border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-950">{batch.label}</h2>
        <p className="mt-1 text-sm text-slate-600">{batch.summary}</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{batch.status}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-800">Retry</button>
          <button className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">Download rejected rows</button>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 p-4">
        <h3 className="text-base font-semibold text-slate-950">Row outcomes</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p>Row 1: created, matched on source ID.</p>
          <p>Row 2: updated, business name normalized.</p>
          <p>Row 3: rejected, source ID missing.</p>
        </div>
      </section>
      <details className="rounded-2xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Technical evidence</summary>
        <div className="mt-3 text-sm text-slate-600">
          Validation rules: required source IDs, business name, city and import source.
          <br />
          Error summary: source ID missing for row 3.
        </div>
      </details>
    </div>
  );
}

function Card({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
