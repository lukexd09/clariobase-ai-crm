import Link from "next/link";
import { getImportBatches } from "@/lib/imports";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(value)
    : "—";
}

export default async function ImportsPage() {
  const batches = await getImportBatches();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Import audit</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Import batches</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            Review completed local imports, row-level results, and the exact outcome of each batch.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900">
              <tr className="text-left text-slate-400">
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Finished</th>
                <th className="px-4 py-3">Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-100">{batch.sourceName ?? batch.fileName ?? "Import"}</div>
                    <div className="text-xs text-slate-400">{batch.sourceType}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{batch.status}</td>
                  <td className="px-4 py-4 text-slate-300">
                    {batch.totalRows} total, {batch.createdRows} created, {batch.updatedRows} updated,{" "}
                    {batch.rejectedRows} rejected, {batch.skippedRows} skipped
                  </td>
                  <td className="px-4 py-4 text-slate-300">{formatDate(batch.startedAt)}</td>
                  <td className="px-4 py-4 text-slate-300">{formatDate(batch.finishedAt)}</td>
                  <td className="px-4 py-4">
                    <Link href={`/imports/${batch.id}`} className="text-cyan-300 hover:text-cyan-200">
                      Open batch
                    </Link>
                  </td>
                </tr>
              ))}
              {batches.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400" colSpan={6}>
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
