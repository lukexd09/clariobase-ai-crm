import Link from "next/link";
import { getReviewState, prototypeLeads } from "@/lib/ux-prototype";

export default async function LeadsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getReviewState(await searchParams);
  if (state === "loading") return <StateCard title="Loading leads" body="Refreshing search, filters, sorting and pagination." />;
  if (state === "empty") return <StateCard title="No leads yet" body="This view is empty because no records match the current slice." tone="empty" />;
  if (state === "error") return <StateCard title="Leads list unavailable" body="The list could not be loaded." tone="error" />;
  if (state === "success") return <StateCard title="Search matched 4 leads" body="Filters and pagination are ready for review." tone="success" />;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Control label="Search" value="Aurora" />
        <Control label="City" value="Katowice" />
        <Control label="Sort" value="Priority" />
        <Control label="Page" value="1 of 3" />
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
            {prototypeLeads.map((lead) => (
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
      <p className="text-sm text-slate-600">Long business names remain readable and table scrolling stays local.</p>
    </div>
  );
}

function Control({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top text-slate-700">{children}</td>; }
function StateCard({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" | "empty" | "success" }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "empty" ? "border-amber-200 bg-amber-50" : tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-2xl border p-4 ${classes}`}><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{body}</p></div>;
}
