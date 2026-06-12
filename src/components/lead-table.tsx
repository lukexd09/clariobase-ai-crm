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
    <div className="space-y-6">
      {filterControls}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
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
            <tbody className="divide-y divide-slate-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4 align-top">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-slate-900 transition hover:text-sky-700 focus-visible:outline-none focus-visible:underline"
                    >
                      {lead.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">{lead.city ?? "-"}</td>
                  <td className="px-4 py-4 align-top text-slate-600">{lead.category ?? "-"}</td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill value={lead.leadStatus} appearance="light" />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill value={lead.priority} appearance="light" />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill value={lead.packageFit} appearance="light" />
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{lead.scoreTotal}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">{formatDate(lead.nextActionAt)}</td>
                </tr>
              ))}
              {leads.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={8}>
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
