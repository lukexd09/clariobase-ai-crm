import { ButtonLink, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { ConfidenceBadge, DataQualityPageHeader, DataQualityStatusBadge } from "@/components/data-quality-primitives";
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
      tone: "success" as const
    };
  }

  if (score >= 85) {
    return {
      label: "High confidence",
      detail: "The records look closely related and need a quick human review.",
      tone: "information" as const
    };
  }

  return {
    label: "Needs closer review",
    detail: "There is a meaningful overlap, but the pair still needs a careful check.",
    tone: "warning" as const
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
  const candidates = await getDuplicateCandidates();

  return (
    <div className="space-y-4">
      <DataQualityPageHeader
        eyebrow="Duplicate review"
        title="Duplicate candidates"
        description="Compare likely matches quickly, keep the current review states, and confirm whether both records should stay separate. No automatic merge is performed."
      />

      <TableSurface aria-label="Scrollable duplicate candidates table">
        <Table className="min-w-[1100px]">
          <caption className="sr-only">Duplicate candidates awaiting review.</caption>
          <TableHead>
            <tr>
              <TableHeadCell scope="col">Candidate</TableHeadCell>
              <TableHeadCell scope="col">Confidence</TableHeadCell>
              <TableHeadCell scope="col">Signals</TableHeadCell>
              <TableHeadCell scope="col">Status</TableHeadCell>
              <TableHeadCell scope="col">Updated</TableHeadCell>
              <TableHeadCell scope="col">Review</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {candidates.map((candidate) => {
              const confidence = getConfidenceMeta(candidate.score);
              const previewReasons = getReasonPreview(candidate.reasons);

              return (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium text-[color:var(--cb-foreground)]">{candidate.leadA.businessName}</div>
                        <div className="text-xs text-[color:var(--cb-muted-foreground)]">
                          {candidate.leadA.city ?? "No city"} | {candidate.leadA.category ?? "No category"}
                        </div>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--cb-muted-foreground)]">
                        versus
                      </div>
                      <div>
                        <div className="font-medium text-[color:var(--cb-foreground)]">{candidate.leadB.businessName}</div>
                        <div className="text-xs text-[color:var(--cb-muted-foreground)]">
                          {candidate.leadB.city ?? "No city"} | {candidate.leadB.category ?? "No category"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ConfidenceBadge label={confidence.label} score={candidate.score} tone={confidence.tone} detail={confidence.detail} />
                  </TableCell>
                  <TableCell className="text-[color:var(--cb-muted-foreground)]">
                    {previewReasons.length > 0 ? (
                      <ul className="space-y-2">
                        {previewReasons.map((reason) => (
                          <li key={reason} className="text-sm leading-6 text-[color:var(--cb-foreground)]">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <DataQualityStatusBadge
                      label={DUPLICATE_STATUS_LABELS[candidate.status]}
                      tone={candidate.status === "OPEN" ? "information" : candidate.status === "NEEDS_REVIEW" ? "warning" : candidate.status === "DISMISSED" ? "neutral" : "success"}
                    />
                  </TableCell>
                  <TableCell className="text-[color:var(--cb-muted-foreground)]">{formatDate(candidate.updatedAt)}</TableCell>
                  <TableCell>
                    <ButtonLink
                      href={`/duplicates/${candidate.id}`}
                      aria-label={`Open duplicate review for ${candidate.leadA.businessName} and ${candidate.leadB.businessName}`}
                      className="whitespace-nowrap"
                    >
                      Open review
                    </ButtonLink>
                  </TableCell>
                </TableRow>
              );
            })}
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-left sm:text-center text-[color:var(--cb-muted-foreground)]">
                  No duplicate candidates yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
