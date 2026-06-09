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
    : "—";
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <Link href="/imports" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← Back to imports
          </Link>
        </div>

        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Import batch</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{batch.sourceName ?? batch.fileName ?? "Import batch"}</h1>
          <p className="mt-2 text-sm text-slate-300">
            {batch.sourceType} · {batch.status} · {formatDate(batch.startedAt)} → {formatDate(batch.finishedAt)}
          </p>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-5">
          <Metric label="Total rows" value={batch.totalRows} />
          <Metric label="Created" value={batch.createdRows} />
          <Metric label="Updated" value={batch.updatedRows} />
          <Metric label="Rejected" value={batch.rejectedRows} />
          <Metric label="Skipped" value={batch.skippedRows} />
        </section>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900">
              <tr className="text-left text-slate-400">
                <th className="px-4 py-3">Row</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {batch.rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-4 text-slate-300">{row.rowNumber}</td>
                  <td className="px-4 py-4">
                    <StatusPill value={row.status} />
                  </td>
                  <td className="px-4 py-4 text-slate-100">{row.businessName ?? "—"}</td>
                  <td className="px-4 py-4 text-slate-300">{row.customerId ?? "—"}</td>
                  <td className="px-4 py-4 text-slate-300">
                    <div>{row.source ?? "—"}</div>
                    <div className="text-xs text-slate-500">{row.sourceRecordId ?? "—"}</div>
                  </td>
                  <td className="px-4 py-4">
                    {row.leadId ? (
                      <Link href={`/leads/${row.leadId}`} className="text-cyan-300 hover:text-cyan-200">
                        Open lead
                      </Link>
                    ) : (
                      <div className="space-y-1 text-slate-300">
                        <div>{row.rejectionReason ?? "No lead link"}</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {batch.rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400" colSpan={6}>
                    No row results available for this batch.
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}
