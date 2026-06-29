import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "information";

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-[color:var(--cb-neutral)]/25 bg-[color:var(--cb-neutral)]/10 text-[color:var(--cb-neutral-ink)]",
  success: "border-[color:var(--cb-success)]/25 bg-[color:var(--cb-success)]/10 text-[color:var(--cb-success-ink)]",
  warning: "border-[color:var(--cb-warning)]/25 bg-[color:var(--cb-warning)]/10 text-[color:var(--cb-warning-ink)]",
  danger: "border-[color:var(--cb-danger)]/25 bg-[color:var(--cb-danger)]/10 text-[color:var(--cb-danger-ink)]",
  information: "border-[color:var(--cb-information)]/25 bg-[color:var(--cb-information)]/10 text-[color:var(--cb-information-ink)]"
};

export function Badge({
  className = "",
  tone = "neutral",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full bg-current")} />
      <span>{children}</span>
    </span>
  );
}

export function StatusMessage({
  className = "",
  tone = "neutral",
  icon,
  title,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: StatusTone;
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-[var(--cb-radius-md)] border px-4 py-3 text-sm",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <div aria-hidden="true" className="mt-0.5 shrink-0">
        {icon ?? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-[0.7rem] font-semibold">i</span>}
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold">{title}</p>
        <p className="leading-6">{children}</p>
      </div>
    </div>
  );
}

