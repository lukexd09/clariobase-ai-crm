import type { LeadPriority, LeadStatus, PackageFit } from "@/generated/prisma/client";
import type { TranslationKey } from "@/i18n/types";

export type WorkLead = {
  id: string;
  businessName: string;
  city: string | null;
  category: string | null;
  leadStatus: LeadStatus;
  priority: LeadPriority;
  packageFit: PackageFit;
  scoreTotal: number;
  scoreLabel: string | null;
  nextActionAt: Date | null;
  updatedAt: Date;
  lastImportedAt: Date | null;
};

export type WorkBucketName =
  | "overdue"
  | "dueToday"
  | "upcoming"
  | "noAction";

export type WorkBucket = {
  key: WorkBucketName;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  leads: WorkLead[];
};

const EXCLUDED_ACTIONABLE_STATUSES: LeadStatus[] = [
  "WON",
  "LOST",
  "ARCHIVED",
  "DO_NOT_CONTACT"
];

const PRIORITY_WEIGHT: Record<LeadPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

export function isActionableLead(lead: Pick<WorkLead, "leadStatus">) {
  return !EXCLUDED_ACTIONABLE_STATUSES.includes(lead.leadStatus);
}

export function getWorkBuckets(leads: WorkLead[], now = new Date()): WorkBucket[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const actionableLeads = leads.filter(isActionableLead);
  const overdue = actionableLeads.filter(
    (lead) => lead.nextActionAt && lead.nextActionAt < startOfToday
  );
  const dueToday = actionableLeads.filter(
    (lead) => lead.nextActionAt && lead.nextActionAt >= startOfToday && lead.nextActionAt < startOfTomorrow
  );
  const upcoming = actionableLeads.filter(
    (lead) => lead.nextActionAt && lead.nextActionAt >= startOfTomorrow
  );
  const noAction = actionableLeads.filter((lead) => !lead.nextActionAt);

  return [
    {
      key: "overdue",
      titleKey: "work.bucket.overdue.title",
      descriptionKey: "work.bucket.overdue.description",
      leads: sortByDate(overdue, "nextActionAt")
    },
    {
      key: "dueToday",
      titleKey: "work.bucket.dueToday.title",
      descriptionKey: "work.bucket.dueToday.description",
      leads: sortByDate(dueToday, "nextActionAt")
    },
    {
      key: "upcoming",
      titleKey: "work.bucket.upcoming.title",
      descriptionKey: "work.bucket.upcoming.description",
      leads: sortByDate(upcoming, "nextActionAt").slice(0, 20)
    },
    {
      key: "noAction",
      titleKey: "work.bucket.noAction.title",
      descriptionKey: "work.bucket.noAction.description",
      leads: sortByPriority(noAction).slice(0, 20)
    }
  ];
}

export function getWorkbenchBucketCounts(leads: WorkLead[], now = new Date()) {
  return getWorkBuckets(leads, now).reduce(
    (counts, bucket) => {
      counts[bucket.key] = bucket.leads.length;
      return counts;
    },
    {
      overdue: 0,
      dueToday: 0,
      upcoming: 0,
      noAction: 0
    } as Record<WorkBucketName, number>
  );
}

function sortByDate(leads: WorkLead[], field: "nextActionAt") {
  return [...leads].sort((left, right) => {
    const leftValue = left[field]?.getTime() ?? Number.POSITIVE_INFINITY;
    const rightValue = right[field]?.getTime() ?? Number.POSITIVE_INFINITY;

    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }

    return tieBreak(left, right);
  });
}

function sortByPriority(leads: WorkLead[]) {
  return [...leads].sort((left, right) => {
    const leftWeight = PRIORITY_WEIGHT[left.priority];
    const rightWeight = PRIORITY_WEIGHT[right.priority];

    if (leftWeight !== rightWeight) {
      return rightWeight - leftWeight;
    }

    const updatedComparison = right.updatedAt.getTime() - left.updatedAt.getTime();
    if (updatedComparison !== 0) {
      return updatedComparison;
    }

    const importedComparison =
      (right.lastImportedAt?.getTime() ?? 0) - (left.lastImportedAt?.getTime() ?? 0);
    if (importedComparison !== 0) {
      return importedComparison;
    }

    return tieBreak(left, right);
  });
}

function tieBreak(left: WorkLead, right: WorkLead) {
  return left.businessName.localeCompare(right.businessName);
}
