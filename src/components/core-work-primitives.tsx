import React from "react";
import { Surface, SurfaceContent, SurfaceDescription, SurfaceHeader, SurfaceTitle } from "@/components/clariobase-ui";
import { cn } from "@/lib/utils";

export type WorkTone = "neutral" | "success" | "warning" | "danger" | "information";

export function PageSurface({
  title,
  description,
  eyebrow,
  children
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Surface>
        <SurfaceHeader>
          {eyebrow ? <p className="text-sm font-medium text-[color:var(--cb-accent)]">{eyebrow}</p> : null}
          <SurfaceTitle className="text-2xl sm:text-3xl">{title}</SurfaceTitle>
          {description ? <SurfaceDescription>{description}</SurfaceDescription> : null}
        </SurfaceHeader>
        <SurfaceContent>{children}</SurfaceContent>
      </Surface>
    </div>
  );
}

export function WorkIndicator({
  label,
  count,
  tone
}: {
  label: string;
  count: string | number;
  tone: WorkTone;
}) {
  const toneClassName =
    tone === "danger"
      ? "border-[color:var(--cb-danger)]/25 bg-[color:var(--cb-danger)]/8 text-[color:var(--cb-danger-ink)]"
      : tone === "warning"
        ? "border-[color:var(--cb-warning)]/25 bg-[color:var(--cb-warning)]/8 text-[color:var(--cb-warning-ink)]"
        : tone === "information"
          ? "border-[color:var(--cb-information)]/25 bg-[color:var(--cb-information)]/8 text-[color:var(--cb-information-ink)]"
          : tone === "success"
            ? "border-[color:var(--cb-success)]/25 bg-[color:var(--cb-success)]/8 text-[color:var(--cb-success-ink)]"
            : "border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] text-[color:var(--cb-foreground)]";

  return (
    <div className={cn("rounded-[var(--cb-radius-lg)] border p-4", toneClassName)}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--cb-muted-foreground)]">
        {label}
      </dt>
      <dd className="mt-2 text-3xl font-semibold tabular-nums text-[color:var(--cb-foreground)]">{count}</dd>
    </div>
  );
}
