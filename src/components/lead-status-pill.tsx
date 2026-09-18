"use client";

import React from "react";
import {
  type DuplicateCandidateStatusValue,
  type ImportBatchStatusValue,
  type ImportRowStatusValue,
  type ImportSourceTypeValue,
  type LeadPriorityValue,
  type LeadStatusValue,
  type MiniAuditStatusValue,
  type OfferDraftStatusValue,
  type OutreachChannelValue,
  type OutreachDraftStatusValue,
  type PackageFitValue
} from "@/lib/lead-values";
import { type ActivityTypeValue } from "@/lib/activity-values";
import { Badge } from "@/components/clariobase-ui";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";

const variants: Record<string, string> = {
  NEW: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  QUALIFIED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  TO_AUDIT: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  AUDITED: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  CONTACTED: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
  REPLIED: "bg-lime-500/15 text-lime-200 border-lime-500/30",
  DISCOVERY_SCHEDULED: "bg-violet-500/15 text-violet-200 border-violet-500/30",
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
  MANUAL_AI_PREPARED_FILE: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30",
  OPEN: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  NEEDS_REVIEW: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  DISMISSED: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  RESOLVED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  NOTE: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  CALL: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  MESSAGE: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  STATUS_CHANGE: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  AUDIT: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  OTHER: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  DRAFT: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  READY: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  READY_FOR_REVIEW: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  SENT_MANUALLY: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  EMAIL: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  INSTAGRAM_DM: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30",
  FACEBOOK_DM: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  PHONE_CALL: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  ACCEPTED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
};

const lightVariants: Record<string, string> = {
  NEW: "bg-sky-50 text-sky-700 border-sky-200",
  QUALIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  TO_AUDIT: "bg-amber-50 text-amber-700 border-amber-200",
  AUDITED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  CONTACTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  REPLIED: "bg-lime-50 text-lime-700 border-lime-200",
  DISCOVERY_SCHEDULED: "bg-violet-50 text-violet-700 border-violet-200",
  OFFER_SENT: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-rose-50 text-rose-700 border-rose-200",
  NURTURE: "bg-slate-50 text-slate-700 border-slate-200",
  BAD_FIT: "bg-orange-50 text-orange-700 border-orange-200",
  DO_NOT_CONTACT: "bg-red-50 text-red-700 border-red-200",
  ARCHIVED: "bg-zinc-50 text-zinc-700 border-zinc-200",
  LOW: "bg-slate-50 text-slate-700 border-slate-200",
  MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  URGENT: "bg-red-50 text-red-700 border-red-200",
  UNKNOWN: "bg-white text-slate-700 border-slate-200 shadow-sm",
  BASE: "bg-blue-50 text-blue-700 border-blue-200",
  CLARITY: "bg-cyan-50 text-cyan-700 border-cyan-200",
  MOMENTUM: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NOT_FIT: "bg-rose-50 text-rose-700 border-rose-200",
  CREATED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPDATED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  SKIPPED: "bg-slate-50 text-slate-700 border-slate-200",
  RUNNING: "bg-sky-50 text-sky-700 border-sky-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED_WITH_ERRORS: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  LOCAL_JSON: "bg-cyan-50 text-cyan-700 border-cyan-200",
  HARVESTER_EXPORT: "bg-violet-50 text-violet-700 border-violet-200",
  MANUAL_AI_PREPARED_FILE: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  OPEN: "bg-sky-50 text-sky-700 border-sky-200",
  NEEDS_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  DISMISSED: "bg-slate-50 text-slate-700 border-slate-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NOTE: "bg-sky-50 text-sky-700 border-sky-200",
  CALL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MESSAGE: "bg-cyan-50 text-cyan-700 border-cyan-200",
  STATUS_CHANGE: "bg-violet-50 text-violet-700 border-violet-200",
  AUDIT: "bg-amber-50 text-amber-700 border-amber-200",
  OTHER: "bg-slate-50 text-slate-700 border-slate-200",
  DRAFT: "bg-slate-50 text-slate-700 border-slate-200",
  READY: "bg-blue-50 text-blue-700 border-blue-200",
  READY_FOR_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  SENT_MANUALLY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EMAIL: "bg-cyan-50 text-cyan-700 border-cyan-200",
  INSTAGRAM_DM: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  FACEBOOK_DM: "bg-blue-50 text-blue-700 border-blue-200",
  PHONE_CALL: "bg-orange-50 text-orange-700 border-orange-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200"
};

export function StatusPill({
  value,
  className,
  appearance = "default"
}: {
  value:
    | LeadStatusValue
    | LeadPriorityValue
    | PackageFitValue
    | ImportBatchStatusValue
    | ImportRowStatusValue
    | ImportSourceTypeValue
    | DuplicateCandidateStatusValue
    | MiniAuditStatusValue
    | OfferDraftStatusValue
    | OutreachDraftStatusValue
    | OutreachChannelValue
    | ActivityTypeValue;
  className?: string;
  appearance?: "default" | "light" | "foundation";
}) {
  const { t } = useI18n();
  const label = t(getTaxonomyTranslationKey(value));

  if (appearance === "foundation") {
    return (
      <Badge tone="neutral" className={cn("uppercase tracking-wide", className)}>
        {label}
      </Badge>
    );
  }

  const variantClassName =
    appearance === "light" ? lightVariants[value] ?? lightVariants.UNKNOWN : variants[value];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
        variantClassName,
        className
      )}
    >
      {label}
    </span>
  );
}
