import Link from "next/link";
import type { ReactNode } from "react";
import { type Lead } from "@/generated/prisma/client";
import { StatusPill } from "@/components/lead-status-pill";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";

type LeadListItem = Pick<Lead, "id" | "businessName" | "city" | "category" | "leadStatus" | "priority" | "packageFit" | "scoreTotal" | "nextActionAt">;

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(value) : "-";
}

export function LeadTable({
  leads,
  filterControls
}: {
  leads: LeadListItem[];
  filterControls: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {filterControls}

      <TableSurface aria-label="Lead records table">
        <Table>
          <caption className="sr-only">Lead records matching the current filters</caption>
          <TableHead>
            <tr>
              <TableHeadCell scope="col">Business</TableHeadCell>
              <TableHeadCell scope="col">City</TableHeadCell>
              <TableHeadCell scope="col">Category</TableHeadCell>
              <TableHeadCell scope="col">Status</TableHeadCell>
              <TableHeadCell scope="col">Priority</TableHeadCell>
              <TableHeadCell scope="col">Package</TableHeadCell>
              <TableHeadCell scope="col">Score</TableHeadCell>
              <TableHeadCell scope="col">Next action</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-semibold text-[color:var(--cb-foreground)] transition hover:text-[color:var(--cb-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
                  >
                    {lead.businessName}
                  </Link>
                </TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{lead.city ?? "-"}</TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{lead.category ?? "-"}</TableCell>
                <TableCell>
                  <StatusPill value={lead.leadStatus} appearance="foundation" />
                </TableCell>
                <TableCell>
                  <StatusPill value={lead.priority} appearance="foundation" />
                </TableCell>
                <TableCell>
                  <StatusPill value={lead.packageFit} appearance="foundation" />
                </TableCell>
                <TableCell className="tabular-nums">
                  <p className="font-medium tabular-nums text-[color:var(--cb-foreground)]">{lead.scoreTotal}</p>
                </TableCell>
                <TableCell className="tabular-nums text-[color:var(--cb-muted-foreground)]">{formatDate(lead.nextActionAt)}</TableCell>
              </TableRow>
            ))}
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-[color:var(--cb-muted-foreground)]">
                  No leads match the current filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
