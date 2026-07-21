import type { ReactNode } from "react";
import { StatusPill } from "@/components/lead-status-pill";
import { requireUser } from "@/lib/auth-context";
import { ACTIVITY_TYPE_VALUES } from "@/lib/activity-values";
import { getSalesReport } from "@/lib/sales-report";
import {
  LEAD_PRIORITY_VALUES,
  OFFER_DRAFT_STATUS_VALUES,
  MINI_AUDIT_STATUS_VALUES,
  OUTREACH_DRAFT_STATUS_VALUES,
  PACKAGE_FIT_VALUES
} from "@/lib/lead-values";
import { getSalesStatusEntries } from "@/lib/sales-status";
import { PageSurface } from "@/components/core-work-primitives";
import { Surface, SurfaceContent, SurfaceDescription, SurfaceHeader, SurfaceTitle, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { getI18n } from "@/i18n/server";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";

export const dynamic = "force-dynamic";

export default async function SalesReportPage() {
  await requireUser({ mode: "redirect", returnTo: "/reports/sales" });
  const { t, formatNumber } = await getI18n();
  const report = await getSalesReport();
  const statusEntries = getSalesStatusEntries();

  return (
    <div className="space-y-4">
      <PageSurface
        eyebrow={t("sales.eyebrow")}
        title={t("sales.title")}
      >
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Metric label={t("sales.totalLeads")} value={report.totalLeads} formattedValue={formatNumber(report.totalLeads)} />
          <Metric label={t("sales.activeLeads")} value={report.activeLeads} formattedValue={formatNumber(report.activeLeads)} />
          <Metric label={t("sales.overdueItems")} value={report.workbenchBucketCounts.overdue} formattedValue={formatNumber(report.workbenchBucketCounts.overdue)} tone="overdue" />
          <Metric label={t("sales.activitiesLogged")} value={report.activityTotalCount} formattedValue={formatNumber(report.activityTotalCount)} />
          <Metric label={t("sales.dueToday")} value={report.workbenchBucketCounts.dueToday} formattedValue={formatNumber(report.workbenchBucketCounts.dueToday)} tone="dueToday" />
          <Metric label={t("sales.withAudits")} value={report.leadsWithMiniAuditDrafts} formattedValue={formatNumber(report.leadsWithMiniAuditDrafts)} />
          <Metric label={t("sales.withOutreach")} value={report.leadsWithOutreachDrafts} formattedValue={formatNumber(report.leadsWithOutreachDrafts)} />
          <Metric label={t("sales.withOffers")} value={report.leadsWithOfferDrafts} formattedValue={formatNumber(report.leadsWithOfferDrafts)} />
          <Metric label={t("sales.last7Days")} value={report.activityLast7DaysCount} formattedValue={formatNumber(report.activityLast7DaysCount)} />
        </section>
      </PageSurface>

      <div className="space-y-4">
        <ReportSection title={t("sales.statusSummary")} description={t("sales.statusSummaryDescription")}>
          <TableSurface aria-label={t("sales.statusTable")}>
            <Table>
              <caption className="sr-only">{t("sales.statusTable")}</caption>
              <TableHead>
                <tr>
                  <TableHeadCell scope="col">{t("sales.status")}</TableHeadCell>
                  <TableHeadCell scope="col">{t("sales.group")}</TableHeadCell>
                  <TableHeadCell scope="col">{t("sales.meaning")}</TableHeadCell>
                  <TableHeadCell scope="col">{t("sales.nextAction")}</TableHeadCell>
                  <TableHeadCell scope="col">{t("sales.count")}</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {statusEntries.map((entry) => (
                  <TableRow key={entry.status}>
                    <TableCell><StatusPill value={entry.status} appearance="foundation" /></TableCell>
                    <TableCell className="text-[color:var(--cb-muted-foreground)]">{t(`sales.group.${entry.group}`)}</TableCell>
                    <TableCell className="text-[color:var(--cb-muted-foreground)]">{t(entry.descriptionKey)}</TableCell>
                    <TableCell className="text-[color:var(--cb-muted-foreground)]">{t(entry.nextActionKey)}</TableCell>
                    <TableCell className="font-medium tabular-nums text-[color:var(--cb-foreground)]">{formatNumber(report.leadStatusCounts[entry.status])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableSurface>
        </ReportSection>

        <div className="space-y-4 xl:columns-2 xl:gap-4 xl:[column-fill:balance]">
          <ReportSection className="xl:break-inside-avoid xl:mb-4" title={t("sales.prioritySummary")} description={t("sales.priorityDescription")}>
            <SimpleCountTable fallbackHeading={t("sales.summaryTable")} rows={LEAD_PRIORITY_VALUES.map((value) => ({ label: t(getTaxonomyTranslationKey(value)), value: formatNumber(report.priorityCounts[value]) }))} />
          </ReportSection>

          <ReportSection className="xl:break-inside-avoid xl:mb-4" title={t("sales.packageSummary")} description={t("sales.packageDescription")}>
            <SimpleCountTable fallbackHeading={t("sales.summaryTable")} rows={PACKAGE_FIT_VALUES.map((value) => ({ label: t(getTaxonomyTranslationKey(value)), value: formatNumber(report.packageFitCounts[value]) }))} />
          </ReportSection>

          <ReportSection className="xl:break-inside-avoid xl:mb-4" title={t("sales.workbenchHealth")} description={t("sales.workbenchDescription")}>
            <SimpleCountTable fallbackHeading={t("sales.summaryTable")} rows={[{ label: t("sales.overdueNext"), value: formatNumber(report.workbenchBucketCounts.overdue) }, { label: t("sales.dueToday"), value: formatNumber(report.workbenchBucketCounts.dueToday) }, { label: t("sales.upcoming"), value: formatNumber(report.workbenchBucketCounts.upcoming) }, { label: t("sales.noNextAction"), value: formatNumber(report.workbenchBucketCounts.noAction) }]} />
          </ReportSection>

          <ReportSection className="xl:break-inside-avoid xl:mb-4" title={t("sales.draftReadiness")} description={t("sales.draftDescription")}>
            <div className="space-y-5">
              <SimpleCountTable fallbackHeading={t("sales.summaryTable")} heading={t("sales.auditStatuses")} rows={MINI_AUDIT_STATUS_VALUES.map((value) => ({ label: t(getTaxonomyTranslationKey(value)), value: formatNumber(report.miniAuditDraftStatusCounts[value]) }))} />
              <SimpleCountTable fallbackHeading={t("sales.summaryTable")} heading={t("sales.outreachStatuses")} rows={OUTREACH_DRAFT_STATUS_VALUES.map((value) => ({ label: t(getTaxonomyTranslationKey(value)), value: formatNumber(report.outreachDraftStatusCounts[value]) }))} />
              <SimpleCountTable fallbackHeading={t("sales.summaryTable")} heading={t("sales.offerStatuses")} rows={OFFER_DRAFT_STATUS_VALUES.map((value) => ({ label: t(getTaxonomyTranslationKey(value)), value: formatNumber(report.offerDraftStatusCounts[value]) }))} />
            </div>
          </ReportSection>

          <ReportSection className="xl:break-inside-avoid xl:mb-4" title={t("sales.activitySummary")} description={t("sales.activityDescription")}>
            <div className="space-y-5">
              <SimpleCountTable fallbackHeading={t("sales.summaryTable")} heading={t("sales.activityTypes")} rows={ACTIVITY_TYPE_VALUES.map((value) => ({ label: t(getTaxonomyTranslationKey(value)), value: formatNumber(report.activityTypeCounts[value]) }))} />
              <p className="text-sm text-[color:var(--cb-muted-foreground)]">{t("sales.totalLast7", { count: formatNumber(report.activityLast7DaysCount) })}</p>
            </div>
          </ReportSection>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  formattedValue,
  tone
}: {
  label: string;
  value: number;
  formattedValue: string;
  tone?: "overdue" | "dueToday";
}) {
  const classes =
    tone && value > 0
      ? tone === "overdue"
        ? "border-[color:var(--cb-danger)]/25 bg-[color:var(--cb-danger)]/8"
        : "border-[color:var(--cb-warning)]/25 bg-[color:var(--cb-warning)]/8"
      : "border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)]";

  return (
    <div className={`rounded-[var(--cb-radius-lg)] border p-4 ${classes}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
          tone && value > 0
            ? tone === "overdue"
              ? "text-[color:var(--cb-danger-ink)]"
              : "text-[color:var(--cb-warning-ink)]"
            : "text-[color:var(--cb-muted-foreground)]"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-[color:var(--cb-foreground)]">{formattedValue}</p>
    </div>
  );
}

function ReportSection({
  title,
  description,
  className,
  children
}: {
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Surface className={className}>
      <SurfaceHeader className="pb-0">
        <SurfaceTitle>{title}</SurfaceTitle>
        <SurfaceDescription>{description}</SurfaceDescription>
      </SurfaceHeader>
      <SurfaceContent className="pt-4">{children}</SurfaceContent>
    </Surface>
  );
}

function SimpleCountTable({
  rows,
  heading,
  fallbackHeading
}: {
  rows: Array<{ label: string; value: string }>;
  heading?: string;
  fallbackHeading: string;
}) {
  return (
    <div className="space-y-3">
      {heading ? <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--cb-muted-foreground)]">{heading}</h3> : null}
      <TableSurface aria-label={heading ?? fallbackHeading}>
        <Table>
          <caption className="sr-only">{heading ?? fallbackHeading}</caption>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{row.label}</TableCell>
                <TableCell className="text-right font-medium tabular-nums text-[color:var(--cb-foreground)]">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
