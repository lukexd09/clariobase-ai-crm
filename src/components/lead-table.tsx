import Link from "next/link";
import { type Lead } from "@/generated/prisma/client";
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
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(value) : "-";
}

export function LeadTable({
  leads,
  filterControls
}: {
  leads: LeadListItem[];
  filterControls: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      {filterControls}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Lead records matching the current filters</caption>
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <th scope="col" className="px-4 py-3">Business</th>
                <th scope="col" className="px-4 py-3">City</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Priority</th>
                <th scope="col" className="px-4 py-3">Package</th>
                <th scope="col" className="px-4 py-3">Score</th>
                <th scope="col" className="px-4 py-3">Next action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-slate-900 transition hover:text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      {lead.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-slate-600">{lead.city ?? "-"}</td>
                  <td className="px-4 py-3 align-top text-slate-600">{lead.category ?? "-"}</td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill value={lead.leadStatus} appearance="light" />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill value={lead.priority} appearance="light" />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill value={lead.packageFit} appearance="light" />
                  </td>
                  <td className="px-4 py-3 align-top tabular-nums text-slate-700">
                    <div className="space-y-1">
                      <p className="font-medium tabular-nums text-slate-900">{lead.scoreTotal}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top tabular-nums text-slate-600">
                    {formatDate(lead.nextActionAt)}
                  </td>
                </tr>
              ))}
              {leads.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    No leads match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
