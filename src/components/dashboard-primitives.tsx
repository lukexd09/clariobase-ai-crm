"use client";

import React from "react";
import Link from "next/link";
import { Badge, ButtonLink, Surface, SurfaceContent, SurfaceDescription, SurfaceHeader, SurfaceTitle } from "@/components/clariobase-ui";
import { useI18n } from "@/i18n/provider";

export function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "danger" | "warning" | "information" | "neutral";
}) {
  return (
    <div className="rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-4 py-3 shadow-[var(--cb-shadow-surface)]">
      <dt>
        <Badge tone={tone}>{label}</Badge>
      </dt>
      <dd className="mt-2 text-[1.6rem] font-semibold leading-none tabular-nums text-[color:var(--cb-foreground)]">
        {value}
      </dd>
    </div>
  );
}

export function PriorityItem({
  company,
  action,
  context,
  deadline,
  href
}: {
  company: string;
  action: string;
  context: string;
  deadline: string;
  href: string;
}) {
  const { t } = useI18n();
  return (
    <article>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-base font-semibold text-[color:var(--cb-foreground)]">{action}</h3>
          <Link
            href={href}
            className="inline-flex rounded-sm text-sm font-medium text-[color:var(--cb-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-surface)]"
          >
            {company}
          </Link>
          <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{context}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <p className="text-sm text-[color:var(--cb-muted-foreground)]">
            <span className="font-medium text-[color:var(--cb-foreground)]">{t("dashboard.deadline")}</span> {deadline}
          </p>
          <ButtonLink
            href={href}
            aria-label={t("dashboard.openCompany", { company })}
            className="min-h-11 rounded-[var(--cb-radius-md)] px-3 focus-visible:ring-offset-[color:var(--cb-surface)]"
          >
            {t("dashboard.open")}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export function PipelineSnapshot({ items }: { items: readonly { stage: string; value: number }[] }) {
  const { t, formatNumber } = useI18n();
  const maximumValue = Math.max(...items.map((item) => item.value), 0);
  return (
    <Surface>
      <SurfaceHeader>
        <SurfaceTitle>{t("dashboard.pipeline")}</SurfaceTitle>
      </SurfaceHeader>
      <SurfaceContent className="space-y-3">
        <dl className="space-y-3">
          {items.map((item) => (
            <div key={item.stage} className="space-y-1.5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--cb-muted-foreground)]">
                  {item.stage}
                </dt>
                <dd className="font-semibold tabular-nums text-[color:var(--cb-foreground)]">{formatNumber(item.value)}</dd>
              </div>
              <div aria-hidden="true" className="h-1.5 rounded-full bg-[color:var(--cb-surface)]">
                <div
                  className="h-1.5 rounded-full bg-[color:var(--cb-neutral)]"
                  style={{ width: item.value === 0 || maximumValue === 0 ? "0%" : `${Math.max(8, (item.value / maximumValue) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </dl>
      </SurfaceContent>
    </Surface>
  );
}

export function DashboardDataQualityAlert({ count }: { count: number }) {
  const { t, formatNumber } = useI18n();
  if (count === 0) return null;

  return (
    <Surface className="border px-4 py-3 shadow-none border-[color:var(--cb-warning)]/35 bg-[color:var(--cb-warning)]/10">
      <SurfaceHeader className="p-0">
        <Badge tone="warning">{t("dashboard.warning")}</Badge>
        <SurfaceTitle className="text-sm font-semibold text-[color:var(--cb-warning-ink)]">
          {t("dashboard.dataQuality")}
        </SurfaceTitle>
      </SurfaceHeader>
      <SurfaceContent className="p-0 pt-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SurfaceDescription className="text-[color:var(--cb-foreground)]">
            {t("dashboard.duplicates", { count: formatNumber(count) })}
          </SurfaceDescription>
          <ButtonLink href="/duplicates" variant="secondary">
            {t("dashboard.review")}
          </ButtonLink>
        </div>
      </SurfaceContent>
    </Surface>
  );
}
