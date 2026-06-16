import Link from "next/link";
import { getDuplicateCandidates } from "@/lib/duplicates";
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

function asReasonText(reasons: unknown) {
  if (!Array.isArray(reasons)) return "";
  return reasons
    .map((reason) => {
      if (!reason || typeof reason !== "object") return "";
      const entry = reason as { label?: string; value?: string };
      return [entry.label, entry.value].filter(Boolean).join(": ");
    })
    .filter(Boolean)
    .join(" | ");
}

export default async function DuplicatesPage() {
  const candidates = await getDuplicateCandidates();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <p className="text-sm font-medium text-sky-700">Duplicate review</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Duplicate candidates
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review likely duplicate matches before any future human decision. No automatic merge is performed.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Duplicate candidates awaiting review.</caption>
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-semibold text-slate-500">
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Lead A</th>
                  <th scope="col" className="px-4 py-3">Lead B</th>
                  <th scope="col" className="px-4 py-3">Score</th>
                  <th scope="col" className="px-4 py-3">Reasons</th>
                  <th scope="col" className="px-4 py-3">Updated</th>
                  <th scope="col" className="px-4 py-3">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <StatusPill value={candidate.status} appearance="light" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950">{candidate.leadA.businessName}</div>
                      <div className="text-xs text-slate-500">
                        {candidate.leadA.city ?? "-"} | {candidate.leadA.category ?? "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950">{candidate.leadB.businessName}</div>
                      <div className="text-xs text-slate-500">
                        {candidate.leadB.city ?? "-"} | {candidate.leadB.category ?? "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{candidate.score}</td>
                    <td className="px-4 py-4 text-slate-700">{asReasonText(candidate.reasons) || "-"}</td>
                    <td className="px-4 py-4 text-slate-700">{formatDate(candidate.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/duplicates/${candidate.id}`}
                        className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Open review
                      </Link>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={7}>
                      No duplicate candidates yet.
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
