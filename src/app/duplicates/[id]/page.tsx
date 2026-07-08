import Link from "next/link";
import { type ReactNode } from "react";
import { notFound } from "next/navigation";
import { DuplicateCandidateStatus } from "@/generated/prisma/client";
import { updateDuplicateCandidateAction } from "@/app/duplicates/actions";
import { StatusPill } from "@/components/lead-status-pill";
import { requireUser } from "@/lib/auth-context";
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
      className: "border-emerald-200 bg-emerald-50 text-emerald-700"
    };
  }

  if (score >= 85) {
    return {
      label: "High confidence",
      detail: "The records look closely related and usually need only a short verification.",
      className: "border-sky-200 bg-sky-50 text-sky-700"
    };
  }

  return {
    label: "Needs closer review",
    detail: "There is useful overlap, but a human should confirm the fields carefully.",
    className: "border-amber-200 bg-amber-50 text-amber-700"
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
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          >
            <div className="text-sm font-medium text-slate-950">{entry.label ?? "Duplicate signal"}</div>
            <div className="mt-1 break-words text-sm text-slate-700">{entry.value ?? "-"}</div>
            <div className="mt-2 text-xs text-slate-500">Signal strength: {entry.score ?? "-"}</div>
          </li>
        );
      })}
    </ul>
  );
}

function ComparisonLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
        Matching field
      </span>
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
        Different field
      </span>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
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
    match: "border-emerald-200 bg-emerald-50 text-emerald-950",
    difference: "border-amber-200 bg-amber-50 text-amber-950",
    missing: "border-slate-200 bg-slate-50 text-slate-600"
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
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="mt-1 text-xs text-slate-500">{getComparisonNote(state)}</div>
      </th>
      <ComparisonCell state={state}>{leftDisplay}</ComparisonCell>
      <ComparisonCell state={state}>{rightDisplay}</ComparisonCell>
    </tr>
  );
}

function ExternalLink({ href }: { href: string }) {
  return (
    <a
      className="inline-flex break-all text-sky-700 underline decoration-sky-200 underline-offset-2 transition hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</dt>
      <dd className="mt-2 break-words text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function TechnicalDetails({
  title,
  lead
}: {
  title: string;
  lead: NonNullable<Awaited<ReturnType<typeof getDuplicateCandidateById>>>["leadA"];
}) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50">
        {title}
      </summary>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Customer ID" value={lead.customerId} />
        <Field label="Google Place ID" value={lead.googlePlaceId ?? "Not provided"} />
        <Field label="Source" value={lead.source ?? "Not provided"} />
        <Field label="Source record ID" value={lead.sourceRecordId ?? "Not provided"} />
      </dl>
    </details>
  );
}

