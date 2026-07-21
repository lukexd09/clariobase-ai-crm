import type { ReactNode } from "react";
import { Badge, Surface, SurfaceContent, SurfaceDescription, SurfaceHeader, SurfaceTitle } from "@/components/clariobase-ui";
import { cn } from "@/lib/utils";

export function DataQualityPageHeader({
  eyebrow,
  title,
  description,
  meta
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
}) {
  return (
    <Surface>
      <SurfaceHeader>
        <p className="text-sm font-medium text-[color:var(--cb-information-ink)]">{eyebrow}</p>
        <SurfaceTitle>{title}</SurfaceTitle>
        <SurfaceDescription>{description}</SurfaceDescription>
      </SurfaceHeader>
      {meta ? <SurfaceContent className="pt-0">{meta}</SurfaceContent> : null}
    </Surface>
  );
}

export function DataQualityMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: ReactNode;
  tone: "neutral" | "success" | "warning" | "danger" | "information";
}) {
  return (
    <div className="rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]">
      <dt className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--cb-muted-foreground)]">
        <Badge tone={tone}>{label}</Badge>
      </dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums text-[color:var(--cb-foreground)]">{value}</dd>
    </div>
  );
}

export function DataQualityStatusBadge({
  label,
  tone
}: {
  label: string;
  tone: "neutral" | "success" | "warning" | "danger" | "information";
}) {
  return <Badge tone={tone}>{label}</Badge>;
}

export function ConfidenceBadge({
  label,
  score,
  scoreLabel,
  tone,
  detail
}: {
  label: string;
  score: ReactNode;
  scoreLabel: string;
  tone: "neutral" | "success" | "warning" | "information";
  detail: string;
}) {
  return (
    <div className="space-y-2">
      <Badge tone={tone} className="uppercase tracking-wide">
        {label}
      </Badge>
      <p className="text-sm font-medium text-[color:var(--cb-foreground)]">{scoreLabel}: {score}</p>
      <p className="max-w-xs text-xs leading-5 text-[color:var(--cb-muted-foreground)]">{detail}</p>
    </div>
  );
}

export function TechnicalDisclosure({
  title,
  children,
  className = ""
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-4",
        className
      )}
    >
      <summary className="cursor-pointer list-none text-sm font-medium text-[color:var(--cb-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-surface)]">
        {title}
      </summary>
      <div className="mt-4 text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{children}</div>
    </details>
  );
}
