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

    return [
      { label: "Overdue work", value: String(buckets.overdue), description: "Leads needing attention now." },
      { label: "Due today", value: String(buckets.dueToday), description: "Leads due for follow-up today." },
      {
        label: "Today's priorities",
        value: `${todaysPriorities.length} leads`,
        description:
          todaysPriorities.length > 0 ? "Leads needing a decision or next step today." : "No urgent decisions queued today."
      },
      {
        label: "Pipeline snapshot",
        value: `${pipelineActive.length} active leads`,
        description: "Active pipeline stages across contacted, replied, offer sent, and won."
      },
      {
        label: "Open duplicate reviews",
        value: String(duplicates.filter((candidate) => candidate.status === "OPEN").length),
        description: "Candidate pairs still open."
      }
    ] as const;
  } catch (error) {
    console.error("Homepage snapshot unavailable:", error);
    return fallbackSnapshot;
  }
}
