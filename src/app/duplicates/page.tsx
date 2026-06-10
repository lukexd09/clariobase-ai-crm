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
    .join(" · ");
}

export default async function DuplicatesPage() {
  const candidates = await getDuplicateCandidates();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Duplicate review</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Duplicate candidates</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            Review deterministic duplicate matches before any future human decision. No automatic merge is performed.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900">
              <tr className="text-left text-slate-400">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Lead A</th>
                <th className="px-4 py-3">Lead B</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Reasons</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <StatusPill value={candidate.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-100">{candidate.leadA.businessName}</div>
                    <div className="text-xs text-slate-400">
                      {candidate.leadA.city ?? "-"} · {candidate.leadA.category ?? "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-100">{candidate.leadB.businessName}</div>
                    <div className="text-xs text-slate-400">
                      {candidate.leadB.city ?? "-"} · {candidate.leadB.category ?? "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{candidate.score}</td>
                  <td className="px-4 py-4 text-slate-300">{asReasonText(candidate.reasons) || "-"}</td>
                  <td className="px-4 py-4 text-slate-300">{formatDate(candidate.updatedAt)}</td>
                  <td className="px-4 py-4">
                    <Link href={`/duplicates/${candidate.id}`} className="text-cyan-300 hover:text-cyan-200">
                      Open review
                    </Link>
                  </td>
                </tr>
              ))}
              {candidates.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400" colSpan={7}>
                    No duplicate candidates yet.
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
