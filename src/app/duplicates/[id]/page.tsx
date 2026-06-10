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
    <ul className="space-y-2">
      {reasons.map((reason, index) => {
        if (!reason || typeof reason !== "object") return null;
        const entry = reason as { label?: string; value?: string; score?: number; signal?: string };
        return (
          <li key={`${entry.signal ?? "reason"}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-sm font-medium text-slate-100">{entry.label ?? "Duplicate signal"}</div>
            <div className="text-xs text-slate-400">
              {entry.value ?? "-"} · score {entry.score ?? "-"}
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
      <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</dt>
      <dd className="mt-2 break-words text-sm text-slate-100">{value}</dd>
    </div>
  );
}

function LeadPanel({ title, lead }: { title: string; lead: NonNullable<Awaited<ReturnType<typeof getDuplicateCandidateById>>>["leadA"] }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-medium">{title}</h2>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Business name" value={lead.businessName} />
        <Field label="City" value={lead.city ?? "-"} />
        <Field label="Category" value={lead.category ?? "-"} />
        <Field label="Phone" value={lead.phone ?? "-"} />
        <Field label="Email" value={lead.email ?? "-"} />
        <Field label="Website" value={lead.websiteUrl ? <ExternalLink href={lead.websiteUrl} /> : "-"} />
        <Field label="Instagram" value={lead.instagramUrl ? <ExternalLink href={lead.instagramUrl} /> : "-"} />
        <Field label="Facebook" value={lead.facebookUrl ? <ExternalLink href={lead.facebookUrl} /> : "-"} />
        <Field label="Google Place ID" value={lead.googlePlaceId ?? "-"} />
        <Field label="Customer ID" value={lead.customerId} />
        <Field label="Source" value={lead.source ?? "-"} />
        <Field label="Source record ID" value={lead.sourceRecordId ?? "-"} />
      </dl>
      <div className="mt-6">
        <Link href={`/leads/${lead.id}`} className="text-cyan-300 hover:text-cyan-200">
          Open lead detail
        </Link>
      </div>
    </section>
  );
}

function ExternalLink({ href }: { href: string }) {
  return (
    <a className="text-cyan-300 hover:text-cyan-200" href={href} target="_blank" rel="noreferrer">
      {href}
    </a>
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <Link href="/duplicates" className="text-sm text-cyan-300 hover:text-cyan-200">
            &larr; Back to duplicates
          </Link>
        </div>

        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Duplicate candidate</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {candidate.leadA.businessName} vs {candidate.leadB.businessName}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill value={candidate.status} />
            <span className="inline-flex items-center rounded-full border border-slate-700 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-200">
              Score {candidate.score}
            </span>
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-medium">Duplicate reasons</h2>
          <div className="mt-4">{renderReasons(candidate.reasons)}</div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <LeadPanel title="Lead A" lead={candidate.leadA} />
          <LeadPanel title="Lead B" lead={candidate.leadB} />
        </div>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-medium">Review metadata</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Candidate status" value={<StatusPill value={candidate.status} />} />
            <Field label="Reviewed at" value={formatDate(candidate.reviewedAt)} />
            <Field label="Updated at" value={formatDate(candidate.updatedAt)} />
          </dl>
          {candidate.decisionNote ? (
            <p className="mt-4 text-sm text-slate-300">{candidate.decisionNote}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.DISMISSED)}>
              <button type="submit" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200">
                Dismiss
              </button>
            </form>
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.NEEDS_REVIEW)}>
              <button type="submit" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200">
                Mark needs review
              </button>
            </form>
            <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.RESOLVED)}>
              <button type="submit" className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400">
                Mark resolved
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
