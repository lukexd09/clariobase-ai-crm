import type { TranslationKey } from "@/i18n/types";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";
import { getPresentationDayBounds } from "@/lib/presentation-day";
import { SALES_STATUS_METADATA } from "@/lib/sales-status";
import { getWorkBuckets, type WorkBucketName, type WorkLead } from "@/lib/work-view";

type PipelineStatus = keyof typeof SALES_STATUS_METADATA;

const PIPELINE_STAGES = [
  { stageKey: "dashboard.pipeline.intake", statuses: ["NEW", "QUALIFIED"] },
  { stageKey: "dashboard.pipeline.audit", statuses: ["TO_AUDIT", "AUDITED"] },
  { stageKey: "dashboard.pipeline.conversation", statuses: ["CONTACTED", "REPLIED", "DISCOVERY_SCHEDULED"] },
  { stageKey: "dashboard.pipeline.offer", statuses: ["OFFER_SENT"] },
  { stageKey: "dashboard.pipeline.won", statuses: ["WON"] }
] as const satisfies readonly { stageKey: TranslationKey; statuses: readonly PipelineStatus[] }[];

export type DashboardData = {
  operationalDate: string;
  metrics: readonly { key: WorkBucketName; count: number }[];
  priorities: readonly {
    id: string;
    businessName: string;
    nextActionKey: TranslationKey;
    statusKey: TranslationKey;
    deadlineAt: string | null;
    href: string;
  }[];
  activeDuplicateCount: number;
  pipeline: readonly { stageKey: TranslationKey; value: number }[];
};

export function buildDashboardData(
  leads: WorkLead[],
  activeDuplicateCount: number,
  now = new Date()
): DashboardData {
  const buckets = getWorkBuckets(leads, now);
  const { startOfPresentationDay } = getPresentationDayBounds(now);
  const statusCounts = Object.keys(SALES_STATUS_METADATA).reduce(
    (counts, status) => {
      counts[status as PipelineStatus] = 0;
      return counts;
    },
    {} as Record<PipelineStatus, number>
  );

  for (const lead of leads) statusCounts[lead.leadStatus] += 1;

  return {
    operationalDate: startOfPresentationDay.toISOString(),
    metrics: buckets.map((bucket) => ({ key: bucket.key, count: bucket.leads.length })),
    priorities: buckets
      .flatMap((bucket) => bucket.leads)
      .slice(0, 4)
      .map((lead) => ({
        id: lead.id,
        businessName: lead.businessName,
        nextActionKey: SALES_STATUS_METADATA[lead.leadStatus].nextActionKey,
        statusKey: getTaxonomyTranslationKey(lead.leadStatus),
        deadlineAt: lead.nextActionAt?.toISOString() ?? null,
        href: `/leads/${lead.id}`
      })),
    activeDuplicateCount,
    pipeline: PIPELINE_STAGES.map((stage) => ({
      stageKey: stage.stageKey,
      value: stage.statuses.reduce((total, status) => total + statusCounts[status], 0)
    }))
  };
}
