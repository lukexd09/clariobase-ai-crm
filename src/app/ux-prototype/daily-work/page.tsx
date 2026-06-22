import Link from "next/link";
import { getReviewState, prototypeWorkQueue } from "@/lib/ux-prototype";

export default async function DailyWorkPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getReviewState(await searchParams);
  if (state === "loading") return <StateCard title="Loading daily work" body="Collecting overdue, today, upcoming and no-next-action items." />;
  if (state === "empty") return <StateCard title="Nothing waiting" body="All daily work items are currently cleared." tone="empty" />;
  if (state === "error") return <StateCard title="Daily work unavailable" body="The queue could not be refreshed." tone="error" />;
  return (
    <div className="space-y-4">
      {prototypeWorkQueue.map((item) => (
        <section key={item.title} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.bucket}</p>
              <h2 className="mt-1 truncate text-base font-semibold text-slate-950" title={item.title}>
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.why}</p>
              <p className="mt-2 text-sm font-medium text-slate-700">Due: {item.due}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href={`/ux-prototype/leads/lead-aurora-bikes`} aria-label={`Open ${item.title}`} className="inline-flex min-h-10 items-center rounded-full border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
                Open
              </Link>
              <Link href={`/ux-prototype/leads/lead-aurora-bikes`} aria-label={`Update ${item.title}`} className="inline-flex min-h-10 items-center rounded-full border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
                Update
              </Link>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Next context: short follow-up note, outcome and reminder are ready for the operator.
          </div>
        </section>
      ))}
    </div>
  );
}

function StateCard({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50";
  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
