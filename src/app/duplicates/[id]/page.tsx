import { type ReactNode } from "react";
import { notFound } from "next/navigation";
import { DuplicateCandidateStatus } from "@/generated/prisma/client";
import { updateDuplicateCandidateAction } from "@/app/duplicates/actions";
import { Button, ButtonLink, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { ConfidenceBadge, DataQualityPageHeader, DataQualityStatusBadge, TechnicalDisclosure } from "@/components/data-quality-primitives";
import { StatusPill } from "@/components/lead-status-pill";
import { getDuplicateCandidateById } from "@/lib/duplicates";
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

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
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
      detail: "The records look closely related and usually need only a short verification.",
      tone: "information" as const
    };
  }

  return {
    label: "Needs closer review",
    detail: "There is useful overlap, but a human should confirm the fields carefully.",
    tone: "warning" as const
  };
}

function getComparisonState(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeValue(left);
  const normalizedRight = normalizeValue(right);

  if (!normalizedLeft && !normalizedRight) {
    return "missing";
  }

  if (normalizedLeft && normalizedRight && normalizedLeft === normalizedRight) {
    return "match";
  }

  return "difference";
}

function getComparisonNote(state: "match" | "difference" | "missing") {
  if (state === "match") return "Matching field";
  if (state === "difference") return "Different field";
  return "Missing on both records";
}

function renderReasons(reasons: unknown) {
  if (!Array.isArray(reasons) || reasons.length === 0) return "-";

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {reasons.map((reason, index) => {
        if (!reason || typeof reason !== "object") return null;
        const entry = reason as { label?: string; value?: string; score?: number; signal?: string };

        return (
          <li
            key={`${entry.signal ?? "reason"}-${index}`}
            className="rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-3"
          >
            <div className="text-sm font-medium text-[color:var(--cb-foreground)]">{entry.label ?? "Duplicate signal"}</div>
            <div className="mt-1 break-words text-sm text-[color:var(--cb-muted-foreground)]">{entry.value ?? "-"}</div>
            <div className="mt-2 text-xs text-[color:var(--cb-muted-foreground)]">Signal strength: {entry.score ?? "-"}</div>
          </li>
        );
      })}
    </ul>
  );
}

function ComparisonLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-[color:var(--cb-muted-foreground)]">
      <span className="rounded-full border border-[color:var(--cb-success)]/25 bg-[color:var(--cb-success)]/10 px-2.5 py-1 text-[color:var(--cb-success-ink)]">
        Matching field
      </span>
      <span className="rounded-full border border-[color:var(--cb-warning)]/25 bg-[color:var(--cb-warning)]/10 px-2.5 py-1 text-[color:var(--cb-warning-ink)]">
        Different field
      </span>
      <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-2.5 py-1 text-[color:var(--cb-foreground)]">
        Missing on both records
      </span>
    </div>
  );
}

function ComparisonCell({
  state,
  children
}: {
  state: "match" | "difference" | "missing";
  children: ReactNode;
}) {
  const className = {
    match: "border-[color:var(--cb-success)]/25 bg-[color:var(--cb-success)]/10 text-[color:var(--cb-success-ink)]",
    difference: "border-[color:var(--cb-warning)]/25 bg-[color:var(--cb-warning)]/10 text-[color:var(--cb-warning-ink)]",
    missing: "border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] text-[color:var(--cb-muted-foreground)]"
  }[state];

  return (
    <td className="px-4 py-4 align-top">
      <div className={`rounded-2xl border p-3 ${className}`}>{children}</div>
    </td>
  );
}

function ComparisonRow({
  label,
  leftValue,
  rightValue,
  leftDisplay,
  rightDisplay
}: {
  label: string;
  leftValue: string | null | undefined;
  rightValue: string | null | undefined;
  leftDisplay: ReactNode;
  rightDisplay: ReactNode;
}) {
  const state = getComparisonState(leftValue, rightValue);

  return (
    <tr className="align-top">
      <th scope="row" className="px-4 py-4 text-left">
        <div className="text-sm font-medium text-[color:var(--cb-foreground)]">{label}</div>
        <div className="mt-1 text-xs text-[color:var(--cb-muted-foreground)]">{getComparisonNote(state)}</div>
      </th>
      <ComparisonCell state={state}>{leftDisplay}</ComparisonCell>
      <ComparisonCell state={state}>{rightDisplay}</ComparisonCell>
    </tr>
  );
}