export default async function DuplicateCandidateDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser({ mode: "redirect", returnTo: "/duplicates" });
  const { id } = await params;
  const candidate = await getDuplicateCandidateById(id);

  if (!candidate) notFound();

  const confidence = getConfidenceMeta(candidate.score);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <div className="mb-4">
          <Link
            href="/duplicates"
            className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            &larr; Back to duplicates
          </Link>
        </div>

        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <p className="text-sm font-medium text-sky-700">Duplicate review</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {candidate.leadA.businessName} vs {candidate.leadB.businessName}
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Compare the two records side by side, keep technical IDs secondary, and use the same
            review states that already exist today.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${confidence.className}`}
            >
              {confidence.label}
            </span>
            <StatusPill value={candidate.status} appearance="light" />
            <span className="font-medium text-slate-900">{DUPLICATE_STATUS_LABELS[candidate.status]}</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
              Score {candidate.score}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{confidence.detail}</p>
        </header>

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Duplicate reasons</h2>
          <p className="mt-2 text-sm text-slate-600">
            These existing signals explain why the pair was surfaced. They do not change any scoring
            or merge behavior.
          </p>
          <div className="mt-4">{renderReasons(candidate.reasons)}</div>
        </section>

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Side-by-side comparison</h2>
              <p className="mt-2 text-sm text-slate-600">
                Matching and differing values are highlighted so operators can scan the pair faster.
              </p>
            </div>
            <ComparisonLegend />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Side-by-side comparison for the selected duplicate candidate.</caption>
              <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Field</th>
                  <th scope="col" className="px-4 py-3">{candidate.leadA.businessName}</th>
                  <th scope="col" className="px-4 py-3">{candidate.leadB.businessName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <ComparisonRow
                  label="Business name"
                  leftValue={candidate.leadA.businessName}
                  rightValue={candidate.leadB.businessName}
                  leftDisplay={candidate.leadA.businessName}
                  rightDisplay={candidate.leadB.businessName}
                />
                <ComparisonRow
                  label="City"
                  leftValue={candidate.leadA.city}
                  rightValue={candidate.leadB.city}
                  leftDisplay={candidate.leadA.city ?? "Not provided"}
                  rightDisplay={candidate.leadB.city ?? "Not provided"}
                />
                <ComparisonRow
                  label="Category"
                  leftValue={candidate.leadA.category}
                  rightValue={candidate.leadB.category}
                  leftDisplay={candidate.leadA.category ?? "Not provided"}
                  rightDisplay={candidate.leadB.category ?? "Not provided"}
                />
                <ComparisonRow
                  label="Phone"
                  leftValue={candidate.leadA.phone}
                  rightValue={candidate.leadB.phone}
                  leftDisplay={candidate.leadA.phone ?? "Not provided"}
                  rightDisplay={candidate.leadB.phone ?? "Not provided"}
                />
                <ComparisonRow
                  label="Email"
                  leftValue={candidate.leadA.email}
                  rightValue={candidate.leadB.email}
                  leftDisplay={candidate.leadA.email ?? "Not provided"}
                  rightDisplay={candidate.leadB.email ?? "Not provided"}
                />
                <ComparisonRow
                  label="Website"
                  leftValue={candidate.leadA.websiteUrl}
                  rightValue={candidate.leadB.websiteUrl}
                  leftDisplay={<LinkOrText href={candidate.leadA.websiteUrl} />}
                  rightDisplay={<LinkOrText href={candidate.leadB.websiteUrl} />}
                />
                <ComparisonRow
                  label="Instagram"
                  leftValue={candidate.leadA.instagramUrl}
                  rightValue={candidate.leadB.instagramUrl}
                  leftDisplay={<LinkOrText href={candidate.leadA.instagramUrl} />}
                  rightDisplay={<LinkOrText href={candidate.leadB.instagramUrl} />}
                />
                <ComparisonRow
                  label="Facebook"
                  leftValue={candidate.leadA.facebookUrl}
                  rightValue={candidate.leadB.facebookUrl}
                  leftDisplay={<LinkOrText href={candidate.leadA.facebookUrl} />}
                  rightDisplay={<LinkOrText href={candidate.leadB.facebookUrl} />}
                />
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/leads/${candidate.leadA.id}`}
              aria-label={`Open lead detail for ${candidate.leadA.businessName}`}
              className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Open lead detail for {candidate.leadA.businessName}
            </Link>
            <Link
              href={`/leads/${candidate.leadB.id}`}
              aria-label={`Open lead detail for ${candidate.leadB.businessName}`}
              className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Open lead detail for {candidate.leadB.businessName}
            </Link>
          </div>
        </section>

        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <TechnicalDetails title={`Technical details for ${candidate.leadA.businessName}`} lead={candidate.leadA} />
          <TechnicalDetails title={`Technical details for ${candidate.leadB.businessName}`} lead={candidate.leadB} />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Review metadata</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-3">
            <Field
              label="Candidate status"
              value={
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill value={candidate.status} appearance="light" />
                  <span>{DUPLICATE_STATUS_LABELS[candidate.status]}</span>
                </div>
              }
            />
            <Field label="Reviewed at" value={candidate.reviewedAt ? formatDate(candidate.reviewedAt) : "Not reviewed yet"} />
            <Field label="Updated at" value={formatDate(candidate.updatedAt)} />
          </dl>
          {candidate.decisionNote ? (
            <p className="mt-4 text-sm text-slate-600">{candidate.decisionNote}</p>
          ) : null}

          <h3 className="mt-6 text-base font-semibold text-slate-950">Review action</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep the current status transitions, but choose the label that best describes the operator
            intent for this pair.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.DISMISSED)}>
              <button
                type="submit"
                className="whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Keep both records separate
              </button>
            </form>
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.NEEDS_REVIEW)}>
              <button
                type="submit"
                className="whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Flag for closer review
              </button>
            </form>
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.RESOLVED)}>
              <button
                type="submit"
                className="whitespace-nowrap rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Mark review complete
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
