import Link from "next/link";
import { notFound } from "next/navigation";
import { DuplicateCandidateStatus } from "@/generated/prisma/client";
import { getDuplicateCandidateById } from "@/lib/duplicates";
import { StatusPill } from "@/components/lead-status-pill";
import { updateDuplicateCandidateAction } from "@/app/duplicates/actions";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(value)
    : "-";
}

function renderReasons(reasons: unknown) {
  if (!Array.isArray(reasons) || reasons.length === 0) return "-";

  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {reasons.map((reason, index) => {
        if (!reason || typeof reason !== "object") return null;
        const entry = reason as { label?: string; value?: string; score?: number; signal?: string };
        return (
          <li
            key={`${entry.signal ?? "reason"}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-950">{entry.label ?? "Duplicate signal"}</div>
                <div className="mt-1 break-words text-xs leading-5 text-slate-600">
                  {entry.value ?? "No technical value recorded"}
                </div>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-600">
                {entry.score ?? "-"}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Field({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</dt>
      <dd className="mt-2 break-words text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function ComparisonField({
  label,
  left,
  right
}: {
  label: string;
  left: string | null | undefined;
  right: string | null | undefined;
}) {
  const normalizedLeft = normalizeComparisonValue(left);
  const normalizedRight = normalizeComparisonValue(right);
  const same = normalizedLeft !== "" && normalizedLeft === normalizedRight;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${
            same ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {same ? "Match" : "Different"}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className={`rounded-xl border p-3 ${same ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Lead A</p>
          <p className="mt-1 break-words text-sm text-slate-900">{left ?? "-"}</p>
        </div>
        <div className={`rounded-xl border p-3 ${same ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Lead B</p>
          <p className="mt-1 break-words text-sm text-slate-900">{right ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}

function normalizeComparisonValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function TechnicalField({
  label,
  value
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{label}</dt>
      <dd className="mt-2 break-words font-mono text-xs text-slate-600">{value ?? "-"}</dd>
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/duplicates"
            className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            &larr; Back to duplicate review
          </Link>
        </div>

        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Duplicate candidate</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {candidate.leadA.businessName} ({candidate.leadA.customerId ?? candidate.leadA.source ?? "Lead A"}) vs{" "}
            {candidate.leadB.businessName} ({candidate.leadB.customerId ?? candidate.leadB.source ?? "Lead B"})
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill value={candidate.status} appearance="light" />
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
              {candidate.score}/100 confidence
            </span>
            <span className="text-sm text-slate-500">Review the strongest matches first, then confirm the differing fields below.</span>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Match signals</h2>
            <p className="text-sm text-slate-500">Existing scoring signals only; no merge action is triggered here.</p>
          </div>
          <div className="mt-4">{renderReasons(candidate.reasons)}</div>
        </section>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Compare leads</h2>
            <p className="text-sm text-slate-500">Match states are highlighted in green; differences stay neutral and easy to scan.</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[900px] grid gap-3">
            <ComparisonField label="Business name" left={candidate.leadA.businessName} right={candidate.leadB.businessName} />
            <ComparisonField label="City" left={candidate.leadA.city} right={candidate.leadB.city} />
            <ComparisonField label="Category" left={candidate.leadA.category} right={candidate.leadB.category} />
            <ComparisonField label="Phone" left={candidate.leadA.phone} right={candidate.leadB.phone} />
            <ComparisonField label="Email" left={candidate.leadA.email} right={candidate.leadB.email} />
            <ComparisonField label="Website" left={candidate.leadA.websiteUrl} right={candidate.leadB.websiteUrl} />
            <ComparisonField label="Instagram" left={candidate.leadA.instagramUrl} right={candidate.leadB.instagramUrl} />
            <ComparisonField label="Facebook" left={candidate.leadA.facebookUrl} right={candidate.leadB.facebookUrl} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Operator actions</h2>
            <p className="text-sm text-slate-500">These buttons only change review status; they do not merge or delete leads.</p>
          </div>
          <dl className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Candidate status" value={<StatusPill value={candidate.status} appearance="light" />} />
            <Field label="Reviewed at" value={formatDate(candidate.reviewedAt)} />
            <Field label="Updated at" value={formatDate(candidate.updatedAt)} />
          </dl>
          {candidate.decisionNote ? (
            <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-700 outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                Show operator note
              </summary>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                {candidate.decisionNote}
              </p>
            </details>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.DISMISSED)}>
              <button
                type="submit"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Keep both records separate
              </button>
            </form>
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.NEEDS_REVIEW)}>
              <button
                type="submit"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Flag for closer review
              </button>
            </form>
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.RESOLVED)}>
              <button
                type="submit"
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Confirm duplicate and close review
              </button>
            </form>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Technical identifiers</h2>
            <p className="text-sm text-slate-500">Kept secondary so the comparison surface stays operator-friendly.</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">Lead A</p>
              <dl className="grid gap-3">
                <TechnicalField label="Google Place ID" value={candidate.leadA.googlePlaceId} />
                <TechnicalField label="Customer ID" value={candidate.leadA.customerId} />
                <TechnicalField label="Source" value={candidate.leadA.source} />
                <TechnicalField label="Source record ID" value={candidate.leadA.sourceRecordId} />
              </dl>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">Lead B</p>
              <dl className="grid gap-3">
                <TechnicalField label="Google Place ID" value={candidate.leadB.googlePlaceId} />
                <TechnicalField label="Customer ID" value={candidate.leadB.customerId} />
                <TechnicalField label="Source" value={candidate.leadB.source} />
                <TechnicalField label="Source record ID" value={candidate.leadB.sourceRecordId} />
              </dl>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
              Supporting lead records
            </summary>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <LeadPanel title="Lead A" lead={candidate.leadA} />
              <LeadPanel title="Lead B" lead={candidate.leadB} />
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}

function LeadPanel({
  title,
  lead
}: {
  title: string;
  lead: NonNullable<Awaited<ReturnType<typeof getDuplicateCandidateById>>>["leadA"];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Business name" value={lead.businessName} />
        <Field label="City" value={lead.city ?? "-"} />
        <Field label="Category" value={lead.category ?? "-"} />
        <Field label="Phone" value={lead.phone ?? "-"} />
        <Field label="Email" value={lead.email ?? "-"} />
        <Field label="Website" value={lead.websiteUrl ? <ExternalLink href={lead.websiteUrl} /> : "-"} />
        <Field label="Instagram" value={lead.instagramUrl ? <ExternalLink href={lead.instagramUrl} /> : "-"} />
        <Field label="Facebook" value={lead.facebookUrl ? <ExternalLink href={lead.facebookUrl} /> : "-"} />
      </dl>
      <div className="mt-4 grid gap-3">
        <Field label="Google Place ID" value={lead.googlePlaceId ?? "-"} />
        <Field label="Customer ID" value={lead.customerId} />
        <Field label="Source" value={lead.source ?? "-"} />
        <Field label="Source record ID" value={lead.sourceRecordId ?? "-"} />
      </div>
      <div className="mt-6">
        <Link
          href={`/leads/${lead.id}`}
          aria-label={`Open lead detail for ${lead.businessName}`}
          className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Open lead detail
        </Link>
      </div>
    </section>
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
