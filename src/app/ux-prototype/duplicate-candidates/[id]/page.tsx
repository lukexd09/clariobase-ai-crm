import Link from "next/link";
import { getReviewState, prototypeDuplicateStress, prototypeDuplicates } from "@/lib/ux-prototype";

export default async function DuplicateComparisonPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const state = getReviewState(await searchParams);
  const resolvedParams = (await searchParams) ?? {};
  const confirm = resolvedParams.confirm === "1";
  const successRequested = resolvedParams.state === "success";
  const itemList = state === "stress" ? prototypeDuplicateStress : prototypeDuplicates;
  const item = itemList.find((entry) => entry.id === id) ?? itemList[0];

  if (state === "loading") return <Card title="Loading comparison" body="Preparing existing and imported records." />;
  if (state === "error") return <Card title="Comparison unavailable" body="The candidate could not be opened." tone="error" />;
  if (state === "empty") return <Card title="No comparison available" body="There are no rows to compare in this slice." tone="empty" />;
  if (successRequested) return <Card title="Success feedback" body="A review action was acknowledged in the prototype copy." tone="success" />;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2">
        <Record title="Existing record" value={item.left} />
        <Record title="Imported record" value={item.right} />
      </section>
      <section className="rounded-2xl border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-950">Differences to review</h2>
        <p className="mt-2 text-sm text-slate-700">{item.difference}</p>
        <p className="mt-2 text-sm text-slate-600">{item.evidence}</p>
      </section>
      <section className="flex flex-wrap gap-2">
        <Link href={`/ux-prototype/duplicate-candidates/${item.id}`} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
          Keep separate
        </Link>
        <Link href={`/ux-prototype/duplicate-candidates/${item.id}?confirm=1`} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-800">
          Mark as same business
        </Link>
        <Link href={`/ux-prototype/duplicate-candidates/${item.id}?state=empty`} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900">
          Needs more review
        </Link>
      </section>
      {confirm ? (
        <section className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-950">Confirmation dialog presentation</h3>
          <p className="mt-2 text-sm text-slate-600">Are you sure you want to mark these records as the same business? No data will be saved.</p>
          <div className="mt-3 flex gap-2">
            <Link href={`/ux-prototype/duplicate-candidates/${item.id}`} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
              Cancel
            </Link>
            <Link href={`/ux-prototype/duplicate-candidates/${item.id}?state=success`} className="rounded-full bg-sky-700 px-3 py-1.5 text-sm font-semibold text-white">
              Confirm
            </Link>
          </div>
        </section>
      ) : null}
      <details className="rounded-2xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Technical matching details</summary>
        <div className="mt-3 text-sm text-slate-600">
          Audit trail: {item.auditTrail}
          <br />
          Decision note: {item.decision}
        </div>
      </details>
      {successRequested ? (
        <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Success feedback example: selection recorded in the review session only.
        </div>
      ) : null}
    </div>
  );
}

function Record({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p><p className="mt-2 text-base font-medium text-slate-950">{value}</p></div>;
}
function Card({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" | "success" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
