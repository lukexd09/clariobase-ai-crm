import React from "react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Surface({ className = "", ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="surface"
      className={cn(
        "rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] text-[color:var(--cb-foreground)] shadow-[var(--cb-shadow-surface)]",
        className
      )}
      {...props}
    />
  );
}

export function SurfaceHeader({ className = "", ...props }: ComponentProps<"div">) {
  return <div data-slot="surface-header" className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function SurfaceTitle({ className = "", ...props }: ComponentProps<"h2">) {
  return <h2 data-slot="surface-title" className={cn("text-lg font-semibold tracking-tight text-[color:var(--cb-foreground)]", className)} {...props} />;
}

export function SurfaceDescription({ className = "", ...props }: ComponentProps<"p">) {
  return <p data-slot="surface-description" className={cn("text-sm leading-6 text-[color:var(--cb-muted-foreground)]", className)} {...props} />;
}

export function SurfaceContent({ className = "", ...props }: ComponentProps<"div">) {
  return <div data-slot="surface-content" className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}
