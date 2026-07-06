import Link from "next/link";
import { type ReactNode } from "react";
import { notFound } from "next/navigation";
import { ActivityForm, ActivityTimeline } from "@/components/activity-form";
import { LeadUpdateForm } from "@/components/lead-update-form";
import { StatusPill } from "@/components/lead-status-pill";
import { MiniAuditDraftSection } from "@/components/mini-audit-draft-form";
import { OfferDraftSection } from "@/components/offer-draft-form";
import { OutreachDraftSection } from "@/components/outreach-draft-form";
import { getLeadActivities } from "@/lib/activities";
import { getLeadById } from "@/lib/leads";
import {
  type MiniAuditStatusValue,
  type OfferDraftStatusValue,
  type OutreachDraftStatusValue
} from "@/lib/lead-values";
import { getLeadMiniAuditDrafts, type MiniAuditDraftRecord } from "@/lib/mini-audits";
import { getLeadOfferDrafts, toOfferDraftClientRecord } from "@/lib/offer-drafts";
import { getLeadOutreachDrafts, type OutreachDraftRecord } from "@/lib/outreach-drafts";
import { type OfferDraftClientRecord } from "@/lib/offer-drafts";

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
  const nextActionDisplay = lead.nextActionAt ? formatDate(lead.nextActionAt) : "No next action set";
  const primaryMetadata = [
    lead.city ?? "No city",
    lead.category ?? "No category",
    [lead.region, lead.country].filter(Boolean).join(", ") || "No region or country"
  ];
  const sectionLinks = [
    { href: "#lead-controls", label: "Lead controls" },
    { href: "#activity", label: "Activity log" },
    { href: "#mini-audit", label: "Mini-audit" },
    { href: "#outreach", label: "Outreach" },
    { href: "#offer", label: "Offer" },
    { href: "#technical-details", label: "Technical details" }
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Lead breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[#475569]">
            <Link
              href="/leads"
              className="font-medium text-[#334155] transition hover:text-[#006194] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Leads
            </Link>
            <span aria-hidden="true" className="text-[#CBD5E1]">
              /
            </span>
            <span className="font-medium text-[#0F172A]">{lead.businessName}</span>
          </nav>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/work"
              className="rounded-full border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#334155] transition hover:border-[#006194] hover:text-[#006194] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Open workbench
            </Link>
          </div>
        </div>

        <header className="mb-4 rounded-[28px] border border-[#CBD5E1] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-4">
              <p className="text-sm font-medium text-[#006194]">Lead workspace</p>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A] sm:text-4xl">
                  {lead.businessName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#475569]">
                  {primaryMetadata.map((item, index) => (
                    <span key={`${item}-${index}`} className="flex items-center gap-3">
                      {index > 0 ? (
                        <span aria-hidden="true" className="text-[#CBD5E1]">
                          |
                        </span>
                      ) : null}
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill value={lead.leadStatus} appearance="light" />
                <StatusPill value={lead.priority} appearance="light" />
                <StatusPill value={lead.packageFit} appearance="light" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <HeaderMetric
                  label="Lead score"
                  value={String(lead.scoreTotal)}
                  detail={lead.scoreLabel ?? "No score label"}
                />
                <HeaderMetric
                  label="Next action"
                  value={nextActionDisplay}
                  detail="Shown in local operator time."
                />
                <HeaderMetric
                  label="Customer"
                  value={lead.customerId}
                  detail={lead.phone ?? lead.email ?? "No direct contact saved"}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.websiteUrl ? <ExternalLink href={lead.websiteUrl} label="Website" /> : null}
                {lead.phone ? <InlineMeta label="Phone" value={lead.phone} /> : null}
                {lead.email ? <InlineMeta label="Email" value={lead.email} /> : null}
              </div>
            </div>

            <section className="xl:max-w-sm rounded-[24px] border border-[#B7C6D6] bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF3F8_100%)] p-4">
              <p className="text-sm font-medium text-[#006194]">Next recommended action</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0F172A]">
                {recommendation.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{recommendation.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={recommendation.primaryHref}
                  className="rounded-full bg-[#006194] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004D70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {recommendation.primaryLabel}
                </Link>
                <Link
                  href={recommendation.secondaryHref}
                  className="rounded-full border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#334155] transition hover:border-[#006194] hover:text-[#006194] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {recommendation.secondaryLabel}
                </Link>
              </div>
            </section>
          </div>
        </header>

        <nav aria-label="Lead workspace sections" className="mb-4 flex flex-wrap gap-2">
          {sectionLinks.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm font-medium text-[#334155] transition hover:border-[#006194] hover:text-[#006194] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,400px)]">
          <div className="space-y-4">
            <section className="rounded-[24px] border border-[#CBD5E1] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-2 border-b border-[#E2E8F0] pb-4">
                <h2 className="text-xl font-semibold text-[#0F172A]">Business context</h2>
                <p className="text-sm text-[#475569]">
                  A compact view of the operator-facing context without repeating status or package data.
                </p>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DefinitionItem
                  label="Website"
                  value={
                    lead.websiteUrl ? (
                      <ExternalLink href={lead.websiteUrl} label={lead.websiteUrl} />
                    ) : (
                      "Not provided"
                    )
                  }
                />
                <DefinitionItem label="Category" value={lead.category ?? "Not provided"} />
                <DefinitionItem label="City" value={lead.city ?? "Not provided"} />
                <DefinitionItem
                  label="Region and country"
                  value={[lead.region, lead.country].filter(Boolean).join(", ") || "Not provided"}
                />
                <DefinitionItem label="Phone" value={lead.phone ?? "Not provided"} />
                <DefinitionItem label="Email" value={lead.email ?? "Not provided"} />
                <DefinitionItem label="Address" value={lead.address ?? "Not provided"} />
                <DefinitionItem
                  label="Source"
                  value={
                    lead.source
                      ? lead.sourceRecordId
                        ? `${lead.source} (${lead.sourceRecordId})`
                        : lead.source
                      : "Not provided"
                  }
                />
                <DefinitionItem label="Last reviewed" value={formatDate(lead.lastReviewedAt)} />
              </dl>
            </section>

            <section id="lead-artifacts" className="space-y-4">
              <ArtifactPanel
                id="mini-audit"
                label="Mini-audit"
                title={getArtifactPanelTitle("Mini-audit", miniAuditDrafts.length)}
                description={getMiniAuditPanelDescription(miniAuditDrafts)}
                statusBadge={
                  miniAuditDrafts.length > 0 ? (
                    <StatusPill value={getMiniAuditPanelStatus(miniAuditDrafts)} appearance="light" />
                  ) : (
                    <SecondaryBadge>Not started</SecondaryBadge>
                  )
                }
                packageBadge={
                  miniAuditPanelPackage ? <StatusPill value={miniAuditPanelPackage} appearance="light" /> : null
                }
                updatedAt={getMiniAuditPanelUpdatedAt(miniAuditDrafts)}
                emptyMessage="Create the first draft when this lead is ready."
                actionLabel={getMiniAuditPanelAction(miniAuditDrafts)}
              >
                <MiniAuditDraftSection leadId={lead.id} drafts={miniAuditDrafts} />
              </ArtifactPanel>

              <ArtifactPanel
                id="outreach"
                label="Outreach sequence"
                title={getArtifactPanelTitle("Outreach sequence", outreachDrafts.length)}
                description={getOutreachPanelDescription(outreachDrafts)}
                statusBadge={
                  outreachDrafts.length > 0 ? (
                    <StatusPill value={getOutreachPanelStatus(outreachDrafts)} appearance="light" />
                  ) : (
                    <SecondaryBadge>Not started</SecondaryBadge>
                  )
                }
                packageBadge={null}
                updatedAt={getOutreachPanelUpdatedAt(outreachDrafts)}
                emptyMessage="Create the first draft when outreach is ready."
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
                statusBadge={
                  clientOfferDrafts.length > 0 ? (
                    <StatusPill value={getOfferPanelStatus(clientOfferDrafts)} appearance="light" />
                  ) : (
                    <SecondaryBadge>Not started</SecondaryBadge>
                  )
                }
                packageBadge={
                  offerPanelPackage ? <StatusPill value={offerPanelPackage} appearance="light" /> : null
                }
                updatedAt={getOfferPanelUpdatedAt(clientOfferDrafts)}
                emptyMessage="Create the first commercial draft when the lead is ready."
                actionLabel={getOfferPanelAction(clientOfferDrafts)}
              >
                <OfferDraftSection leadId={lead.id} drafts={clientOfferDrafts} />
              </ArtifactPanel>
            </section>

            <details id="technical-details" className="rounded-[24px] border border-[#CBD5E1] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <summary className="cursor-pointer list-none rounded-[24px] px-5 py-4 transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">Show technical details</p>
                    <p className="mt-1 text-sm text-[#475569]">
                      Source identifiers and audit timestamps stay available here when needed.
                    </p>
                  </div>
                  <span className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-sm font-medium text-[#334155]">
                    Technical metadata
                  </span>
                </div>
              </summary>

              <div className="border-t border-[#E2E8F0] px-5 py-4">
                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <DefinitionItem label="Customer ID" value={lead.customerId} subtle />
                  <DefinitionItem label="Source" value={lead.source ?? "Not provided"} subtle />
                  <DefinitionItem label="Source record ID" value={lead.sourceRecordId ?? "Not provided"} subtle />
                  <DefinitionItem label="Google Place ID" value={lead.googlePlaceId ?? "Not provided"} subtle />
                  <DefinitionItem label="Created at" value={formatDate(lead.createdAt)} subtle />
                  <DefinitionItem label="Updated at" value={formatDate(lead.updatedAt)} subtle />
                  <DefinitionItem label="Last imported at" value={formatDate(lead.lastImportedAt)} subtle />
                  <DefinitionItem label="Archived at" value={formatDate(lead.archivedAt)} subtle />
                </dl>
              </div>
            </details>
          </div>

          <aside className="space-y-4">
            <section id="lead-controls" className="rounded-[24px] border border-[#CBD5E1] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="border-b border-[#E2E8F0] pb-4">
                <p className="text-sm font-medium text-[#006194]">Lead controls</p>
                <h2 className="mt-2 text-xl font-semibold text-[#0F172A]">Operational update</h2>
                <p className="mt-1 text-sm text-[#475569]">
                  Keep the lead state, priority, package fit, and next action aligned with the latest work.
                </p>
              </div>

              <div className="mt-4">
                <LeadUpdateForm
                  leadId={lead.id}
                  leadStatus={lead.leadStatus}
                  priority={lead.priority}
                  packageFit={lead.packageFit}
                  nextActionAt={asLocalDateTimeValue(lead.nextActionAt)}
                  nextActionDisplay={nextActionDisplay}
                />
              </div>
            </section>

            <section id="activity" className="space-y-4 rounded-[24px] border border-[#CBD5E1] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="border-b border-[#E2E8F0] pb-4">
                <p className="text-sm font-medium text-[#006194]">Activity log</p>
                <h2 className="mt-2 text-xl font-semibold text-[#0F172A]">
                  Notes, calls, messages, and updates
                </h2>
                <p className="mt-1 text-sm text-[#475569]">
                  Activity stays easy to log without narrowing the fields or clipping the date input.
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
  return drafts[0].status as MiniAuditStatusValue;
}

function getMiniAuditPanelPackage(drafts: MiniAuditDraftRecord[]) {
  return drafts[0]?.suggestedPackage ?? null;
}

function getMiniAuditPanelDescription(drafts: MiniAuditDraftRecord[]) {
  const latest = drafts[0];
  if (!latest) {
    return "Capture the first diagnosis, suggested package fit, and a draft message angle.";
  }

  return latest.recommendation ?? latest.problem1 ?? "Compact diagnosis ready for review.";
}

function getMiniAuditPanelUpdatedAt(drafts: MiniAuditDraftRecord[]) {
  return drafts[0]?.updatedAt ?? null;
}

function getMiniAuditPanelAction(drafts: MiniAuditDraftRecord[]) {
  return drafts.length === 0 ? "Create first draft" : "Open editor";
}

function getOutreachPanelStatus(drafts: OutreachDraftRecord[]) {
  return drafts[0].status as OutreachDraftStatusValue;
}

function getOutreachPanelDescription(drafts: OutreachDraftRecord[]) {
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
  return drafts.length === 0 ? "Create first draft" : "Open editor";
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
  return drafts[0].status as OfferDraftStatusValue;
}

function getOfferPanelPackage(drafts: OfferDraftClientRecord[]) {
  return drafts[0]?.packageFit ?? null;
}

function getOfferPanelUpdatedAt(drafts: OfferDraftClientRecord[]) {
  return drafts[0]?.updatedAt ?? null;
}

function getOfferPanelAction(drafts: OfferDraftClientRecord[]) {
  return drafts.length === 0 ? "Create first draft" : "Open editor";
}

function HeaderMetric({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748B]">{label}</p>
      <p className="mt-3 text-lg font-semibold text-[#0F172A]">{value}</p>
      <p className="mt-1 text-sm text-[#475569]">{detail}</p>
    </div>
  );
}

function DefinitionItem({
  label,
  value,
  subtle = false
}: {
  label: string;
  value: ReactNode;
  subtle?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${subtle ? "border-[#CBD5E1] bg-[#F8FAFC]" : "border-[#CBD5E1] bg-white"}`}>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748B]">{label}</dt>
      <dd className="mt-2 break-words text-sm leading-6 text-[#0F172A]">{value}</dd>
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
  emptyMessage,
  actionLabel,
  children
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  statusBadge: ReactNode;
  packageBadge: ReactNode | null;
  updatedAt: Date | null;
  emptyMessage: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <details id={id} className="group rounded-2xl border border-[#CBD5E1] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <summary className="list-none cursor-pointer rounded-2xl px-5 py-4 transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[#006194]">{label}</p>
              {statusBadge}
              {packageBadge}
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-[#0F172A]">{title}</h3>
            <p className="max-w-3xl text-sm leading-6 text-[#475569]">{description}</p>
            <p className="text-xs text-[#64748B]">
              {updatedAt ? `Updated ${formatShortDate(updatedAt)}` : emptyMessage}
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-sm font-medium text-[#334155]">
            {actionLabel}
            <span aria-hidden="true" className="text-base transition-transform group-open:rotate-180">
              v
            </span>
          </span>
        </div>
      </summary>

      <div className="border-t border-[#E2E8F0] p-5">{children}</div>
    </details>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-medium text-[#334155] transition hover:border-[#006194] hover:text-[#006194] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
      <span aria-hidden="true">&rarr;</span>
    </a>
  );
}

function InlineMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm text-[#475569]">
      <span className="font-semibold uppercase tracking-[0.2em] text-[#64748B]">{label}</span>
      <span className="text-[#0F172A]">{value}</span>
    </span>
  );
}

function SecondaryBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#334155]">
      {children}
    </span>
  );
}
