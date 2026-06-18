import Link from "next/link";
import { getImportBatches } from "@/lib/imports";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
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

function getImportStatusSummary(status: string) {
  return describeImportStatus(status);
}

export default async function ImportsPage() {
  const batches = await getImportBatches();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-none px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Import audit</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
            Import batches
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review each import source, its processing outcome, and the row-level results without losing the raw
            operational detail.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Import batches and their processing results.</caption>
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th scope="col" className="px-4 py-2.5">Source</th>
                  <th scope="col" className="px-4 py-2.5">Outcome</th>
                  <th scope="col" className="px-4 py-2.5">Rows</th>
                  <th scope="col" className="px-4 py-2.5">Started</th>
                  <th scope="col" className="px-4 py-2.5">Finished</th>
                  <th scope="col" className="px-4 py-2.5">Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {batches.map((batch) => (
                  <tr key={batch.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-950">{batch.sourceName ?? batch.fileName ?? "Import batch"}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        From {describeImportSourceType(batch.sourceType)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-950">{getImportStatusSummary(batch.status)}</div>
                        <div className="text-xs text-slate-500">Technical enum: {batch.status}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                          {batch.totalRows} total
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                          {batch.createdRows} created
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                          {batch.updatedRows} updated
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                          {batch.rejectedRows} rejected
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                          {batch.skippedRows} skipped
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">{formatDate(batch.startedAt)}</td>
                    <td className="px-4 py-3 align-top text-slate-700">{formatDate(batch.finishedAt)}</td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/imports/${batch.id}`}
                        aria-label={`Open import batch details for ${batch.sourceName ?? batch.fileName ?? "this batch"}`}
                        className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Open batch
                      </Link>
                    </td>
                  </tr>
                ))}
                {batches.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                      No import batches yet.
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
