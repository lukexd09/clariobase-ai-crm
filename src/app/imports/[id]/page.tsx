import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/lead-status-pill";
import { requireUser } from "@/lib/auth-context";
import { getImportBatchById } from "@/lib/imports";
import {
  type ImportBatchStatusValue,
  type ImportRowStatusValue,
  type ImportSourceTypeValue
} from "@/lib/lead-values";

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

const IMPORT_ROW_STATUS_LABELS: Record<ImportRowStatusValue, string> = {
  CREATED: "Lead created",
  UPDATED: "Lead updated",
  REJECTED: "Needs correction",
  SKIPPED: "Skipped"
};

function formatDate(value: Date | null | undefined) {
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

function getRowOutcomeMessage(status: ImportRowStatusValue) {
  switch (status) {
    case "CREATED":
      return "A new lead was created from this row.";
    case "UPDATED":
      return "An existing lead was updated from this row.";
    case "REJECTED":
      return "This row needs correction before it can create or update a lead.";
    case "SKIPPED":
      return "This row was skipped and did not change a lead record.";
    default:
      return "No lead outcome is available for this row.";
  }
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export default async function ImportBatchDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser({ mode: "redirect", returnTo: "/imports" });
  const { id } = await params;
  const batch = await getImportBatchById(id);

  if (!batch) notFound();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <div className="mb-4">
          <Link
            href="/imports"
            className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            &larr; Back to imports
          </Link>
        </div>

        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <p className="text-sm font-medium text-sky-700">Data intake</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {getBatchLabel(batch)}
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Keep the row results readable, open affected leads directly, and treat technical
            validation output as secondary detail.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
              {IMPORT_SOURCE_LABELS[batch.sourceType]}
            </span>
            <span className="font-medium text-slate-900">{IMPORT_BATCH_STATUS_LABELS[batch.status]}</span>
            <StatusPill value={batch.status} appearance="light" />
            <span aria-hidden="true" className="text-slate-400">|</span>
            <span>Started {formatDate(batch.startedAt)}</span>
            <span aria-hidden="true" className="text-slate-400">|</span>
            <span>Finished {formatDate(batch.finishedAt)}</span>
            {batch.fileName && batch.fileName !== batch.sourceName ? (
              <>
                <span aria-hidden="true" className="text-slate-400">|</span>
                <span className="break-all">File: {batch.fileName}</span>
              </>
            ) : null}
          </div>
        </header>

        <section className="mb-4 grid gap-4 md:grid-cols-5">
          <Metric label="Total rows" value={batch.totalRows} />
          <Metric label="Created" value={batch.createdRows} />
          <Metric label="Updated" value={batch.updatedRows} />
          <Metric label="Rejected" value={batch.rejectedRows} />
          <Metric label="Skipped" value={batch.skippedRows} />
        </section>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Individual row results for the selected import batch.</caption>
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-semibold text-slate-500">
                  <th scope="col" className="px-4 py-3">Row</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Business context</th>
                  <th scope="col" className="px-4 py-3">Source context</th>
                  <th scope="col" className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {batch.rows.map((row) => (
                  <tr key={row.id} className="align-top transition hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{row.rowNumber}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">{IMPORT_ROW_STATUS_LABELS[row.status]}</div>
                      <StatusPill value={row.status} appearance="light" className="mt-2" />
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div className="font-medium text-slate-950">{row.businessName ?? "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Customer ID: {row.customerId ?? "Not provided"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div>{row.source ?? IMPORT_SOURCE_LABELS[batch.sourceType]}</div>
                      <div className="mt-1 break-all text-xs text-slate-500">
                        Source record: {row.sourceRecordId ?? "Not provided"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-2xl">
                        <div className="font-medium text-slate-900">{getRowOutcomeMessage(row.status)}</div>
                        {row.leadId ? (
                          <div className="mt-3">
                            <Link
                              href={`/leads/${row.leadId}`}
                              aria-label={`Open lead for row ${row.rowNumber}${row.businessName ? `, ${row.businessName}` : ""}`}
                              className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              Open lead
                            </Link>
                          </div>
                        ) : (
                          <>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {row.rejectionReason
                                ? "Review the validation details below before retrying this row."
                                : "No lead link is available for this row."}
                            </p>
                            {row.rejectionReason ? (
                              <details className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50">
                                  Technical validation details
                                </summary>
                                <p className="mt-3 break-words whitespace-pre-wrap text-xs leading-6 text-slate-600">
                                  {row.rejectionReason}
                                </p>
                              </details>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {batch.rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
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