function ExternalLink({ href }: { href: string }) {
  return (
    <a
      className="inline-flex break-all text-[color:var(--cb-information-ink)] underline decoration-[color:var(--cb-information)]/25 underline-offset-2 transition hover:text-[color:var(--cb-information-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {href}
    </a>
  );
}

function LinkOrText({ href }: { href: string | null | undefined }) {
  return href ? <ExternalLink href={href} /> : "Not provided";
}

function Field({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.3em] text-[color:var(--cb-muted-foreground)]">{label}</dt>
      <dd className="mt-2 break-words text-sm text-[color:var(--cb-foreground)]">{value}</dd>
    </div>
  );
}

export default async function DuplicateCandidateDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getDuplicateCandidateById(id);

  if (!candidate) notFound();

  const confidence = getConfidenceMeta(candidate.score);

  return (
    <div className="space-y-4">
      <ButtonLink href="/duplicates">&larr; Back to duplicates</ButtonLink>

      <DataQualityPageHeader
        eyebrow="Duplicate review"
        title={`${candidate.leadA.businessName} vs ${candidate.leadB.businessName}`}
        description="Compare the two records side by side, keep technical IDs secondary, and use the same review states that already exist today."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceBadge label={confidence.label} score={candidate.score} tone={confidence.tone} detail={confidence.detail} />
            <StatusPill value={candidate.status} appearance="foundation" />
            <DataQualityStatusBadge
              label={DUPLICATE_STATUS_LABELS[candidate.status]}
              tone={candidate.status === "OPEN" ? "information" : candidate.status === "NEEDS_REVIEW" ? "warning" : candidate.status === "DISMISSED" ? "neutral" : "success"}
            />
          </div>
        }
      />

      <section className="rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]">
        <h2 className="text-lg font-semibold text-[color:var(--cb-foreground)]">Duplicate reasons</h2>
        <p className="mt-2 text-sm text-[color:var(--cb-muted-foreground)]">
          These existing signals explain why the pair was surfaced. They do not change any scoring or record resolution behavior.
        </p>
        <div className="mt-4">{renderReasons(candidate.reasons)}</div>
      </section>

      <section className="rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--cb-foreground)]">Side-by-side comparison</h2>
              <p className="mt-2 text-sm text-[color:var(--cb-muted-foreground)]">
                Matching and differing values are highlighted so operators can scan the pair faster.
              </p>
          </div>
          <ComparisonLegend />
        </div>

        <TableSurface aria-label="Scrollable duplicate comparison table" className="mt-4">
          <Table className="min-w-[980px]">
            <caption className="sr-only">Side-by-side comparison for the selected duplicate candidate.</caption>
            <TableHead>
              <tr>
                <TableHeadCell scope="col">Field</TableHeadCell>
                <TableHeadCell scope="col">{candidate.leadA.businessName}</TableHeadCell>
                <TableHeadCell scope="col">{candidate.leadB.businessName}</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              <ComparisonRow
                label="Business name"
                leftValue={candidate.leadA.businessName}
                rightValue={candidate.leadB.businessName}
                leftDisplay={candidate.leadA.businessName}
                rightDisplay={candidate.leadB.businessName}
              />
              <ComparisonRow label="City" leftValue={candidate.leadA.city} rightValue={candidate.leadB.city} leftDisplay={candidate.leadA.city ?? "Not provided"} rightDisplay={candidate.leadB.city ?? "Not provided"} />
              <ComparisonRow label="Category" leftValue={candidate.leadA.category} rightValue={candidate.leadB.category} leftDisplay={candidate.leadA.category ?? "Not provided"} rightDisplay={candidate.leadB.category ?? "Not provided"} />
              <ComparisonRow label="Phone" leftValue={candidate.leadA.phone} rightValue={candidate.leadB.phone} leftDisplay={candidate.leadA.phone ?? "Not provided"} rightDisplay={candidate.leadB.phone ?? "Not provided"} />
              <ComparisonRow label="Email" leftValue={candidate.leadA.email} rightValue={candidate.leadB.email} leftDisplay={candidate.leadA.email ?? "Not provided"} rightDisplay={candidate.leadB.email ?? "Not provided"} />
              <ComparisonRow label="Website" leftValue={candidate.leadA.websiteUrl} rightValue={candidate.leadB.websiteUrl} leftDisplay={<LinkOrText href={candidate.leadA.websiteUrl} />} rightDisplay={<LinkOrText href={candidate.leadB.websiteUrl} />} />
              <ComparisonRow label="Instagram" leftValue={candidate.leadA.instagramUrl} rightValue={candidate.leadB.instagramUrl} leftDisplay={<LinkOrText href={candidate.leadA.instagramUrl} />} rightDisplay={<LinkOrText href={candidate.leadB.instagramUrl} />} />
              <ComparisonRow label="Facebook" leftValue={candidate.leadA.facebookUrl} rightValue={candidate.leadB.facebookUrl} leftDisplay={<LinkOrText href={candidate.leadA.facebookUrl} />} rightDisplay={<LinkOrText href={candidate.leadB.facebookUrl} />} />
            </TableBody>
          </Table>
        </TableSurface>

        <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href={`/leads/${candidate.leadA.id}`} aria-label={`Open lead detail for ${candidate.leadA.businessName}`}>
              Open lead detail for {candidate.leadA.businessName}
            </ButtonLink>
            <ButtonLink href={`/leads/${candidate.leadB.id}`} aria-label={`Open lead detail for ${candidate.leadB.businessName}`}>
              Open lead detail for {candidate.leadB.businessName}
            </ButtonLink>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <TechnicalDisclosure title={`Technical details for ${candidate.leadA.businessName}`}>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Customer ID" value={candidate.leadA.customerId} />
            <Field label="Google Place ID" value={candidate.leadA.googlePlaceId ?? "Not provided"} />
            <Field label="Source" value={candidate.leadA.source ?? "Not provided"} />
            <Field label="Source record ID" value={candidate.leadA.sourceRecordId ?? "Not provided"} />
          </dl>
        </TechnicalDisclosure>
        <TechnicalDisclosure title={`Technical details for ${candidate.leadB.businessName}`}>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Customer ID" value={candidate.leadB.customerId} />
            <Field label="Google Place ID" value={candidate.leadB.googlePlaceId ?? "Not provided"} />
            <Field label="Source" value={candidate.leadB.source ?? "Not provided"} />
            <Field label="Source record ID" value={candidate.leadB.sourceRecordId ?? "Not provided"} />
          </dl>
        </TechnicalDisclosure>
      </div>

      <section className="rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]">
        <h2 className="text-lg font-semibold text-[color:var(--cb-foreground)]">Review metadata</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-3">
          <Field
            label="Candidate status"
            value={
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={candidate.status} appearance="foundation" />
                <span>{DUPLICATE_STATUS_LABELS[candidate.status]}</span>
              </div>
            }
          />
          <Field label="Reviewed at" value={candidate.reviewedAt ? formatDate(candidate.reviewedAt) : "Not reviewed yet"} />
          <Field label="Updated at" value={formatDate(candidate.updatedAt)} />
        </dl>
        {candidate.decisionNote ? <p className="mt-4 text-sm text-[color:var(--cb-muted-foreground)]">Decision note: {candidate.decisionNote}</p> : null}

        <h3 className="mt-6 text-base font-semibold text-[color:var(--cb-foreground)]">Review action</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--cb-muted-foreground)]">
          Keep the current status transitions, but choose the label that best describes the operator intent for this pair.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.DISMISSED)}>
            <Button type="submit" variant="secondary">
              Keep both records separate
            </Button>
          </form>
          <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.NEEDS_REVIEW)}>
            <Button type="submit" variant="secondary">
              Flag for closer review
            </Button>
          </form>
          <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.RESOLVED)}>
            <Button type="submit" variant="primary">
              Mark review complete
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
