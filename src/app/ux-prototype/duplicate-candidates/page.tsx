import Link from "next/link";
import { getReviewState, prototypeDuplicates } from "@/lib/ux-prototype";

export default async function DuplicateCandidatesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getReviewState(await searchParams);
  if (state === "loading") return <Card title="Loading duplicate candidates" body="Refreshing confidence and evidence." />;
  if (state === "empty") return <Card title="No duplicate candidates" body="There are no likely matches in the current slice." tone="empty" />;
  if (state === "error") return <Card title="Duplicate review unavailable" body="The list could not be loaded." tone="error" />;
  if (state === "success") return <Card title="Review complete" body="Candidates were rechecked and no change was applied." tone="success" />;

  return (
    <div className="space-y-3">
      {prototypeDuplicates.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.confidence} confidence</p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">{item.left} vs {item.right}</h2>
              <p className="mt-1 text-sm text-slate-700">{item.evidence}</p>
            </div>
            <Link href={`/ux-prototype/duplicate-candidates/${item.id}`} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-800">
              Compare
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function Card({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" | "success" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
