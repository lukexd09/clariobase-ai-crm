import Link from "next/link";
import { getReviewState, prototypeLeadStress, prototypeLeads } from "@/lib/ux-prototype";

export default async function LeadsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getReviewState(await searchParams);
  if (state === "loading") return <StateCard title="Loading leads" body="Refreshing search, filters, sorting and pagination." />;
  if (state === "empty") return <StateCard title="No leads yet" body="This view is empty because no records match the current slice." tone="empty" />;
  if (state === "error") return <StateCard title="Leads list unavailable" body="The list could not be loaded." tone="error" />;
  if (state === "success") return <StateCard title="Search matched 4 leads" body="Filters and pagination are ready for review." tone="success" />;
  const rows = state === "stress" ? prototypeLeadStress : prototypeLeads;
  const total = state === "stress" ? 143 : rows.length;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
          <input className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600" defaultValue="" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">City</span>
          <select className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600" defaultValue="All cities">
            <option>All cities</option>
            <option>Katowice</option>
            <option>Gliwice</option>
            <option>Rybnik</option>
            <option>Tychy</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sort</span>
          <select className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600" defaultValue="Priority">
            <option>Priority</option>
            <option>Next step</option>
            <option>City</option>
          </select>
        </label>
      </section>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[760px] w-full text-left text-sm">
          <caption className="sr-only">Prototype leads list</caption>
          <thead className="bg-slate-50">
            <tr>
              <Th>Business</Th>
              <Th>Priority</Th>
              <Th>Next step</Th>
              <Th>Possible duplicate</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-200">
                <Td>
                  <Link href={`/ux-prototype/leads/${lead.id}`} className="font-semibold text-slate-950 underline-offset-4 hover:underline">
                    {lead.company}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">
                    {lead.city} · {lead.category}
                  </div>
                </Td>
                <Td>{lead.priority}</Td>
                <Td>{lead.nextStep}</Td>
                <Td>{lead.possibleDuplicate ?? "No clear duplicate"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > rows.length ? (
        <nav aria-label="Leads pagination" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <p className="font-medium text-slate-700">Showing 1–{rows.length} of {total}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-label="Previous page" disabled className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-400">Previous</button>
            <button type="button" aria-label="Page 1" className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 font-semibold text-sky-800">1</button>
            <button type="button" aria-label="Page 2" className="rounded-2xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700">2</button>
            <button type="button" aria-label="Page 3" className="rounded-2xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700">3</button>
            <button type="button" aria-label="Next page" className="rounded-2xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700">Next</button>
          </div>
        </nav>
      ) : null}
      <p className="text-sm text-slate-600">Long business names remain readable and table scrolling stays local.</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top text-slate-700">{children}</td>; }
function StateCard({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" | "success" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
