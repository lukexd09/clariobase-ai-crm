import React from "react";
import Link from "next/link";
import { ButtonLink, Surface, SurfaceContent, SurfaceDescription, SurfaceHeader, SurfaceTitle } from "@/components/clariobase-ui";

type KPITone = "danger" | "warning" | "information" | "neutral";

const toneClasses: Record<KPITone, { badge: string; value: string; border: string; bar: string }> = {
  danger: {
    badge: "border-[color:var(--cb-danger)]/25 bg-[color:var(--cb-danger)]/10 text-[color:var(--cb-danger-ink)]",
    value: "text-[color:var(--cb-danger-ink)]",
    border: "border-[color:var(--cb-danger)]/25",
    bar: "bg-[color:var(--cb-danger)]"
  },
  warning: {
    badge: "border-[color:var(--cb-warning)]/25 bg-[color:var(--cb-warning)]/10 text-[color:var(--cb-warning-ink)]",
    value: "text-[color:var(--cb-warning-ink)]",
    border: "border-[color:var(--cb-warning)]/25",
    bar: "bg-[color:var(--cb-warning)]"
  },
  information: {
    badge: "border-[color:var(--cb-information)]/25 bg-[color:var(--cb-information)]/10 text-[color:var(--cb-information-ink)]",
    value: "text-[color:var(--cb-information-ink)]",
    border: "border-[color:var(--cb-information)]/25",
    bar: "bg-[color:var(--cb-information)]"
  },
  neutral: {
    badge: "border-[color:var(--cb-neutral)]/25 bg-[color:var(--cb-neutral)]/10 text-[color:var(--cb-neutral-ink)]",
    value: "text-[color:var(--cb-neutral-ink)]",
    border: "border-[color:var(--cb-neutral)]/25",
    bar: "bg-[color:var(--cb-neutral)]"
  }
};

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="space-y-1">
      <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--cb-foreground)]">
        {title}
      </h1>
      <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{subtitle}</p>
    </header>
  );
}

export function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: KPITone;
}) {
  const styles = toneClasses[tone];

  return (
    <div className={`rounded-[var(--cb-radius-md)] border bg-[color:var(--cb-surface)] px-4 py-3 shadow-[var(--cb-shadow-surface)] ${styles.border}`}>
      <dl className="space-y-2">
        <dt className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles.badge}`}>
          {label}
        </dt>
        <dd className={`text-[1.6rem] font-semibold tabular-nums leading-none ${styles.value}`}>{value}</dd>
      </dl>
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
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-base font-semibold text-[color:var(--cb-foreground)]">
            <Link
              href={href}
              className="rounded-sm text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-surface)]"
            >
              {action}
            </Link>
          </h3>
          <p className="text-sm font-medium text-[color:var(--cb-foreground)]">{company}</p>
          <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{context}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <p className="text-sm text-[color:var(--cb-muted-foreground)]">
            <span className="font-medium text-[color:var(--cb-foreground)]">Deadline:</span> {deadline}
          </p>
          <ButtonLink
            href={href}
            className="min-h-11 rounded-[var(--cb-radius-md)] px-3 focus-visible:ring-offset-[color:var(--cb-surface)]"
          >
            Open
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

type AlertTone = "warning" | "error" | "information";

const alertToneClasses: Record<AlertTone, { surface: string; title: string; body: string }> = {
  warning: {
    surface: "border-[color:var(--cb-warning)]/35 bg-[color:var(--cb-warning)]/10",
    title: "text-[color:var(--cb-warning-ink)]",
    body: "text-[color:var(--cb-foreground)]"
  },
  error: {
    surface: "border-[color:var(--cb-danger)]/35 bg-[color:var(--cb-danger)]/10",
    title: "text-[color:var(--cb-danger-ink)]",
    body: "text-[color:var(--cb-foreground)]"
  },
  information: {
    surface: "border-[color:var(--cb-information)]/35 bg-[color:var(--cb-information)]/10",
    title: "text-[color:var(--cb-information-ink)]",
    body: "text-[color:var(--cb-foreground)]"
  }
};

export function Alert({
  title,
  body,
  actionHref,
  actionLabel,
  tone = "information"
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
  tone?: AlertTone;
}) {
  const styles = alertToneClasses[tone];

  return (
    <Surface className={`border px-4 py-3 shadow-none ${styles.surface}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
          <p className={`text-sm leading-6 ${styles.body}`}>{body}</p>
        </div>
        <ButtonLink href={actionHref} variant="secondary">
          {actionLabel}
        </ButtonLink>
      </div>
    </Surface>
  );
}

export function PipelineSnapshot({ items }: { items: readonly { stage: string; value: number }[] }) {
  return (
    <Surface>
      <SurfaceHeader>
        <SurfaceTitle>Pipeline snapshot</SurfaceTitle>
        <SurfaceDescription>Current stage mix for the active lead queue.</SurfaceDescription>
      </SurfaceHeader>
      <SurfaceContent className="space-y-3">
        {items.map((item) => (
          <div key={item.stage} className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--cb-muted-foreground)]">
                {item.stage}
              </span>
              <span className="font-semibold tabular-nums text-[color:var(--cb-foreground)]">{item.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[color:var(--cb-surface)]">
              <div
                aria-hidden="true"
                className={`h-1.5 rounded-full ${toneClasses.neutral.bar}`}
                style={{ width: `${Math.max(8, Math.min(100, item.value * 5))}%` }}
              />
            </div>
          </div>
        ))}
      </SurfaceContent>
    </Surface>
  );
}
