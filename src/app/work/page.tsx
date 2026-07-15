import Link from "next/link";
import { getLeads } from "@/lib/leads";
import { getWorkBuckets } from "@/lib/work-view";
import { StatusPill } from "@/components/lead-status-pill";
import { ButtonLink, Surface, SurfaceContent, SurfaceDescription, SurfaceHeader, SurfaceTitle, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { WorkIndicator } from "@/components/core-work-primitives";
import { requireUser } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium"
      }).format(value)
    : "-";
}

export default async function WorkPage() {
  await requireUser({ mode: "redirect", returnTo: "/work" });
  const leads = await getLeads();
  const buckets = getWorkBuckets(leads);
  const indicatorLabels: Record<string, string> = {
    overdue: "Overdue",
    dueToday: "Due today",
    upcoming: "Upcoming",
    noAction: "Idle"
  };
  const bucketCounts = buckets.map((bucket) => ({
    key: bucket.key,
    label: indicatorLabels[bucket.key] ?? bucket.title,
    count: bucket.leads.length
  }));

  return (
    <div className="space-y-4">
      <Surface>
        <SurfaceHeader>
          <p className="text-sm font-medium text-[color:var(--cb-accent)]">Operator queue</p>
          <SurfaceTitle className="text-2xl sm:text-3xl">Work queue</SurfaceTitle>
        </SurfaceHeader>
        <SurfaceContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {bucketCounts.map((bucket) => (
              <WorkIndicator
                key={bucket.key}
                label={bucket.label}
                count={bucket.count}
                tone={bucket.count === 0 ? "neutral" : bucket.key === "overdue" ? "danger" : bucket.key === "dueToday" ? "warning" : bucket.key === "upcoming" ? "information" : "success"}
              />
            ))}
          </dl>
        </SurfaceContent>
      </Surface>

      <div className="space-y-4">
        {buckets.map((bucket) => (
          <Surface key={bucket.key}>
            <SurfaceHeader className="pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="space-y-1">
                  <SurfaceTitle className="text-lg">{bucket.title}</SurfaceTitle>
                  <SurfaceDescription>{bucket.description}</SurfaceDescription>
                </div>
                <p className="text-sm font-medium tabular-nums text-[color:var(--cb-muted-foreground)]">{bucket.leads.length} leads</p>
              </div>
            </SurfaceHeader>
            <SurfaceContent className="pt-4">
              <TableSurface aria-label={`${bucket.title} table`}>
                <Table>
                  <caption className="sr-only">{bucket.title} work queue</caption>
                  <TableHead>
                    <tr>
                      <TableHeadCell scope="col">Business</TableHeadCell>
                      <TableHeadCell scope="col">City</TableHeadCell>
                      <TableHeadCell scope="col">Category</TableHeadCell>
                      <TableHeadCell scope="col">Status</TableHeadCell>
                      <TableHeadCell scope="col">Priority</TableHeadCell>
                      <TableHeadCell scope="col">Match</TableHeadCell>
                      <TableHeadCell scope="col">Score</TableHeadCell>
                      <TableHeadCell scope="col">Next task</TableHeadCell>
                      <TableHeadCell scope="col">Action</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {bucket.leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <Link href={`/leads/${lead.id}#quick-update`} className="font-semibold text-[color:var(--cb-foreground)] transition hover:text-[color:var(--cb-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]">
                            {lead.businessName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-[color:var(--cb-muted-foreground)]">{lead.city ?? "-"}</TableCell>
                        <TableCell className="text-[color:var(--cb-muted-foreground)]">{lead.category ?? "-"}</TableCell>
                        <TableCell><StatusPill value={lead.leadStatus} appearance="foundation" /></TableCell>
                        <TableCell><StatusPill value={lead.priority} appearance="foundation" /></TableCell>
                        <TableCell><StatusPill value={lead.packageFit} appearance="foundation" /></TableCell>
                        <TableCell className="tabular-nums text-[color:var(--cb-foreground)]">
                          <div className="space-y-1">
                            <p className="font-medium tabular-nums">{lead.scoreTotal}</p>
                            {lead.scoreLabel ? <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cb-muted-foreground)]">{lead.scoreLabel}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-[color:var(--cb-muted-foreground)]">{formatDate(lead.nextActionAt)}</TableCell>
                        <TableCell>
                          <ButtonLink href={`/leads/${lead.id}#quick-update`} variant="secondary" className="min-h-9 px-3 py-1.5 whitespace-nowrap">
                            Quick update
                          </ButtonLink>
                        </TableCell>
                      </TableRow>
                    ))}
                    {bucket.leads.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={9} className="py-8 text-left sm:text-center text-[color:var(--cb-muted-foreground)]">
                            No records in this bucket.
                          </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableSurface>
            </SurfaceContent>
          </Surface>
        ))}
      </div>
    </div>
  );
}
