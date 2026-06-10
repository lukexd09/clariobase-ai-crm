import { type ActivityTypeValue } from "@/lib/activity-values";
import { ACTIVITY_TYPE_VALUES } from "@/lib/activity-values";
import { prisma } from "@/lib/prisma";
import { getLeads } from "@/lib/leads";
import {
  LEAD_PRIORITY_VALUES,
  LEAD_STATUS_VALUES,
  MINI_AUDIT_STATUS_VALUES,
  OUTREACH_DRAFT_STATUS_VALUES,
  PACKAGE_FIT_VALUES,
  type LeadPriorityValue,
  type LeadStatusValue,
  type MiniAuditStatusValue,
  type OutreachDraftStatusValue,
  type PackageFitValue
} from "@/lib/lead-values";
import {
  getWorkbenchBucketCounts,
  toCountMap,
  type WorkBucketName
} from "@/lib/sales-report-utils";

export type SalesReport = {
  totalLeads: number;
  activeLeads: number;
  archivedLeads: number;
  leadStatusCounts: Record<LeadStatusValue, number>;
  priorityCounts: Record<LeadPriorityValue, number>;
  packageFitCounts: Record<PackageFitValue, number>;
  workbenchBucketCounts: Record<WorkBucketName, number>;
  miniAuditDraftStatusCounts: Record<MiniAuditStatusValue, number>;
  outreachDraftStatusCounts: Record<OutreachDraftStatusValue, number>;
  leadsWithMiniAuditDrafts: number;
  leadsWithOutreachDrafts: number;
  activityTotalCount: number;
  activityLast7DaysCount: number;
  activityTypeCounts: Record<ActivityTypeValue, number>;
};

export async function getLeadStatusCounts() {
  const rows = await prisma.lead.groupBy({
    by: ["leadStatus"],
    _count: { _all: true }
  });

  return toCountMap(
    LEAD_STATUS_VALUES,
    rows.map((row) => ({ key: row.leadStatus, count: row._count._all }))
  );
}

export async function getPriorityCounts() {
  const rows = await prisma.lead.groupBy({
    by: ["priority"],
    _count: { _all: true }
  });

  return toCountMap(
    LEAD_PRIORITY_VALUES,
    rows.map((row) => ({ key: row.priority, count: row._count._all }))
  );
}

export async function getPackageFitCounts() {
  const rows = await prisma.lead.groupBy({
    by: ["packageFit"],
    _count: { _all: true }
  });

  return toCountMap(
    PACKAGE_FIT_VALUES,
    rows.map((row) => ({ key: row.packageFit, count: row._count._all }))
  );
}

export async function getMiniAuditDraftStatusCounts() {
  const rows = await prisma.miniAuditDraft.groupBy({
    by: ["status"],
    _count: { _all: true }
  });

  return toCountMap(
    MINI_AUDIT_STATUS_VALUES,
    rows.map((row) => ({ key: row.status, count: row._count._all }))
  );
}

export async function getOutreachDraftStatusCounts() {
  const rows = await prisma.outreachDraft.groupBy({
    by: ["status"],
    _count: { _all: true }
  });

  return toCountMap(
    OUTREACH_DRAFT_STATUS_VALUES,
    rows.map((row) => ({ key: row.status, count: row._count._all }))
  );
}

export async function getActivityTypeCounts() {
  const rows = await prisma.activity.groupBy({
    by: ["type"],
    _count: { _all: true }
  });

  return toCountMap(
    ACTIVITY_TYPE_VALUES,
    rows.map((row) => ({ key: row.type, count: row._count._all }))
  );
}

export async function getSalesReport(now = new Date()): Promise<SalesReport> {
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    leads,
    leadStatusCounts,
    priorityCounts,
    packageFitCounts,
    miniAuditDraftStatusCounts,
    outreachDraftStatusCounts,
    miniAuditLeadGroups,
    outreachLeadGroups,
    activityTypeCounts,
    activityTotalCount,
    activityLast7DaysCount
  ] = await Promise.all([
    getLeads(),
    getLeadStatusCounts(),
    getPriorityCounts(),
    getPackageFitCounts(),
    getMiniAuditDraftStatusCounts(),
    getOutreachDraftStatusCounts(),
    prisma.miniAuditDraft.groupBy({
      by: ["leadId"],
      _count: { _all: true }
    }),
    prisma.outreachDraft.groupBy({
      by: ["leadId"],
      _count: { _all: true }
    }),
    getActivityTypeCounts(),
    prisma.activity.count(),
    prisma.activity.count({
      where: {
        occurredAt: {
          gte: sevenDaysAgo
        }
      }
    })
  ]);

  const archivedLeads = leadStatusCounts.ARCHIVED;
  const totalLeads = leads.length;

  return {
    totalLeads,
    activeLeads: totalLeads - archivedLeads,
    archivedLeads,
    leadStatusCounts,
    priorityCounts,
    packageFitCounts,
    workbenchBucketCounts: getWorkbenchBucketCounts(leads, now),
    miniAuditDraftStatusCounts,
    outreachDraftStatusCounts,
    leadsWithMiniAuditDrafts: miniAuditLeadGroups.length,
    leadsWithOutreachDrafts: outreachLeadGroups.length,
    activityTotalCount,
    activityLast7DaysCount,
    activityTypeCounts
  };
}
