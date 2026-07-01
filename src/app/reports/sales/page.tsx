import type { ReactNode } from "react";
import { StatusPill } from "@/components/lead-status-pill";
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
import { PageSurface, Surface, SurfaceContent, SurfaceDescription, SurfaceHeader, SurfaceTitle, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/core-work-primitives";

export const dynamic = "force-dynamic";

export default async function SalesReportPage() {
  const report = await getSalesReport();
  const statusEntries = getSalesStatusEntries();

  return (
    <div className="space-y-4">
      <PageSurface
        eyebrow="Sales reporting"
        title="Operational pipeline report"
        description="Track the same operational counts, draft states and workbench health used elsewhere in the CRM."
      >
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Metric label="Total leads" value={report.totalLeads} />
          <Metric label="Active leads" value={report.activeLeads} />
          <Metric label="Overdue work items" value={report.workbenchBucketCounts.overdue} tone="overdue" />
          <Metric label="Activities logged" value={report.activityTotalCount} />
          <Metric label="Due today" value={report.workbenchBucketCounts.dueToday} tone="dueToday" />
          <Metric label="Leads with mini-audit drafts" value={report.leadsWithMiniAuditDrafts} />
          <Metric label="Leads with outreach drafts" value={report.leadsWithOutreachDrafts} />
          <Metric label="Leads with offer drafts" value={report.leadsWithOfferDrafts} />
          <Metric label="Activities in last 7 days" value={report.activityLast7DaysCount} />
        </section>
      </PageSurface>

      <div className="space-y-4">
        <ReportSection title="Lead status summary" description="Archived leads are excluded from active totals, while WON, LOST and DO_NOT_CONTACT remain visible as separate operational states.">
          <TableSurface aria-label="Lead status summary table">
            <Table>
              <caption className="sr-only">Lead status summary table</caption>
              <TableHead>
                <tr>
                  <TableHeadCell scope="col">Status</TableHeadCell>
                  <TableHeadCell scope="col">Group</TableHeadCell>
                  <TableHeadCell scope="col">Meaning</TableHeadCell>
                  <TableHeadCell scope="col">Next action</TableHeadCell>
                  <TableHeadCell scope="col">Count</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {statusEntries.map((entry) => (
                  <TableRow key={entry.status}>
                    <TableCell><StatusPill value={entry.status} appearance="foundation" /></TableCell>
                    <TableCell className="text-[color:var(--cb-muted-foreground)]">{entry.group}</TableCell>
                    <TableCell className="text-[color:var(--cb-muted-foreground)]">{entry.description}</TableCell>
                    <TableCell className="text-[color:var(--cb-muted-foreground)]">{entry.nextAction}</TableCell>
                    <TableCell className="font-medium tabular-nums text-[color:var(--cb-foreground)]">{report.leadStatusCounts[entry.status]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableSurface>
        </ReportSection>

        <div className="grid gap-4 xl:grid-cols-2">
          <ReportSection title="Priority summary" description="Count of leads by operational priority.">
            <SimpleCountTable rows={LEAD_PRIORITY_VALUES.map((value) => ({ label: value, value: report.priorityCounts[value] }))} />
          </ReportSection>

          <ReportSection title="Package fit summary" description="Count of leads by recommended package fit.">
            <SimpleCountTable rows={PACKAGE_FIT_VALUES.map((value) => ({ label: value, value: report.packageFitCounts[value] }))} />
          </ReportSection>

          <ReportSection title="Workbench health" description="The same actionable-bucket logic used by /work.">
            <SimpleCountTable rows={[{ label: "Overdue next actions", value: report.workbenchBucketCounts.overdue }, { label: "Due today", value: report.workbenchBucketCounts.dueToday }, { label: "Upcoming", value: report.workbenchBucketCounts.upcoming }, { label: "No next action", value: report.workbenchBucketCounts.noAction }]} />
          </ReportSection>

          <ReportSection title="Draft readiness" description="How many drafts exist and how many leads already have at least one draft artifact.">
            <div className="space-y-5">
              <SimpleCountTable heading="Mini-audit draft statuses" rows={MINI_AUDIT_STATUS_VALUES.map((value) => ({ label: value, value: report.miniAuditDraftStatusCounts[value] }))} />
              <SimpleCountTable heading="Outreach draft statuses" rows={OUTREACH_DRAFT_STATUS_VALUES.map((value) => ({ label: value, value: report.outreachDraftStatusCounts[value] }))} />
              <SimpleCountTable heading="Offer draft statuses" rows={OFFER_DRAFT_STATUS_VALUES.map((value) => ({ label: value, value: report.offerDraftStatusCounts[value] }))} />
            </div>
          </ReportSection>

          <ReportSection title="Activity summary" description="Manual activity logging still provides lightweight pipeline history.">
            <div className="space-y-5">
              <SimpleCountTable heading="Activity types" rows={ACTIVITY_TYPE_VALUES.map((value) => ({ label: value, value: report.activityTypeCounts[value] }))} />
              <p className="text-sm text-[color:var(--cb-muted-foreground)]">Total activities in the last 7 days: {report.activityLast7DaysCount}</p>
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
  tone
}: {
  label: string;
  value: number;
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
      <p className="mt-2 text-3xl font-semibold tabular-nums text-[color:var(--cb-foreground)]">{value}</p>
    </div>
  );
}

function ReportSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Surface>
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
  heading
}: {
  rows: Array<{ label: string; value: number }>;
  heading?: string;
}) {
  return (
    <div className="space-y-3">
      {heading ? <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--cb-muted-foreground)]">{heading}</h3> : null}
      <TableSurface aria-label={heading ?? "Sales summary table"}>
        <Table>
          <caption className="sr-only">{heading ?? "Sales summary table"}</caption>
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
