import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@/lib/leads";
import { LeadUpdateForm } from "@/components/lead-update-form";
import { StatusPill } from "@/components/lead-status-pill";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function asLocalDateTimeValue(value: Date | null | undefined) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <Link href="/leads" className="text-sm text-cyan-300 hover:text-cyan-200">
            &larr; Back to leads
          </Link>
        </div>

        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Lead detail</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{lead.businessName}</h1>
          <p className="mt-2 text-sm text-slate-300">
            {lead.city ?? "-"}, {lead.region ?? "-"}, {lead.country ?? "-"}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-medium">Business identity</h2>
              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                <Detail label="Business name" value={lead.businessName} />
                <Detail label="Customer ID" value={lead.customerId} />
                <Detail label="Category" value={lead.category ?? "-"} />
                <Detail label="Address" value={lead.address ?? "-"} />
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-medium">Contact and source</h2>
              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                <Detail label="Email" value={lead.email ?? "-"} />
                <Detail label="Phone" value={lead.phone ?? "-"} />
                <Detail label="Source" value={lead.source ?? "-"} />
                <Detail label="Source record ID" value={lead.sourceRecordId ?? "-"} />
                <Detail label="Google Place ID" value={lead.googlePlaceId ?? "-"} />
                <Detail label="Website" value={lead.websiteUrl ? <ExternalLink href={lead.websiteUrl} /> : "-"} />
                <Detail label="Instagram" value={lead.instagramUrl ? <ExternalLink href={lead.instagramUrl} /> : "-"} />
                <Detail label="Facebook" value={lead.facebookUrl ? <ExternalLink href={lead.facebookUrl} /> : "-"} />
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-medium">Protected metadata</h2>
              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                <Detail label="Created at" value={formatDate(lead.createdAt)} />
                <Detail label="Updated at" value={formatDate(lead.updatedAt)} />
                <Detail label="Last imported at" value={formatDate(lead.lastImportedAt)} />
                <Detail label="Last reviewed at" value={formatDate(lead.lastReviewedAt)} />
                <Detail label="Archived at" value={formatDate(lead.archivedAt)} />
              </dl>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-medium">Operational update</h2>
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusPill value={lead.leadStatus} />
                  <StatusPill value={lead.priority} />
                  <StatusPill value={lead.packageFit} />
                </div>
                <p className="text-sm text-slate-300">Score: {lead.scoreTotal}</p>
                <p className="text-sm text-slate-300">Next action: {formatDate(lead.nextActionAt)}</p>
              </div>
            </div>

            <LeadUpdateForm
              leadId={lead.id}
              leadStatus={lead.leadStatus}
              priority={lead.priority}
              packageFit={lead.packageFit}
              nextActionAt={asLocalDateTimeValue(lead.nextActionAt)}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function Detail({
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

function ExternalLink({ href }: { href: string }) {
  return (
    <a className="text-cyan-300 hover:text-cyan-200" href={href} target="_blank" rel="noreferrer">
      {href}
    </a>
  );
}
