import { getLeads } from "@/lib/leads";
import { getWorkbenchBucketCounts } from "@/lib/work-view";
import { getImportBatches } from "@/lib/imports";
import { getDuplicateCandidates } from "@/lib/duplicates";

type HomepageSnapshotItem = Readonly<{
  label: string;
  value: string;
  description: string;
}>;

const fallbackSnapshot = [
  {
    label: "Operational snapshot unavailable",
    value: "CRM data temporarily unavailable",
    description: "CRM data is temporarily unavailable. Open leads, workbench, or health for the live workspace."
  }
] as const satisfies readonly HomepageSnapshotItem[];

function formatLeadCount(count: number) {
  return `${count} lead${count === 1 ? "" : "s"}`;
}

export async function getHomepageSnapshot() {
  return getHomepageSnapshotWithSources({
    getLeads,
    getImportBatches,
    getDuplicateCandidates
  });
}

export async function getHomepageSnapshotWithSources({
  getLeads: readLeads,
  getImportBatches: readImportBatches,
  getDuplicateCandidates: readDuplicateCandidates
}: {
  getLeads: typeof getLeads;
  getImportBatches: typeof getImportBatches;
  getDuplicateCandidates: typeof getDuplicateCandidates;
}) {
  try {
    const [leads, , duplicates] = await Promise.all([
      readLeads(),
      readImportBatches(),
      readDuplicateCandidates()
    ]);
    const buckets = getWorkbenchBucketCounts(leads);
    const todayKey = new Date().toISOString().slice(0, 10);
    const todaysPriorities = leads.filter(
      (lead) => lead.leadStatus === "TO_AUDIT" || lead.nextActionAt?.toISOString().slice(0, 10) === todayKey
    );
    const pipelineActive = leads.filter((lead) =>
      ["CONTACTED", "REPLIED", "OFFER_SENT", "WON"].includes(lead.leadStatus)
    );
    const stageCounts = {
      intake: leads.filter((lead) => ["NEW", "QUALIFIED"].includes(lead.leadStatus)).length,
      audit: leads.filter((lead) => ["TO_AUDIT", "AUDITED"].includes(lead.leadStatus)).length,
      outreach: leads.filter((lead) => lead.leadStatus === "CONTACTED").length,
      conversation: leads.filter((lead) => ["REPLIED", "DISCOVERY_SCHEDULED"].includes(lead.leadStatus)).length,
      offer: leads.filter((lead) => lead.leadStatus === "OFFER_SENT").length,
      closed: leads.filter((lead) => ["WON", "LOST", "ARCHIVED"].includes(lead.leadStatus)).length
    };
    const pipelineStages = [
      `Intake ${formatLeadCount(stageCounts.intake)}`,
      `Audit ${formatLeadCount(stageCounts.audit)}`,
      `Outreach ${formatLeadCount(stageCounts.outreach)}`,
      `Conversation ${formatLeadCount(stageCounts.conversation)}`,
      `Offer ${formatLeadCount(stageCounts.offer)}`,
      `Closed ${formatLeadCount(stageCounts.closed)}`
    ];

    return [
      { label: "Overdue work", value: String(buckets.overdue), description: "Leads needing attention now." },
      { label: "Due today", value: String(buckets.dueToday), description: "Leads due for follow-up today." },
      {
        label: "Today's priorities",
        value:
          todaysPriorities.length > 0
            ? todaysPriorities
                .slice(0, 3)
                .map((lead) => lead.businessName)
                .join(" · ")
            : "No urgent priorities",
        description:
          todaysPriorities.length > 0
            ? `Focus on ${todaysPriorities.length} ${todaysPriorities.length === 1 ? "lead" : "leads"} needing a decision or next step today.`
            : "No urgent decisions queued today."
      },
      {
        label: "Pipeline snapshot",
        value: pipelineStages.join(" | "),
        description: pipelineActive.length > 0 ? "Stage breakdown across the active pipeline." : "No active pipeline work yet."
      },
      {
        label: "Open duplicate reviews",
        value: String(duplicates.filter((candidate) => candidate.status === "OPEN").length),
        description: "Open candidate pairs remain secondary to sales work."
      }
    ] as const;
  } catch (error) {
    console.error("Homepage snapshot unavailable:", error);
    return fallbackSnapshot;
  }
}
