"use client";

import React from "react";
import { DashboardDataQualityAlert, MetricCard, PipelineSnapshot, PriorityItem } from "@/components/dashboard-primitives";
import { Surface, SurfaceContent, SurfaceHeader, SurfaceTitle } from "@/components/clariobase-ui";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/types";

const priorities = [
  {
    company: "Lumina PMU Studio",
    actionKey: "dashboard.priority.lumina.action",
    contextKey: "dashboard.priority.lumina.context",
    deadlineKey: "dashboard.priority.lumina.deadline",
    href: "/leads"
  },
  {
    company: "Aurora Nail Studio",
    actionKey: "dashboard.priority.aurora.action",
    contextKey: "dashboard.priority.aurora.context",
    deadlineKey: "dashboard.priority.aurora.deadline",
    href: "/leads"
  },
  {
    company: "Sienna Dental Care",
    actionKey: "dashboard.priority.sienna.action",
    contextKey: "dashboard.priority.sienna.context",
    deadlineKey: "dashboard.priority.sienna.deadline",
    href: "/leads"
  },
  {
    company: "Velvet Brows & Lashes",
    actionKey: "dashboard.priority.velvet.action",
    contextKey: "dashboard.priority.velvet.context",
    deadlineKey: "dashboard.priority.velvet.deadline",
    href: "/leads"
  }
] as const satisfies readonly { company: string; actionKey: TranslationKey; contextKey: TranslationKey; deadlineKey: TranslationKey; href: string }[];

const pipeline = [
  { stageKey: "dashboard.pipeline.new", value: 18 },
  { stageKey: "dashboard.pipeline.contacted", value: 12 },
  { stageKey: "dashboard.pipeline.qualified", value: 7 },
  { stageKey: "dashboard.pipeline.proposalSent", value: 5 },
  { stageKey: "dashboard.pipeline.won", value: 2 }
] as const satisfies readonly { stageKey: TranslationKey; value: number }[];

export function DashboardPage() {
  const { t, formatDate, formatNumber } = useI18n();
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--cb-foreground)]">{t("dashboard.title")}</h1>
        <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{t("dashboard.prioritiesFor", { date: formatDate("2026-06-21") })}</p>
      </header>

      <section className="space-y-3">
        <dl aria-label={t("dashboard.metrics")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={t("dashboard.metric.overdue")} value={formatNumber(2)} tone="danger" />
          <MetricCard label={t("dashboard.metric.dueToday")} value={formatNumber(4)} tone="warning" />
          <MetricCard label={t("dashboard.metric.upcoming")} value={formatNumber(11)} tone="information" />
          <MetricCard label={t("dashboard.metric.idle")} value={formatNumber(6)} tone="neutral" />
        </dl>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <Surface aria-labelledby="dashboard-priorities-heading">
          <SurfaceHeader>
            <SurfaceTitle id="dashboard-priorities-heading">{t("dashboard.todayPriorities")}</SurfaceTitle>
          </SurfaceHeader>
          <SurfaceContent>
            <ol className="list-none divide-y divide-[color:var(--cb-border)]">
              {priorities.map((item) => (
                <li key={item.company} className="py-4 first:pt-0 last:pb-0">
                  <PriorityItem company={item.company} action={t(item.actionKey)} context={t(item.contextKey)} deadline={t(item.deadlineKey)} href={item.href} />
                </li>
              ))}
            </ol>
          </SurfaceContent>
        </Surface>

        <div className="space-y-5">
          <DashboardDataQualityAlert />
          <PipelineSnapshot items={pipeline.map((item) => ({ stage: t(item.stageKey), value: item.value }))} />
        </div>
      </section>
    </div>
  );
}
