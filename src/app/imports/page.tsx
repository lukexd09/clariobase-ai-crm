import Link from "next/link";
import { getImportBatches } from "@/lib/imports";
import { StatusPill } from "@/components/lead-status-pill";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(value)
    : "-";
}

export default async function ImportsPage() {
  const batches = await getImportBatches();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Import audit</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Import batches
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review completed local imports, row-level results, and the exact outcome of each batch.
          </p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Import batches and their processing results.</caption>
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th scope="col" className="px-4 py-3">Source</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Rows</th>
                <th scope="col" className="px-4 py-3">Started</th>
                <th scope="col" className="px-4 py-3">Finished</th>
                <th scope="col" className="px-4 py-3">Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {batches.map((batch) => (
                <tr key={batch.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-950">{batch.sourceName ?? batch.fileName ?? "Import"}</div>
                    <div className="text-xs text-slate-500">{batch.sourceType}</div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill value={batch.status} appearance="light" />
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {batch.totalRows} total, {batch.createdRows} created, {batch.updatedRows} updated,{" "}
                    {batch.rejectedRows} rejected, {batch.skippedRows} skipped
                  </td>
                  <td className="px-4 py-4 text-slate-700">{formatDate(batch.startedAt)}</td>
                  <td className="px-4 py-4 text-slate-700">{formatDate(batch.finishedAt)}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/imports/${batch.id}`}
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
    </main>
  );
}
