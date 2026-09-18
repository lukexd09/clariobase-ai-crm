import Link from "next/link";
import { getLeads } from "@/lib/leads";
import { getWorkBuckets } from "@/lib/work-view";
import { StatusPill } from "@/components/lead-status-pill";
import { ButtonLink, Surface, SurfaceContent, SurfaceDescription, SurfaceHeader, SurfaceTitle, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { WorkIndicator } from "@/components/core-work-primitives";
import { requireUser } from "@/lib/auth-context";
import { getI18n } from "@/i18n/server";
import { getVisibleWorkbenchScoreLabel } from "@/lib/workbench-presentation";

export const dynamic = "force-dynamic";

export default async function WorkPage() {
  await requireUser({ mode: "redirect", returnTo: "/work" });
  const { t, formatDate, formatNumber } = await getI18n();
  const leads = await getLeads();
  const buckets = getWorkBuckets(leads);
  const indicatorLabels = {
    overdue: t("dashboard.metric.overdue"),
    dueToday: t("dashboard.metric.dueToday"),
    upcoming: t("dashboard.metric.upcoming"),
    noAction: t("dashboard.metric.idle")
  };
  const bucketCounts = buckets.map((bucket) => ({
    key: bucket.key,
    label: indicatorLabels[bucket.key],
    count: bucket.leads.length
  }));

  return (
    <div className="space-y-4">
      <Surface>
        <SurfaceHeader>
          <p className="text-sm font-medium text-[color:var(--cb-accent)]">{t("work.eyebrow")}</p>
          <SurfaceTitle className="text-2xl sm:text-3xl">{t("work.title")}</SurfaceTitle>
        </SurfaceHeader>
        <SurfaceContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {bucketCounts.map((bucket) => (
              <WorkIndicator
                key={bucket.key}
                label={bucket.label}
                count={formatNumber(bucket.count)}
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
                  <SurfaceTitle className="text-lg">{t(bucket.titleKey)}</SurfaceTitle>
                  <SurfaceDescription>{t(bucket.descriptionKey)}</SurfaceDescription>
                </div>
                <p className="text-sm font-medium tabular-nums text-[color:var(--cb-muted-foreground)]">{t("work.leadCount", { count: formatNumber(bucket.leads.length) })}</p>
              </div>
            </SurfaceHeader>
            <SurfaceContent className="pt-4">
              <TableSurface aria-label={t("work.table", { bucket: t(bucket.titleKey) })}>
                <Table className="w-full min-w-[1240px] table-fixed">
                  <caption className="sr-only">{t("work.caption", { bucket: t(bucket.titleKey) })}</caption>
                  <TableHead>
                    <tr>
                      <TableHeadCell scope="col" className="w-44">{t("work.business")}</TableHeadCell>
                      <TableHeadCell scope="col" className="w-24">{t("work.city")}</TableHeadCell>
                      <TableHeadCell scope="col" className="w-36">{t("work.category")}</TableHeadCell>
                      <TableHeadCell scope="col" className="w-36">{t("work.status")}</TableHeadCell>
                      <TableHeadCell scope="col" className="w-28">{t("work.priority")}</TableHeadCell>
                      <TableHeadCell scope="col" className="w-28">{t("work.match")}</TableHeadCell>
                      <TableHeadCell scope="col" className="w-24">{t("work.score")}</TableHeadCell>
                      <TableHeadCell scope="col" className="w-32 whitespace-nowrap">{t("work.nextTask")}</TableHeadCell>
                      <TableHeadCell scope="col" className="w-32">{t("work.action")}</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {bucket.leads.map((lead) => {
                      const visibleScoreLabel = getVisibleWorkbenchScoreLabel(lead.scoreTotal, lead.scoreLabel);
                      return (
                        <TableRow key={lead.id}>
                        <TableCell>
                          <Link href={`/leads/${lead.id}#quick-update`} title={lead.businessName} className="line-clamp-2 max-w-44 break-words font-semibold leading-5 text-[color:var(--cb-foreground)] transition hover:text-[color:var(--cb-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]">
                            {lead.businessName}
                          </Link>
                        </TableCell>
                        <TableCell className="truncate whitespace-nowrap text-[color:var(--cb-muted-foreground)]" title={lead.city ?? undefined}>{lead.city ?? t("common.unavailable")}</TableCell>
                        <TableCell className="text-[color:var(--cb-muted-foreground)]"><span className="line-clamp-2 break-words" title={lead.category ?? undefined}>{lead.category ?? t("common.unavailable")}</span></TableCell>
                        <TableCell><StatusPill value={lead.leadStatus} appearance="foundation" className="whitespace-nowrap" /></TableCell>
                        <TableCell><StatusPill value={lead.priority} appearance="foundation" className="whitespace-nowrap" /></TableCell>
                        <TableCell><StatusPill value={lead.packageFit} appearance="foundation" className="whitespace-nowrap" /></TableCell>
                        <TableCell className="tabular-nums text-[color:var(--cb-foreground)]">
                          <div>
                            <p className="font-medium tabular-nums">{formatNumber(lead.scoreTotal)}</p>
                            {visibleScoreLabel ? <p className="mt-1 block max-w-24 truncate whitespace-nowrap text-xs text-[color:var(--cb-muted-foreground)]" title={visibleScoreLabel}>{visibleScoreLabel}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums text-[color:var(--cb-muted-foreground)]">{lead.nextActionAt ? formatDate(lead.nextActionAt) : t("common.unavailable")}</TableCell>
                        <TableCell>
                          <ButtonLink href={`/leads/${lead.id}#quick-update`} variant="secondary" className="!min-h-9 !px-3 !py-1.5 whitespace-nowrap">
                            {t("work.quickUpdate")}
                          </ButtonLink>
                        </TableCell>
                        </TableRow>
                      );
                    })}
                    {bucket.leads.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={9} className="py-8 text-left sm:text-center text-[color:var(--cb-muted-foreground)]">
                            {t("work.empty")}
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
