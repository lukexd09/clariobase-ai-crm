import Link from "next/link";
import { type Lead } from "@prisma/client";
import { StatusPill } from "@/components/lead-status-pill";

type LeadListItem = Pick<
  Lead,
  | "id"
  | "businessName"
  | "city"
  | "category"
  | "leadStatus"
  | "priority"
  | "packageFit"
  | "scoreTotal"
  | "nextActionAt"
>;

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(value) : "—";
}

function filterHref(params: Record<string, string | undefined>, key: string, value: string) {
  const next = new URLSearchParams();

  for (const [paramKey, paramValue] of Object.entries(params)) {
    if (paramValue) next.set(paramKey, paramValue);
  }

  if (value) next.set(key, value);
  else next.delete(key);

  return `/leads?${next.toString()}`;
}

export function LeadTable({
  leads,
  filterControls
}: {
  leads: LeadListItem[];
  filterControls: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {filterControls}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900">
            <tr className="text-left text-slate-400">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Next action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-4">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-cyan-200 hover:text-cyan-100">
                    {lead.businessName}
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-300">{lead.city ?? "—"}</td>
                <td className="px-4 py-4 text-slate-300">{lead.category ?? "—"}</td>
                <td className="px-4 py-4">
                  <StatusPill value={lead.leadStatus} />
                </td>
                <td className="px-4 py-4">
                  <StatusPill value={lead.priority} />
                </td>
                <td className="px-4 py-4">
                  <StatusPill value={lead.packageFit} />
                </td>
                <td className="px-4 py-4 text-slate-200">{lead.scoreTotal}</td>
                <td className="px-4 py-4 text-slate-300">{formatDate(lead.nextActionAt)}</td>
              </tr>
            ))}
            {leads.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-400" colSpan={8}>
                  No leads match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
