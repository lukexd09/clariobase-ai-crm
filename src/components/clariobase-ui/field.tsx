import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className = "", ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-[color:var(--cb-foreground)]", className)} {...props} />;
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 text-sm text-[color:var(--cb-foreground)] outline-none transition placeholder:text-[color:var(--cb-muted-foreground)] focus:border-[color:var(--cb-focus-ring)] focus:ring-2 focus:ring-[color:var(--cb-focus-ring)]/20 disabled:cursor-not-allowed disabled:opacity-[var(--cb-disabled-opacity)]",
        className
      )}
      {...props}
    />
  );
}

export function FormMessage({ className = "", ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm leading-6 text-[color:var(--cb-danger)]", className)} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 text-sm text-[color:var(--cb-foreground)] outline-none transition focus:border-[color:var(--cb-focus-ring)] focus:ring-2 focus:ring-[color:var(--cb-focus-ring)]/20 disabled:cursor-not-allowed disabled:opacity-[var(--cb-disabled-opacity)]",
        className
      )}
      {...props}
    />
  );
}

