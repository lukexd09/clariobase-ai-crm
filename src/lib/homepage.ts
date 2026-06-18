import { getLeads } from "@/lib/leads";
import { getWorkbenchBucketCounts } from "@/lib/work-view";
import { getImportBatches } from "@/lib/imports";
import { getDuplicateCandidates } from "@/lib/duplicates";

export async function getHomepageSnapshot() {
  const [leads, imports, duplicates] = await Promise.all([
    getLeads(),
    getImportBatches(),
    getDuplicateCandidates()
  ]);
  const buckets = getWorkbenchBucketCounts(leads);
  const latestImport = imports[0];

  return [
    { label: "Overdue work", value: String(buckets.overdue), description: "Leads needing attention now." },
    { label: "Due today", value: String(buckets.dueToday), description: "Leads due for follow-up today." },
    { label: "Waiting for audit", value: String(leads.filter((lead) => lead.leadStatus === "TO_AUDIT").length), description: "Leads awaiting review." },
    { label: "Open duplicate reviews", value: String(duplicates.filter((candidate) => candidate.status === "OPEN").length), description: "Candidate pairs still open." },
    { label: "Latest import", value: latestImport ? latestImport.status : "None", description: latestImport ? latestImport.sourceName ?? latestImport.fileName ?? "Batch available" : "No imports yet." }
  ] as const;
}
