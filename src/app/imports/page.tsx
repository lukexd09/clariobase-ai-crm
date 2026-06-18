import Link from "next/link";
import { StatusPill } from "@/components/lead-status-pill";
import { getImportBatches } from "@/lib/imports";
import { type ImportBatchStatusValue, type ImportSourceTypeValue } from "@/lib/lead-values";

export const dynamic = "force-dynamic";

const IMPORT_SOURCE_LABELS: Record<ImportSourceTypeValue, string> = {
  LOCAL_JSON: "Local file",
  HARVESTER_EXPORT: "Harvester export",
  MANUAL_AI_PREPARED_FILE: "Prepared AI file"
};

const IMPORT_BATCH_STATUS_LABELS: Record<ImportBatchStatusValue, string> = {
  RUNNING: "In progress",
  COMPLETED: "Completed successfully",
  COMPLETED_WITH_ERRORS: "Completed with issues",
  FAILED: "Failed"
};

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(value)
    : "-";
}

function getBatchLabel(batch: {
  sourceName: string | null;
  fileName: string | null;
}) {
  return batch.sourceName ?? batch.fileName ?? "Import batch";
}

function CountChip({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "cyan" | "rose" | "amber";
}) {
  const toneClassName = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700"
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClassName}`}
    >
      {label}: {value}
    </span>
  );
}

export default async function ImportsPage() {
  const batches = await getImportBatches();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <p className="text-sm font-medium text-sky-700">Data intake</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Import batches
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review each file import, confirm row outcomes, and open the affected leads without leaving
            the CRM workflow.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Import batches and their processing results.</caption>
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-semibold text-slate-500">
                  <th scope="col" className="px-4 py-3">Batch</th>
                  <th scope="col" className="px-4 py-3">Rows</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Started</th>
                  <th scope="col" className="px-4 py-3">Finished</th>
                  <th scope="col" className="px-4 py-3">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {batches.map((batch) => (
                  <tr key={batch.id} className="align-top transition hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950">{getBatchLabel(batch)}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
                          {IMPORT_SOURCE_LABELS[batch.sourceType]}
                        </span>
                        {batch.fileName && batch.fileName !== batch.sourceName ? (
                          <span className="break-all">File: {batch.fileName}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-xl flex-wrap gap-2">
                        <CountChip label="Total" value={batch.totalRows} tone="slate" />
                        <CountChip label="Created" value={batch.createdRows} tone="emerald" />
                        <CountChip label="Updated" value={batch.updatedRows} tone="cyan" />
                        <CountChip label="Rejected" value={batch.rejectedRows} tone="rose" />
                        <CountChip label="Skipped" value={batch.skippedRows} tone="amber" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {IMPORT_BATCH_STATUS_LABELS[batch.status]}
                      </div>
                      <StatusPill value={batch.status} appearance="light" className="mt-2" />
                    </td>
                    <td className="px-4 py-4 text-slate-700">{formatDate(batch.startedAt)}</td>
                    <td className="px-4 py-4 text-slate-700">{formatDate(batch.finishedAt)}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/imports/${batch.id}`}
                        aria-label={`Open results for ${getBatchLabel(batch)}`}
                        className="inline-flex whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Open batch results
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
