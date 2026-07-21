import React from "react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  className = "",
  title,
  description,
  action,
  ...props
}: ComponentProps<"div"> & { title: string; description: string; action?: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[var(--cb-radius-lg)] border border-dashed border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] text-[color:var(--cb-accent)]">
          •
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-[color:var(--cb-foreground)]">{title}</p>
          <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export function Skeleton({ className = "", ...props }: ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-[var(--cb-radius-md)] bg-[color:var(--cb-surface)]", className)} {...props} />;
}

export function PaginationControls({ className = "", "aria-label": ariaLabel, ...props }: Omit<ComponentProps<"nav">, "aria-label"> & { "aria-label": string }) {
  return <nav aria-label={ariaLabel} className={cn("flex items-center justify-between gap-3 rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-3", className)} {...props} />;
}
