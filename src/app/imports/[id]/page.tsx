import Link from "next/link";
import { notFound } from "next/navigation";
import { getImportBatchById } from "@/lib/imports";
import { StatusPill } from "@/components/lead-status-pill";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(value)
    : "-";
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function describeImportSourceType(sourceType: string) {
  switch (sourceType) {
    case "LOCAL_JSON":
      return "Local file";
    case "HARVESTER_EXPORT":
      return "Harvester export file";
    case "MANUAL_AI_PREPARED_FILE":
      return "AI-prepared file";
    default:
      return titleCase(sourceType);
  }
}

function describeImportStatus(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Finished cleanly";
    case "COMPLETED_WITH_ERRORS":
      return "Finished with row issues";
    case "FAILED":
      return "Stopped";
    case "RUNNING":
      return "Processing";
    case "UNKNOWN":
      return "Status not known";
    default:
      return titleCase(status);
  }
}

export default async function ImportBatchDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const batch = await getImportBatchById(id);

  if (!batch) notFound();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/imports"
            className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            &larr; Back to import batches
          </Link>
        </div>

        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Import results</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {batch.sourceName ?? batch.fileName ?? "Import batch"}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>{describeImportSourceType(batch.sourceType)}</span>
            <span aria-hidden="true">|</span>
            <span>{describeImportStatus(batch.status)}</span>
            <span aria-hidden="true">|</span>
            <span>{formatDate(batch.startedAt)}</span>
            <span aria-hidden="true">|</span>
            <StatusPill value={batch.status} appearance="light" />
            <span aria-hidden="true">|</span>
            <span>{formatDate(batch.finishedAt)}</span>
          </p>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-5">
          <Metric label="Total rows" value={batch.totalRows} />
          <Metric label="Created" value={batch.createdRows} />
          <Metric label="Updated" value={batch.updatedRows} />
          <Metric label="Rejected" value={batch.rejectedRows} />
          <Metric label="Skipped" value={batch.skippedRows} />
        </section>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
          <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Individual row results for the selected import batch.</caption>
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th scope="col" className="px-4 py-3">Row</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Business</th>
                <th scope="col" className="px-4 py-3">What happened</th>
                <th scope="col" className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {batch.rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-700">{row.rowNumber}</td>
                  <td className="px-4 py-4">
                    <StatusPill value={row.status} appearance="light" />
                  </td>
                  <td className="px-4 py-4 text-slate-950">{row.businessName ?? "-"}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <div className="max-w-2xl whitespace-pre-wrap break-words leading-6 text-slate-800">
                      {describeRowOutcome(row)}
                    </div>
                    {row.rejectionReason ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer list-none text-xs font-medium text-slate-500 outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                          Technical validation details
                        </summary>
                        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                          <p className="break-words">Customer ID: {row.customerId ?? "-"}</p>
                          <p className="break-words">Source: {row.source ?? "-"}</p>
                          <p className="break-words">Source record ID: {row.sourceRecordId ?? "-"}</p>
                          <p className="mt-2 whitespace-pre-wrap break-words">{row.rejectionReason}</p>
                        </div>
                      </details>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    {row.leadId ? (
                      <Link
                        href={`/leads/${row.leadId}`}
                        aria-label={`Open lead detail for row ${row.rowNumber}: ${row.lead?.businessName ?? row.businessName ?? "lead"}`}
                        className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Open lead
                      </Link>
                    ) : (
                      <span className="text-slate-500">No lead link</span>
                    )}
                  </td>
                </tr>
              ))}
              {batch.rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                    No row results available for this batch.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function describeRowOutcome(row: {
  leadId: string | null;
  rejectionReason: string | null;
  businessName: string | null;
}) {
  if (row.leadId) return "Imported successfully and linked to a lead.";
  if (row.rejectionReason) {
    if (/too small/i.test(row.rejectionReason)) return "Business name is missing.";
    if (/invalid/i.test(row.rejectionReason)) return "Import row needs review before it can be used.";
    return "Import row could not be used and needs review.";
  }
  return row.businessName ? "Row imported without a linked lead." : "Row imported without business details.";
}
