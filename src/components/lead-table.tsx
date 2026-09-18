import Link from "next/link";
import type { ReactNode } from "react";
import { type Lead } from "@/generated/prisma/client";
import { StatusPill } from "@/components/lead-status-pill";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { getI18n } from "@/i18n/server";

type LeadListItem = Pick<Lead, "id" | "businessName" | "city" | "category" | "leadStatus" | "priority" | "packageFit" | "scoreTotal" | "nextActionAt">;

export async function LeadTable({
  leads,
  filterControls
}: {
  leads: LeadListItem[];
  filterControls: ReactNode;
}) {
  const { t, formatDate, formatNumber } = await getI18n();
  return (
    <div className="space-y-4">
      {filterControls}

      <TableSurface aria-label={t("leads.table")}>
        <Table>
          <caption className="sr-only">{t("leads.caption")}</caption>
          <TableHead>
            <tr>
              <TableHeadCell scope="col">{t("leads.column.business")}</TableHeadCell>
              <TableHeadCell scope="col">{t("leads.column.city")}</TableHeadCell>
              <TableHeadCell scope="col">{t("leads.column.category")}</TableHeadCell>
              <TableHeadCell scope="col">{t("leads.column.status")}</TableHeadCell>
              <TableHeadCell scope="col">{t("leads.column.priority")}</TableHeadCell>
              <TableHeadCell scope="col">{t("leads.column.match")}</TableHeadCell>
              <TableHeadCell scope="col">{t("leads.column.score")}</TableHeadCell>
              <TableHeadCell scope="col">{t("leads.column.nextTask")}</TableHeadCell>
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
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{lead.city ?? t("common.unavailable")}</TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{lead.category ?? t("common.unavailable")}</TableCell>
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
                  <p className="font-medium tabular-nums text-[color:var(--cb-foreground)]">{formatNumber(lead.scoreTotal)}</p>
                </TableCell>
                <TableCell className="tabular-nums text-[color:var(--cb-muted-foreground)]">{lead.nextActionAt ? formatDate(lead.nextActionAt) : t("common.unavailable")}</TableCell>
              </TableRow>
            ))}
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-left sm:text-center text-[color:var(--cb-muted-foreground)]">
                  {t("leads.empty")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
