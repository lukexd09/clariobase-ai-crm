"use client";

import React from "react";
import { DashboardDataQualityAlert, MetricCard, PipelineSnapshot, PriorityItem } from "@/components/dashboard-primitives";
import { Surface, SurfaceContent, SurfaceHeader, SurfaceTitle } from "@/components/clariobase-ui";
import { useI18n } from "@/i18n/provider";
import type { DashboardData } from "@/lib/dashboard";

const METRIC_PRESENTATION = {
  overdue: { labelKey: "dashboard.metric.overdue", tone: "danger" },
  dueToday: { labelKey: "dashboard.metric.dueToday", tone: "warning" },
  upcoming: { labelKey: "dashboard.metric.upcoming", tone: "information" },
  noAction: { labelKey: "dashboard.metric.idle", tone: "neutral" }
} as const;

export function DashboardPage({ data }: { data: DashboardData }) {
  const { t, formatDate, formatDateTime, formatNumber } = useI18n();
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--cb-foreground)]">{t("dashboard.title")}</h1>
        <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{t("dashboard.prioritiesFor", { date: formatDate(data.operationalDate) })}</p>
      </header>

      <section className="space-y-3">
        <dl aria-label={t("dashboard.metrics")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((metric) => (
            <MetricCard
              key={metric.key}
              label={t(METRIC_PRESENTATION[metric.key].labelKey)}
              value={formatNumber(metric.count)}
              tone={METRIC_PRESENTATION[metric.key].tone}
            />
          ))}
        </dl>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <Surface aria-labelledby="dashboard-priorities-heading">
          <SurfaceHeader>
            <SurfaceTitle id="dashboard-priorities-heading">{t("dashboard.todayPriorities")}</SurfaceTitle>
          </SurfaceHeader>
          <SurfaceContent>
            {data.priorities.length > 0 ? (
              <ol className="list-none divide-y divide-[color:var(--cb-border)]">
                {data.priorities.map((item) => (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <PriorityItem
                      company={item.businessName}
                      action={t(item.nextActionKey)}
                      context={t(item.statusKey)}
                      deadline={item.deadlineAt ? formatDateTime(item.deadlineAt) : t("dashboard.noDeadline")}
                      href={item.href}
                    />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-6 text-sm text-[color:var(--cb-muted-foreground)]">{t("dashboard.prioritiesEmpty")}</p>
            )}
          </SurfaceContent>
        </Surface>

        <div className="space-y-5">
          <DashboardDataQualityAlert count={data.activeDuplicateCount} />
          <PipelineSnapshot items={data.pipeline.map((item) => ({ stage: t(item.stageKey), value: item.value }))} />
        </div>
      </section>
    </div>
  );
}
