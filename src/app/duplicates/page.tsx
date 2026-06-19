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

function describeConfidence(score: number) {
  if (score >= 90) return "Very likely duplicate";
  if (score >= 80) return "Likely duplicate";
  if (score >= 70) return "Review carefully";
  return "Lower confidence";
}

function summarizeSignals(reasons: unknown) {
  if (!Array.isArray(reasons)) return [];
  const labels = new Set<string>();

  for (const reason of reasons) {
    if (!reason || typeof reason !== "object") continue;
    const entry = reason as { signal?: string; label?: string };
    if (entry.signal === "phone") labels.add("Phone differs");
    if (entry.signal === "websiteDomain") labels.add("Website matches");
    if (entry.signal === "sourceRecord") labels.add("Reference differs");
    if (entry.signal === "instagramHandle" || entry.signal === "facebookHandle") labels.add("Social profile differs");
    if (entry.signal === "nameCity") labels.add("Business name and city align");
    if (entry.label?.toLowerCase().includes("email")) labels.add("Email matches");
  }

  return [...labels];
}

export default async function DuplicatesPage() {
  const candidates = await getDuplicateCandidates();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-none px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Duplicate review</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Possible duplicates</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Compare likely matches in plain language before any human decision. No automatic merge is performed.
          </p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Duplicate candidates awaiting review.</caption>
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Existing record</th>
                <th scope="col" className="px-4 py-3">Imported record</th>
                <th scope="col" className="px-4 py-3">Match strength</th>
                <th scope="col" className="px-4 py-3">What matches</th>
                <th scope="col" className="px-4 py-3">Updated</th>
                <th scope="col" className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4 align-top">
                    <StatusPill value={candidate.status} appearance="light" />
                    <div className="mt-1 text-xs text-slate-500">{candidate.status}</div>
                  </td>
                    <td className="px-4 py-4 align-top">
                    <div className="font-medium text-slate-950">{candidate.leadA.businessName}</div>
                    <div className="text-xs text-slate-500">{candidate.leadA.city ?? "Not set"}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-slate-950">{candidate.leadB.businessName}</div>
                    <div className="text-xs text-slate-500">{candidate.leadB.city ?? "Not set"}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-1">
                      <div className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-700">
                        {describeConfidence(candidate.score)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {Array.isArray(candidate.reasons) ? candidate.reasons.length : 0} matching details
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <ul className="space-y-2">
                      {Array.isArray(candidate.reasons) && candidate.reasons.length > 0 ? (
                        candidate.reasons.map((reason, index) => {
                          if (!reason || typeof reason !== "object") return null;
                          const entry = reason as { label?: string; value?: string; score?: number; signal?: string };

                          return (
                            <li
                              key={`${entry.signal ?? "reason"}-${index}`}
                              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-950">{entry.label ?? "Matching detail"}</p>
                                  <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                                    {entry.value ?? "No business detail recorded"}
                                  </p>
                                </div>
                              </div>
                            </li>
                          );
                        })
                      ) : (
                        <li className="text-slate-500">No signals recorded.</li>
                      )}
                    </ul>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      {summarizeSignals(candidate.reasons).join(" · ") || "No difference summary available"}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">{formatDate(candidate.updatedAt)}</td>
                  <td className="px-4 py-4 align-top">
                    <Link
                      href={`/duplicates/${candidate.id}`}
                      aria-label={`Compare ${candidate.leadA.businessName} and ${candidate.leadB.businessName}`}
                      className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      Compare
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
    </main>
  );
}
