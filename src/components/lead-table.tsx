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
    <div className="space-y-4">
      {filterControls}

      <div className="overflow-hidden rounded-[var(--cb-ui-radius-lg)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[color:var(--cb-ui-border)] text-sm">
            <caption className="sr-only">Lead records matching the current filters</caption>
            <thead className="bg-[color:var(--cb-ui-surface)]">
              <tr className="text-left text-[11px] font-semibold text-[color:var(--cb-ui-muted-foreground)]">
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
                <tr key={lead.id} className="transition hover:bg-[color:var(--cb-ui-surface)]">
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-[color:var(--cb-ui-foreground)] transition hover:text-[color:var(--cb-ui-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-ui-background)]"
                    >
                      {lead.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-[color:var(--cb-ui-muted-foreground)]">{lead.city ?? "-"}</td>
                  <td className="px-4 py-3 align-top text-[color:var(--cb-ui-muted-foreground)]">{lead.category ?? "-"}</td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill value={lead.leadStatus} appearance="light" />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill value={lead.priority} appearance="light" />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill value={lead.packageFit} appearance="light" />
                  </td>
                  <td className="px-4 py-3 align-top tabular-nums text-[color:var(--cb-ui-foreground)]">
                    <div className="space-y-1">
                      <p className="font-medium tabular-nums text-slate-900">{lead.scoreTotal}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top tabular-nums text-[color:var(--cb-ui-muted-foreground)]">
                    {formatDate(lead.nextActionAt)}
                  </td>
                </tr>
              ))}
              {leads.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[color:var(--cb-ui-muted-foreground)]" colSpan={8}>
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
