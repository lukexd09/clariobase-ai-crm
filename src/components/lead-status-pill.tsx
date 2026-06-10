import {
  type DuplicateCandidateStatusValue,
  type ImportBatchStatusValue,
  type ImportRowStatusValue,
  type ImportSourceTypeValue,
  type LeadPriorityValue,
  type LeadStatusValue,
  type PackageFitValue
} from "@/lib/lead-values";
import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  NEW: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  QUALIFIED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  TO_AUDIT: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  AUDITED: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  CONTACTED: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
  REPLIED: "bg-lime-500/15 text-lime-200 border-lime-500/30",
  DISCOVERY_SCHEDULED:
    "bg-violet-500/15 text-violet-200 border-violet-500/30",
  OFFER_SENT: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30",
  WON: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  LOST: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  NURTURE: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  BAD_FIT: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  DO_NOT_CONTACT: "bg-red-500/15 text-red-200 border-red-500/30",
  ARCHIVED: "bg-zinc-500/15 text-zinc-200 border-zinc-500/30",
  LOW: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  MEDIUM: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  HIGH: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  URGENT: "bg-red-500/15 text-red-200 border-red-500/30",
  UNKNOWN: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  BASE: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  CLARITY: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  MOMENTUM: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  NOT_FIT: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  CREATED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  UPDATED: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  REJECTED: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  SKIPPED: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  RUNNING: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  COMPLETED_WITH_ERRORS: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  FAILED: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  LOCAL_JSON: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  HARVESTER_EXPORT: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  MANUAL_AI_PREPARED_FILE: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30"
  ,
  OPEN: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  NEEDS_REVIEW: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  DISMISSED: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  RESOLVED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
};

export function StatusPill({
  value,
  className
}: {
  value:
    | LeadStatusValue
    | LeadPriorityValue
    | PackageFitValue
    | ImportBatchStatusValue
    | ImportRowStatusValue
    | ImportSourceTypeValue
    | DuplicateCandidateStatusValue;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
        variants[value],
        className
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
