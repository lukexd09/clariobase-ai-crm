import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityForm, ActivityTimeline } from "@/components/activity-form";
import { LeadUpdateForm } from "@/components/lead-update-form";
import { OfferDraftSection } from "@/components/offer-draft-form";
import { MiniAuditDraftSection } from "@/components/mini-audit-draft-form";
import { OutreachDraftSection } from "@/components/outreach-draft-form";
import { StatusPill } from "@/components/lead-status-pill";
import { getLeadActivities } from "@/lib/activities";
import { getLeadById } from "@/lib/leads";
import { getLeadOfferDrafts, toOfferDraftClientRecord } from "@/lib/offer-drafts";
import { getLeadMiniAuditDrafts, type MiniAuditDraftRecord } from "@/lib/mini-audits";
import { getLeadOutreachDrafts, type OutreachDraftRecord } from "@/lib/outreach-drafts";
import { type OfferDraftClientRecord } from "@/lib/offer-drafts";
import {
  type MiniAuditStatusValue,
  type OfferDraftStatusValue,
  type OutreachDraftStatusValue,
  type PackageFitValue
} from "@/lib/lead-values";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function formatShortDate(value: Date | null | undefined) {
  if (!value) return "Not updated yet";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium"
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
  const [lead, activities, miniAuditDrafts, outreachDrafts, offerDrafts] = await Promise.all([
    getLeadById(id),
    getLeadActivities(id),
    getLeadMiniAuditDrafts(id),
    getLeadOutreachDrafts(id),
    getLeadOfferDrafts(id)
  ]);

  if (!lead) notFound();

  const clientOfferDrafts = offerDrafts.map(toOfferDraftClientRecord);
  const miniAuditPanelPackage = getMiniAuditPanelPackage(miniAuditDrafts);
  const offerPanelPackage = getOfferPanelPackage(clientOfferDrafts);
  const recommendation = getNextRecommendedAction({
    miniAuditDrafts,
    outreachDrafts,
    offerDrafts: clientOfferDrafts
  });

  return (
    <main className="min-h-screen bg-[#0A0C10] text-[#F0F4F9]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <LeadDetailSidebar />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/leads"
            className="text-sm font-medium text-[#94A3B8] transition hover:text-[#22D3EE]"
          >
            &larr; Back to leads
          </Link>
          <Link
            href="/work"
            className="rounded-full border border-[#1E293B] bg-[#11141D] px-4 py-2 text-sm font-medium text-[#F0F4F9] transition hover:border-[#22D3EE] hover:text-[#22D3EE]"
          >
            Open workbench
          </Link>
        </div>

        <header className="rounded-3xl border border-[#1E293B] bg-[#11141D] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#22D3EE]">
                  Lead workspace
                </p>
                <StatusPill value={lead.leadStatus} />
                <StatusPill value={lead.priority} />
                <StatusPill value={lead.packageFit} />
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[#F0F4F9] sm:text-5xl">
                {lead.businessName}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#94A3B8]">
                <span>{lead.city ?? "-"}</span>
                <span>|</span>
                <span>{lead.region ?? "-"}</span>
                <span>|</span>
                <span>{lead.country ?? "-"}</span>
                <span>|</span>
                <span>{lead.category ?? "Unspecified category"}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.websiteUrl ? <ExternalLink href={lead.websiteUrl} label="Website" /> : null}
                {lead.source ? <MetaChip label="Source" value={lead.source} /> : null}
                {lead.sourceRecordId ? <MetaChip label="Source record" value={lead.sourceRecordId} /> : null}
                {lead.googlePlaceId ? <MetaChip label="Google Place ID" value={lead.googlePlaceId} /> : null}
              </div>
            </div>

            <div className="grid gap-3 sm:min-w-[300px]">
              <div className="rounded-2xl border border-[#1E293B] bg-[#0A0C10] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#94A3B8]">Lead score</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-semibold text-[#F0F4F9]">{lead.scoreTotal}</p>
                    <p className="mt-1 text-sm text-[#94A3B8]">{lead.scoreLabel ?? "No score label"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#1E293B] bg-[#11141D] px-3 py-2 text-right">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-[#94A3B8]">Customer</p>
                    <p className="mt-1 text-sm font-medium text-[#F0F4F9]">{lead.customerId}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="#lead-controls"
                  className="rounded-full bg-[#22D3EE] px-4 py-2 text-sm font-semibold text-[#00363e] transition hover:brightness-110"
                >
                  Lead controls
                </Link>
                <Link
                  href="#activity"
                  className="rounded-full border border-[#1E293B] bg-[#11141D] px-4 py-2 text-sm font-medium text-[#F0F4F9] transition hover:border-[#22D3EE] hover:text-[#22D3EE]"
                >
                  Activity log
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_420px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-[#1E293B] bg-[#11141D] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#22D3EE]">
                    Next recommended action
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#F0F4F9]">
                    {recommendation.title}
                  </h2>
                  <p className="max-w-3xl text-sm leading-6 text-[#94A3B8]">
                    {recommendation.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={recommendation.primaryHref}
                    className="rounded-full bg-[#22D3EE] px-4 py-2 text-sm font-semibold text-[#00363e] transition hover:brightness-110"
                  >
                    {recommendation.primaryLabel}
                  </Link>
                  <Link
                    href={recommendation.secondaryHref}
                    className="rounded-full border border-[#1E293B] bg-[#0A0C10] px-4 py-2 text-sm font-medium text-[#F0F4F9] transition hover:border-[#22D3EE] hover:text-[#22D3EE]"
                  >
                    {recommendation.secondaryLabel}
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#1E293B] bg-[#11141D] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#F0F4F9]">Business context</h2>
                  <p className="mt-1 text-sm text-[#94A3B8]">
                    A compact overview of the lead, source, and qualification context.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ContextField label="Website" value={lead.websiteUrl ? <ExternalLink href={lead.websiteUrl} label={lead.websiteUrl} /> : "-"} />
                <ContextField label="Category" value={lead.category ?? "-"} />
                <ContextField label="City" value={lead.city ?? "-"} />
                <ContextField label="Region / country" value={`${lead.region ?? "-"} / ${lead.country ?? "-"}`} />
                <ContextField label="Phone" value={lead.phone ?? "-"} />
                <ContextField label="Email" value={lead.email ?? "-"} />
                <ContextField label="Address" value={lead.address ?? "-"} />
                <ContextField
                  label="Source"
                  value={
                    lead.source
                      ? lead.sourceRecordId
                        ? `${lead.source} (${lead.sourceRecordId})`
                        : lead.source
                      : "-"
                  }
                />
              </div>

              <div className="mt-6 grid gap-4 border-t border-[#1E293B] pt-5 md:grid-cols-2">
                <CompactStat label="Lead status" value={<StatusPill value={lead.leadStatus} />} />
                <CompactStat label="Priority" value={<StatusPill value={lead.priority} />} />
                <CompactStat label="Package fit" value={<StatusPill value={lead.packageFit} />} />
                <CompactStat
                  label="Next action"
                  value={lead.nextActionAt ? formatDate(lead.nextActionAt) : "No next action set"}
                />
              </div>
            </section>

            <section className="space-y-4" id="lead-artifacts">
                <ArtifactPanel
                  id="mini-audit"
                  label="Mini-audit"
                  title={getArtifactPanelTitle("Mini-audit", miniAuditDrafts.length)}
                  description={getMiniAuditPanelDescription(miniAuditDrafts)}
                  statusBadge={<StatusPill value={getMiniAuditPanelStatus(miniAuditDrafts)} />}
                  packageBadge={miniAuditPanelPackage ? <StatusPill value={miniAuditPanelPackage} /> : null}
                  updatedAt={getMiniAuditPanelUpdatedAt(miniAuditDrafts)}
                  actionLabel={getMiniAuditPanelAction(miniAuditDrafts)}
                >
                <MiniAuditDraftSection leadId={lead.id} drafts={miniAuditDrafts} />
              </ArtifactPanel>

              <ArtifactPanel
                id="outreach"
                label="Outreach sequence"
                title={getArtifactPanelTitle("Outreach sequence", outreachDrafts.length)}
                description={getOutreachPanelDescription(outreachDrafts)}
                statusBadge={<StatusPill value={getOutreachPanelStatus(outreachDrafts)} />}
                packageBadge={null}
                updatedAt={getOutreachPanelUpdatedAt(outreachDrafts)}
                actionLabel={getOutreachPanelAction(outreachDrafts)}
              >
                <OutreachDraftSection
                  leadId={lead.id}
                  drafts={outreachDrafts}
                  miniAuditDrafts={miniAuditDrafts}
                />
              </ArtifactPanel>

                <ArtifactPanel
                  id="offer"
                  label="Offer generation"
                  title={getOfferPanelTitle(clientOfferDrafts)}
                  description={getOfferPanelDescription(clientOfferDrafts)}
                  statusBadge={<StatusPill value={getOfferPanelStatus(clientOfferDrafts)} />}
                  packageBadge={offerPanelPackage ? <StatusPill value={offerPanelPackage} /> : null}
                  updatedAt={getOfferPanelUpdatedAt(clientOfferDrafts)}
                  actionLabel={getOfferPanelAction(clientOfferDrafts)}
                >
                <OfferDraftSection leadId={lead.id} drafts={clientOfferDrafts} />
              </ArtifactPanel>
            </section>

            <details className="rounded-3xl border border-[#1E293B] bg-[#11141D] p-0 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <summary className="cursor-pointer list-none rounded-3xl px-6 py-5 text-left">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#94A3B8]">
                      Technical details
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#F0F4F9]">
                      Protected metadata
                    </h2>
                  </div>
                  <span className="rounded-full border border-[#1E293B] bg-[#0A0C10] px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-[#94A3B8]">
                    Expand
                  </span>
                </div>
              </summary>
              <div className="border-t border-[#1E293B] px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <ContextField label="Customer ID" value={lead.customerId} />
                  <ContextField label="Created at" value={formatDate(lead.createdAt)} />
                  <ContextField label="Updated at" value={formatDate(lead.updatedAt)} />
                  <ContextField label="Last imported at" value={formatDate(lead.lastImportedAt)} />
                  <ContextField label="Last reviewed at" value={formatDate(lead.lastReviewedAt)} />
                  <ContextField label="Archived at" value={formatDate(lead.archivedAt)} />
                </div>
              </div>
            </details>
          </div>

          <aside className="space-y-6">
            <section
              id="lead-controls"
              className="rounded-3xl border border-[#1E293B] bg-[#11141D] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            >
              <div className="border-b border-[#1E293B] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#22D3EE]">
                  Lead controls
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#F0F4F9]">Operational update</h2>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  Keep the current lead state, next action, and package fit aligned with the latest
                  work.
                </p>
              </div>

              <div className="mt-5">
                <LeadUpdateForm
                  leadId={lead.id}
                  leadStatus={lead.leadStatus}
                  priority={lead.priority}
                  packageFit={lead.packageFit}
                  nextActionAt={asLocalDateTimeValue(lead.nextActionAt)}
                />
              </div>
            </section>

            <section
              id="activity"
              className="space-y-6 rounded-3xl border border-[#1E293B] bg-[#11141D] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            >
              <div className="border-b border-[#1E293B] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#22D3EE]">
                  Activity log
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#F0F4F9]">
                  Notes, calls, messages, and updates
                </h2>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  Activity stays visible but secondary to the operator workspace cards.
                </p>
              </div>

              <ActivityForm leadId={lead.id} />
              <ActivityTimeline activities={activities} />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function getNextRecommendedAction({
  miniAuditDrafts,
  outreachDrafts,
  offerDrafts
}: {
  miniAuditDrafts: MiniAuditDraftRecord[];
  outreachDrafts: OutreachDraftRecord[];
  offerDrafts: OfferDraftClientRecord[];
}) {
  const latestOfferDraft = offerDrafts[0];
  const hasActiveOffer = offerDrafts.some(
    (draft) => !["ACCEPTED", "REJECTED", "ARCHIVED"].includes(draft.status)
  );

  if (miniAuditDrafts.length === 0) {
    return {
      title: "Prepare mini-audit",
      description:
        "No mini-audit draft exists yet, so start with diagnosis, package fit, and the first message angle.",
      primaryLabel: "Prepare mini-audit",
      primaryHref: "#mini-audit",
      secondaryLabel: "Open activity log",
      secondaryHref: "#activity"
    };
  }

  if (outreachDrafts.length === 0) {
    return {
      title: "Prepare outreach",
      description:
        "The lead already has a mini-audit foundation, so the next practical step is an outreach draft.",
      primaryLabel: "Prepare outreach",
      primaryHref: "#outreach",
      secondaryLabel: "Review lead controls",
      secondaryHref: "#lead-controls"
    };
  }

  if (offerDrafts.length === 0) {
    return {
      title: "Prepare offer",
      description:
        "The lead has enough earlier-workflow context, so create the first commercial offer draft next.",
      primaryLabel: "Prepare offer",
      primaryHref: "#offer",
      secondaryLabel: "Open activity log",
      secondaryHref: "#activity"
    };
  }

  if (hasActiveOffer && latestOfferDraft) {
    return {
      title: "Review offer",
      description:
        `The latest offer draft is still active (${latestOfferDraft.status.replaceAll("_", " ").toLowerCase()}). Review the current version before moving on.`,
      primaryLabel: "Review offer",
      primaryHref: "#offer",
      secondaryLabel: "Jump to activity",
      secondaryHref: "#activity"
    };
  }

  return {
    title: "Log activity or update lead status",
    description:
      "The core workflow artifacts already exist, so use the workspace to log a fresh activity or tighten the operational state.",
    primaryLabel: "Log activity",
    primaryHref: "#activity",
    secondaryLabel: "Update lead",
    secondaryHref: "#lead-controls"
  };
}

function getArtifactPanelTitle(name: string, count: number) {
  return count === 0 ? `${name} not started` : `${name} ready`;
}

function getMiniAuditPanelStatus(drafts: Array<{ status: string }>) {
  return (drafts[0]?.status ?? "DRAFT") as MiniAuditStatusValue;
}

function getMiniAuditPanelPackage(drafts: MiniAuditDraftRecord[]) {
  return drafts[0]?.suggestedPackage ?? null;
}

function getMiniAuditPanelDescription(
  drafts: MiniAuditDraftRecord[]
) {
  const latest = drafts[0];
  if (!latest) {
    return "Capture the first diagnosis, package fit, and a compact draft angle.";
  }

  return latest.recommendation ?? latest.problem1 ?? "Compact diagnosis ready for review.";
}

function getMiniAuditPanelUpdatedAt(drafts: MiniAuditDraftRecord[]) {
  return drafts[0]?.updatedAt ?? null;
}

function getMiniAuditPanelAction(drafts: MiniAuditDraftRecord[]) {
  const latest = drafts[0];
  if (!latest) return "Create";
  return latest.status === "APPROVED" || latest.status === "ARCHIVED" ? "View" : "Edit";
}

function getOutreachPanelStatus(drafts: OutreachDraftRecord[]) {
  return (drafts[0]?.status ?? "DRAFT") as OutreachDraftStatusValue;
}

function getOutreachPanelDescription(
  drafts: OutreachDraftRecord[]
) {
  const latest = drafts[0];
  if (!latest) {
    return "Prepare the first message sequence, channel, and follow-up metadata.";
  }

  return latest.subject ?? latest.openingHook ?? latest.message ?? "Latest outreach draft is ready.";
}

function getOutreachPanelUpdatedAt(drafts: OutreachDraftRecord[]) {
  return drafts[0]?.updatedAt ?? null;
}

function getOutreachPanelAction(drafts: OutreachDraftRecord[]) {
  const latest = drafts[0];
  if (!latest) return "Create";
  return latest.status === "SENT_MANUALLY" || latest.status === "ARCHIVED" ? "View" : "Edit";
}

function getOfferPanelTitle(drafts: OfferDraftClientRecord[]) {
  const latest = drafts[0];
  return latest ? latest.title : "Offer not started";
}

function getOfferPanelDescription(drafts: OfferDraftClientRecord[]) {
  const latest = drafts[0];
  if (!latest) {
    return "Prepare the first commercial offer draft when the lead is ready.";
  }

  const price = latest.priceNet ? `${latest.currency} ${latest.priceNet}` : "No price set yet";
  return [latest.packageFit.replaceAll("_", " "), price].join(" | ");
}

function getOfferPanelStatus(drafts: OfferDraftClientRecord[]) {
  return (drafts[0]?.status ?? "DRAFT") as OfferDraftStatusValue;
}

function getOfferPanelPackage(drafts: OfferDraftClientRecord[]) {
  return drafts[0]?.packageFit ?? null;
}

function getOfferPanelUpdatedAt(drafts: OfferDraftClientRecord[]) {
  return drafts[0]?.updatedAt ?? null;
}

function getOfferPanelAction(drafts: OfferDraftClientRecord[]) {
  const latest = drafts[0];
  if (!latest) return "Create";
  return latest.status === "ACCEPTED" || latest.status === "REJECTED" || latest.status === "ARCHIVED"
    ? "View"
    : "Edit";
}

function ContextField({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-[#1E293B] bg-[#0A0C10] p-4">
      <p className="text-[11px] uppercase tracking-[0.35em] text-[#94A3B8]">{label}</p>
      <div className="break-words text-sm leading-6 text-[#F0F4F9]">{value}</div>
    </div>
  );
}

function CompactStat({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0A0C10] p-4">
      <p className="text-[11px] uppercase tracking-[0.35em] text-[#94A3B8]">{label}</p>
      <div className="mt-3">{value}</div>
    </div>
  );
}

function ArtifactPanel({
  id,
  label,
  title,
  description,
  statusBadge,
  packageBadge,
  updatedAt,
  actionLabel,
  children
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  statusBadge: React.ReactNode;
  packageBadge: React.ReactNode | null;
  updatedAt: Date | null;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      className="group rounded-3xl border border-[#1E293B] bg-[#11141D] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
    >
      <summary className="list-none cursor-pointer px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#22D3EE]">
                {label}
              </p>
              {statusBadge}
              {packageBadge}
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#F0F4F9]">{title}</h3>
            <p className="max-w-3xl text-sm leading-6 text-[#94A3B8]">{description}</p>
            <p className="text-xs uppercase tracking-[0.35em] text-[#94A3B8]">
              {updatedAt ? `Updated ${formatShortDate(updatedAt)}` : "No updates yet"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#1E293B] bg-[#0A0C10] px-4 py-2 text-sm font-medium text-[#F0F4F9] transition group-open:border-[#22D3EE] group-open:text-[#22D3EE]">
              {actionLabel}
            </span>
            <span className="rounded-full border border-[#1E293B] bg-[#0A0C10] px-3 py-2 text-[#94A3B8] transition group-open:text-[#22D3EE]">
              <span className="text-lg leading-none transition-transform group-open:rotate-180">v</span>
            </span>
          </div>
        </div>
      </summary>

      <div className="border-t border-[#1E293B] p-0">
        <div className="p-5">{children}</div>
      </div>
    </details>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#0A0C10] px-3 py-2 text-sm font-medium text-[#F0F4F9] transition hover:border-[#22D3EE] hover:text-[#22D3EE]"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
      <span aria-hidden="true">&rarr;</span>
    </a>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#0A0C10] px-3 py-2 text-sm text-[#94A3B8]">
      <span className="uppercase tracking-[0.25em]">{label}</span>
      <span className="text-[#F0F4F9]">{value}</span>
    </span>
  );
}

function LeadDetailSidebar() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/work", label: "Work" },
    { href: "/leads", label: "Leads" },
    { href: "/reports/sales", label: "Sales reports" }
  ];

  return (
    <aside className="mb-6 hidden lg:float-left lg:mr-6 lg:block lg:w-[240px]">
      <div className="sticky top-8 space-y-4 rounded-3xl border border-[#1E293B] bg-[#11141D] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#22D3EE]">
            Operator sidebar
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#F0F4F9]">Workspace routes</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Fast access to the core CRM routes used in the Stitch reference.
          </p>
        </div>

        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-2xl border border-[#1E293B] bg-[#0A0C10] px-4 py-3 text-sm font-medium text-[#F0F4F9] transition hover:border-[#22D3EE] hover:text-[#22D3EE]"
            >
              <span>{link.label}</span>
              <span aria-hidden="true" className="text-[#94A3B8]">
                &rarr;
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

