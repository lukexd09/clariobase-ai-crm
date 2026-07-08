import Link from "next/link";
import { requireUser } from "@/lib/auth-context";
import { StatusPill } from "@/components/lead-status-pill";
import { getDuplicateCandidates, type DuplicateReason } from "@/lib/duplicates";
import { type DuplicateCandidateStatusValue } from "@/lib/lead-values";

export const dynamic = "force-dynamic";

const DUPLICATE_STATUS_LABELS: Record<DuplicateCandidateStatusValue, string> = {
  OPEN: "Open review",
  NEEDS_REVIEW: "Needs closer review",
  DISMISSED: "Keep records separate",
  RESOLVED: "Review complete"
};

function formatDate(value: Date | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(value)
    : "-";
}

function getConfidenceMeta(score: number) {
  if (score >= 95) {
    return {
      label: "Very high confidence",
      detail: "Several fields point to the same business record.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700"
    };
  }

  if (score >= 85) {
    return {
      label: "High confidence",
      detail: "The records look closely related and need a quick human review.",
      className: "border-sky-200 bg-sky-50 text-sky-700"
    };
  }

  return {
    label: "Needs closer review",
    detail: "There is a meaningful overlap, but the pair still needs a careful check.",
    className: "border-amber-200 bg-amber-50 text-amber-700"
  };
}

function getReasonPreview(reasons: unknown) {
  if (!Array.isArray(reasons)) {
    return [];
  }

  return reasons
    .filter((reason): reason is DuplicateReason => Boolean(reason && typeof reason === "object"))
    .map((reason) => {
      const summary = [reason.label, reason.value].filter(Boolean).join(": ");
      return summary || reason.label || "Duplicate signal";
    })
    .filter(Boolean)
    .slice(0, 2);
}

export default async function DuplicatesPage() {
  await requireUser({ mode: "redirect", returnTo: "/duplicates" });
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
            Compare likely matches quickly, keep the current review states, and confirm whether both
            records should stay separate. No automatic merge is performed.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Duplicate candidates awaiting review.</caption>
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-semibold text-slate-500">
                  <th scope="col" className="px-4 py-3">Candidate</th>
                  <th scope="col" className="px-4 py-3">Confidence</th>
                  <th scope="col" className="px-4 py-3">Signals</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Updated</th>
                  <th scope="col" className="px-4 py-3">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {candidates.map((candidate) => {
                  const confidence = getConfidenceMeta(candidate.score);
                  const previewReasons = getReasonPreview(candidate.reasons);

                  return (
                    <tr key={candidate.id} className="align-top transition hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="space-y-3">
                          <div>
                            <div className="font-medium text-slate-950">{candidate.leadA.businessName}</div>
                            <div className="text-xs text-slate-500">
                              {candidate.leadA.city ?? "No city"} | {candidate.leadA.category ?? "No category"}
                            </div>
                          </div>
                          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            versus
                          </div>
                          <div>
                            <div className="font-medium text-slate-950">{candidate.leadB.businessName}</div>
                            <div className="text-xs text-slate-500">
                              {candidate.leadB.city ?? "No city"} | {candidate.leadB.category ?? "No category"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${confidence.className}`}
                        >
                          {confidence.label}
                        </div>
                        <div className="mt-2 text-sm font-medium text-slate-900">Score {candidate.score}</div>
                        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{confidence.detail}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {previewReasons.length > 0 ? (
                          <ul className="space-y-2">
                            {previewReasons.map((reason) => (
                              <li key={reason} className="text-sm leading-6 text-slate-700">
                                {reason}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {DUPLICATE_STATUS_LABELS[candidate.status]}
                        </div>
                        <StatusPill value={candidate.status} appearance="light" className="mt-2" />
                      </td>
                      <td className="px-4 py-4 text-slate-700">{formatDate(candidate.updatedAt)}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/duplicates/${candidate.id}`}
                          aria-label={`Open duplicate review for ${candidate.leadA.businessName} and ${candidate.leadB.businessName}`}
                          className="inline-flex whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Open review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {candidates.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
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
