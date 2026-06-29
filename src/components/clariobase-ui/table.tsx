import React from "react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function TableSurface({
  className = "",
  role = "region",
  tabIndex = 0,
  "aria-label": ariaLabel = "Scrollable table",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="table-surface"
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      className={cn(
        "overflow-x-auto rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] shadow-[var(--cb-shadow-surface)]",
        className
      )}
      {...props}
    />
  );
}

export function Table({ className = "", ...props }: ComponentProps<"table">) {
  return <table data-slot="table" className={cn("min-w-full divide-y divide-[color:var(--cb-border)] text-sm", className)} {...props} />;
}

export function TableHead({ className = "", ...props }: ComponentProps<"thead">) {
  return <thead data-slot="table-head" className={cn("bg-[color:var(--cb-surface)]", className)} {...props} />;
}

export function TableHeadCell({ className = "", ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head-cell"
      className={cn(
        "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--cb-muted-foreground)]",
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className = "", ...props }: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("divide-y divide-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)]", className)} {...props} />;
}

export function TableRow({ className = "", ...props }: ComponentProps<"tr">) {
  return <tr data-slot="table-row" className={cn("transition hover:bg-[color:var(--cb-surface)]", className)} {...props} />;
}

export function TableCell({ className = "", ...props }: ComponentProps<"td">) {
  return <td data-slot="table-cell" className={cn("px-4 py-3 align-top text-[color:var(--cb-foreground)]", className)} {...props} />;
}
