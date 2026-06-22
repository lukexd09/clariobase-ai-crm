import Link from "next/link";
import { getReviewState, prototypeLeadTimeline, prototypeLeadTimelineStress, prototypeLeads } from "@/lib/ux-prototype";

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const state = getReviewState(await searchParams);
  const lead = prototypeLeads.find((item) => item.id === id) ?? prototypeLeads[0];
  if (state === "loading") return <StateCard title="Loading lead detail" body="Preparing contact details, activity history and draft workflows." />;
  if (state === "error") return <StateCard title="Lead detail unavailable" body="The record could not be loaded." tone="error" />;
  if (state === "success") return <StateCard title="Lead detail saved in review copy" body="No production persistence is involved in the prototype." tone="success" />;
  const timeline = state === "stress" ? prototypeLeadTimelineStress : prototypeLeadTimeline;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Lead detail</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">{lead.company}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Phone" value={lead.phone} />
          <Info label="Email" value={lead.email} />
          <Info label="Website" value={lead.website} />
          <Info label="Instagram" value={lead.instagram} />
        </div>
        <p className="mt-4 text-sm text-slate-600">Last contact: {lead.lastContact}</p>
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Recommended action</p>
          <p className="mt-1 text-sm text-slate-700">{lead.reason}</p>
          <p className="mt-2 text-sm font-medium text-slate-700">Deadline: {lead.nextStepDue}</p>
          <Link href="#lead-controls" aria-label={`Open recommended action for ${lead.company}`} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-sky-700 px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
            Open action
          </Link>
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-950">Activity timeline</h3>
          <div className="mt-3 space-y-3">
            {timeline.map((item) => (
              <article key={item.type + item.date} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{item.type}</p>
                  <p className="text-xs text-slate-500">{item.date}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">Author: {item.author}</p>
                <p className="mt-1 text-sm text-slate-700">Result: {item.result}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">Next step: {item.nextStep}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <WorkflowBox title="Mini-audit" state={state === "stress" ? "Review copy with dense findings" : "Ready"} details={state === "stress" ? "Longer findings, denser wording and wider notes are visible for review." : "Needs business review before approval."} />
          <WorkflowBox title="Outreach" state={state === "stress" ? "Draft ready with extended context" : "Draft ready"} details={state === "stress" ? "Message, timing and follow-up steps are intentionally denser." : "Short message with a clear operator next step."} />
          <WorkflowBox title="Offer" state={state === "stress" ? "Saved copy with extra pricing context" : "Saved copy"} details={state === "stress" ? "Price, scope and deadline remain visible in a denser review copy." : "Price, scope and deadline are visible for review."} />
          <details className="rounded-2xl border border-slate-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Technical metadata</summary>
            <div className="mt-3 text-sm text-slate-600">
              Lead ID: {lead.id}
              <br />
              Score: {lead.score}
              <br />
              Owner: {lead.owner}
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
function WorkflowBox({ title, state, details }: { title: string; state: string; details: string }) {
  return (
    <section id={title === "Mini-audit" ? "lead-controls" : undefined} className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{state}</p>
      <p className="mt-1 text-sm text-slate-600">{details}</p>
    </section>
  );
}
function StateCard({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "success" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
