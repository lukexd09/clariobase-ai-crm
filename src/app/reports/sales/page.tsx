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

export const dynamic = "force-dynamic";

export default async function SalesReportPage() {
  const report = await getSalesReport();
  const statusEntries = getSalesStatusEntries();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <header className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Sales reporting
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
              Operational pipeline report
            </h1>
          </div>
        </header>

        <section className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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

        <div className="space-y-5">
          <ReportSection
            title="Lead status summary"
            description="Archived leads are excluded from active totals, while WON, LOST and DO_NOT_CONTACT remain visible as separate operational states."
          >
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[34rem] overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <caption className="sr-only">Lead status summary table</caption>
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th scope="col" className="px-4 py-2.5">Status</th>
                      <th scope="col" className="px-4 py-2.5">Group</th>
                      <th scope="col" className="px-4 py-2.5">Meaning</th>
                      <th scope="col" className="px-4 py-2.5">Next action</th>
                      <th scope="col" className="px-4 py-2.5">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {statusEntries.map((entry) => (
                      <tr key={entry.status} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3 align-top">
                          <StatusPill value={entry.status} appearance="light" />
                        </td>
                        <td className="px-4 py-3 align-top text-slate-600">{entry.group}</td>
                        <td className="px-4 py-3 align-top text-slate-600">{entry.description}</td>
                        <td className="px-4 py-3 align-top text-slate-600">{entry.nextAction}</td>
                        <td className="px-4 py-3 align-top font-medium tabular-nums text-slate-900">
                          {report.leadStatusCounts[entry.status]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ReportSection>

          <div className="grid gap-4 xl:grid-cols-2">
            <ReportSection title="Priority summary" description="Count of leads by operational priority.">
              <SimpleCountTable
                rows={LEAD_PRIORITY_VALUES.map((value) => ({
                  label: value,
                  value: report.priorityCounts[value]
                }))}
              />
            </ReportSection>

            <ReportSection title="Package fit summary" description="Count of leads by recommended package fit.">
              <SimpleCountTable
                rows={PACKAGE_FIT_VALUES.map((value) => ({
                  label: value,
                  value: report.packageFitCounts[value]
                }))}
              />
            </ReportSection>

            <ReportSection
              title="Workbench health"
              description="The same actionable-bucket logic used by /work."
            >
              <SimpleCountTable
                rows={[
                  { label: "Overdue next actions", value: report.workbenchBucketCounts.overdue },
                  { label: "Due today", value: report.workbenchBucketCounts.dueToday },
                  { label: "Upcoming", value: report.workbenchBucketCounts.upcoming },
                  { label: "No next action", value: report.workbenchBucketCounts.noAction }
                ]}
              />
            </ReportSection>

            <ReportSection
              title="Draft readiness"
              description="How many drafts exist and how many leads already have at least one draft artifact."
            >
              <div className="space-y-5">
                <SimpleCountTable
                  heading="Mini-audit draft statuses"
                  rows={MINI_AUDIT_STATUS_VALUES.map((value) => ({
                    label: value,
                    value: report.miniAuditDraftStatusCounts[value]
                  }))}
                />
                <SimpleCountTable
                  heading="Outreach draft statuses"
                  rows={OUTREACH_DRAFT_STATUS_VALUES.map((value) => ({
                    label: value,
                    value: report.outreachDraftStatusCounts[value]
                  }))}
                />
                <SimpleCountTable
                  heading="Offer draft statuses"
                  rows={OFFER_DRAFT_STATUS_VALUES.map((value) => ({
                    label: value,
                    value: report.offerDraftStatusCounts[value]
                  }))}
                />
              </div>
            </ReportSection>

            <ReportSection
              title="Activity summary"
              description="Manual activity logging still provides lightweight pipeline history."
            >
              <div className="space-y-5">
                <SimpleCountTable
                  heading="Activity types"
                  rows={ACTIVITY_TYPE_VALUES.map((value) => ({
                    label: value,
                    value: report.activityTypeCounts[value]
                  }))}
                />
                <p className="text-sm text-slate-600">
                  Total activities in the last 7 days: {report.activityLast7DaysCount}
                </p>
              </div>
            </ReportSection>
          </div>
        </div>
      </div>
    </main>
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
        ? "border-rose-200 bg-rose-50"
        : "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${classes}`}>
      <p
        className={`text-xs font-semibold uppercase tracking-[0.18em] ${
          tone && value > 0
            ? tone === "overdue"
              ? "text-rose-700"
              : "text-amber-700"
            : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
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
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
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
      {heading ? <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{heading}</h3> : null}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">{heading ?? "Sales summary table"}</caption>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.label} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{row.label}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-950">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
