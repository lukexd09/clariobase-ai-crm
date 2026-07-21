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
import { requireUser } from "@/lib/auth-context";
import { getI18n } from "@/i18n/server";
import type { Translate } from "@/i18n/types";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";
import { formatDateTimeLocalInput } from "@/i18n/format";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser({ mode: "redirect", returnTo: `/leads/${id}` });
  const { t, formatDate, formatDateTime, formatNumber, formatCurrency } = await getI18n();
  const [lead, activities, miniAuditDrafts, outreachDrafts, offerDrafts] = await Promise.all([
    getLeadById(id),
    getLeadActivities(id),
    getLeadMiniAuditDrafts(id),
    getLeadOutreachDrafts(id),
    getLeadOfferDrafts(id)
  ]);

  if (!lead) notFound();

  const clientOfferDrafts = offerDrafts.map(toOfferDraftClientRecord);
  const recommendation = getNextRecommendedAction({
    miniAuditDrafts,
    outreachDrafts,
    offerDrafts: clientOfferDrafts,
    t
  });
  const nextActionDisplay = lead.nextActionAt ? formatDateTime(lead.nextActionAt) : t("lead.detail.noNextAction");
  const primaryMetadata = [
    lead.city ?? t("lead.detail.noCity"),
    lead.category ?? t("lead.detail.noCategory"),
    [lead.region, lead.country].filter(Boolean).join(", ") || t("lead.detail.noRegionCountry")
  ];
  const sectionLinks = [
    { href: "#lead-controls", label: t("lead.detail.status") },
    { href: "#activity", label: t("lead.detail.activityLog") },
    { href: "#mini-audit", label: t("lead.detail.review") },
    { href: "#outreach", label: t("lead.detail.messagePlan") },
    { href: "#offer", label: t("lead.detail.draft") },
    { href: "#technical-details", label: t("lead.detail.internalDetails") }
  ];

  return (
    <main className="min-h-screen bg-[color:var(--cb-background)] text-[color:var(--cb-foreground)]">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label={t("lead.detail.breadcrumb")} className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--cb-muted-foreground)]">
            <Link
              href="/leads"
              className="font-medium text-[color:var(--cb-foreground)] transition hover:text-[color:var(--cb-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
            >
              {t("leads.title")}
            </Link>
            <span aria-hidden="true" className="text-[color:var(--cb-border)]">
              /
            </span>
            <span className="font-medium text-[color:var(--cb-foreground)]">{lead.businessName}</span>
          </nav>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/work"
              className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-4 py-2 text-sm font-medium text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)] hover:text-[color:var(--cb-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
            >
              {t("lead.detail.openWorkbench")}
            </Link>
          </div>
        </div>

        <header className="mb-4 rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-4 shadow-[var(--cb-shadow-surface)] lg:p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-4">
              <p className="text-sm font-medium text-[color:var(--cb-accent)]">{t("lead.detail.operatorWorkspace")}</p>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--cb-foreground)] sm:text-4xl">
                  {lead.businessName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[color:var(--cb-muted-foreground)]">
                  {primaryMetadata.map((item, index) => (
                    <span key={`${item}-${index}`} className="flex items-center gap-3">
                      {index > 0 ? (
                        <span aria-hidden="true" className="text-[color:var(--cb-border)]">
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
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <HeaderMetric
                  label={t("lead.detail.readiness")}
                  value={lead.scoreLabel ?? formatNumber(lead.scoreTotal)}
                  detail={t("lead.detail.priorityValue", { value: t(getTaxonomyTranslationKey(lead.priority)) })}
                />
                <HeaderMetric
                  label={t("lead.detail.recommendedNextStep")}
                  value={nextActionDisplay}
                  detail={t("lead.detail.localTime")}
                />
                <HeaderMetric
                  label={t("lead.detail.contactPerson")}
                  value={t("lead.detail.noContactPerson")}
                  detail={lead.phone ?? lead.email ?? t("lead.detail.noDirectContact")}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.websiteUrl ? <ExternalLink href={lead.websiteUrl} label={t("lead.detail.website")} /> : null}
                {lead.phone ? <InlineMeta label={t("lead.detail.phone")} value={lead.phone} /> : null}
                {lead.email ? <InlineMeta label={t("lead.detail.email")} value={lead.email} /> : null}
              </div>
            </div>

            <section className="xl:max-w-sm rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]">
              <p className="text-sm font-medium text-[color:var(--cb-accent)]">{t("lead.detail.recommendedNextStep")}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--cb-foreground)]">
                {recommendation.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{recommendation.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={recommendation.primaryHref}
                  className="rounded-full bg-[color:var(--cb-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--cb-accent-foreground)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
                >
                  {recommendation.primaryLabel}
                </Link>
                <Link
                  href={recommendation.secondaryHref}
                  className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-4 py-2 text-sm font-medium text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)] hover:text-[color:var(--cb-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
                >
                  {recommendation.secondaryLabel}
                </Link>
              </div>
            </section>
          </div>
        </header>

        <nav aria-label={t("lead.detail.sections")} className="mb-4 flex flex-wrap gap-2">
          {sectionLinks.map((section) => (
            <Link
              key={section.href}
              href={section.href}
            className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 py-1.5 text-sm font-medium text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)] hover:text-[color:var(--cb-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,400px)]">
          <div className="space-y-4">
            <section className="rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]">
              <div className="flex flex-col gap-2 border-b border-[color:var(--cb-border)] pb-4">
                <h2 className="text-xl font-semibold text-[color:var(--cb-foreground)]">{t("lead.detail.businessContext")}</h2>
                <p className="text-sm text-[color:var(--cb-muted-foreground)]">
                  {t("lead.detail.businessContextDescription")}
                </p>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DefinitionItem
                  label={t("lead.detail.website")}
                  value={
                    lead.websiteUrl ? (
                      <ExternalLink href={lead.websiteUrl} label={lead.websiteUrl} />
                    ) : (
                      t("lead.detail.notProvided")
                    )
                  }
                />
                <DefinitionItem label={t("lead.detail.category")} value={lead.category ?? t("lead.detail.notProvided")} />
                <DefinitionItem label={t("lead.detail.city")} value={lead.city ?? t("lead.detail.notProvided")} />
                <DefinitionItem
                  label={t("lead.detail.regionCountry")}
                  value={[lead.region, lead.country].filter(Boolean).join(", ") || t("lead.detail.notProvided")}
                />
                <DefinitionItem label={t("lead.detail.phone")} value={lead.phone ?? t("lead.detail.notProvided")} />
                <DefinitionItem label={t("lead.detail.email")} value={lead.email ?? t("lead.detail.notProvided")} />
                <DefinitionItem label={t("lead.detail.address")} value={lead.address ?? t("lead.detail.notProvided")} />
                <DefinitionItem
                  label={t("lead.detail.source")}
                  value={
                    lead.source
                      ? lead.sourceRecordId
                        ? `${lead.source} (${lead.sourceRecordId})`
                        : lead.source
                      : t("lead.detail.notProvided")
                  }
                />
                <DefinitionItem label={t("lead.detail.lastReviewed")} value={lead.lastReviewedAt ? formatDateTime(lead.lastReviewedAt) : "-"} />
              </dl>
            </section>

            <section id="lead-artifacts" className="space-y-4">
              <ArtifactPanel
                id="mini-audit"
                label={t("lead.detail.review")}
                title={getArtifactPanelTitle(t("lead.detail.review"), miniAuditDrafts.length, t)}
                description={getMiniAuditPanelDescription(miniAuditDrafts, t)}
                statusBadge={
                  miniAuditDrafts.length > 0 ? (
                    <StatusPill value={getMiniAuditPanelStatus(miniAuditDrafts)} appearance="light" />
                  ) : (
                    <SecondaryBadge>{t("lead.detail.notStarted")}</SecondaryBadge>
                  )
                }
                packageBadge={
                  miniAuditDrafts.length > 0 ? (
                    <StatusPill value={miniAuditDrafts[0].suggestedPackage} appearance="light" />
                  ) : null
                }
                footerText={getArtifactFooter(getMiniAuditPanelUpdatedAt(miniAuditDrafts), t("lead.detail.reviewEmpty"), t, formatDate)}
                actionLabel={getArtifactPanelAction(miniAuditDrafts, t)}
              >
                <MiniAuditDraftSection leadId={lead.id} drafts={miniAuditDrafts} />
              </ArtifactPanel>

              <ArtifactPanel
                id="outreach"
                label={t("lead.detail.messagePlan")}
                title={getArtifactPanelTitle(t("lead.detail.messagePlan"), outreachDrafts.length, t)}
                description={getOutreachPanelDescription(outreachDrafts, t)}
                statusBadge={
                  outreachDrafts.length > 0 ? (
                    <StatusPill value={getOutreachPanelStatus(outreachDrafts)} appearance="light" />
                  ) : (
                    <SecondaryBadge>{t("lead.detail.notStarted")}</SecondaryBadge>
                  )
                }
                packageBadge={null}
                footerText={getArtifactFooter(getOutreachPanelUpdatedAt(outreachDrafts), t("lead.detail.outreachEmpty"), t, formatDate)}
                actionLabel={getArtifactPanelAction(outreachDrafts, t)}
              >
                <OutreachDraftSection
                  leadId={lead.id}
                  drafts={outreachDrafts}
                  miniAuditDrafts={miniAuditDrafts}
                />
              </ArtifactPanel>

              <ArtifactPanel
                id="offer"
                label={t("lead.detail.draftPreparation")}
                title={getOfferPanelTitle(clientOfferDrafts, t)}
                description={getOfferPanelDescription(clientOfferDrafts, t, formatCurrency)}
                statusBadge={
                  clientOfferDrafts.length > 0 ? (
                    <StatusPill value={getOfferPanelStatus(clientOfferDrafts)} appearance="light" />
                  ) : (
                    <SecondaryBadge>{t("lead.detail.notStarted")}</SecondaryBadge>
                  )
                }
                packageBadge={
                  clientOfferDrafts.length > 0 ? (
                    <StatusPill value={clientOfferDrafts[0].packageFit} appearance="light" />
                  ) : null
                }
                footerText={getArtifactFooter(getOfferPanelUpdatedAt(clientOfferDrafts), t("lead.detail.offerEmpty"), t, formatDate)}
                actionLabel={getArtifactPanelAction(clientOfferDrafts, t)}
              >
                <OfferDraftSection leadId={lead.id} drafts={clientOfferDrafts} />
              </ArtifactPanel>
            </section>

            <details
              id="technical-details"
              className="rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] shadow-[var(--cb-shadow-surface)]"
            >
              <summary className="cursor-pointer list-none rounded-[var(--cb-radius-xl)] px-5 py-4 transition hover:bg-[color:var(--cb-elevated-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--cb-foreground)]">{t("lead.detail.showTechnical")}</p>
                    <p className="mt-1 text-sm text-[color:var(--cb-muted-foreground)]">
                      {t("lead.detail.technicalDescription")}
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 py-1 text-sm font-medium text-[color:var(--cb-foreground)]">
                    {t("lead.detail.technicalMetadata")}
                  </span>
                </div>
              </summary>

              <div className="border-t border-[color:var(--cb-border)] px-5 py-4">
                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <DefinitionItem label={t("lead.detail.source")} value={lead.source ?? t("lead.detail.notProvided")} subtle />
                  <DefinitionItem label={t("lead.detail.sourceRecordId")} value={lead.sourceRecordId ?? t("lead.detail.notProvided")} subtle />
                  <DefinitionItem label={t("lead.detail.googlePlaceId")} value={lead.googlePlaceId ?? t("lead.detail.notProvided")} subtle />
                  <DefinitionItem label={t("lead.detail.createdAt")} value={formatDateTime(lead.createdAt)} subtle />
                  <DefinitionItem label={t("lead.detail.updatedAt")} value={formatDateTime(lead.updatedAt)} subtle />
                  <DefinitionItem label={t("lead.detail.lastImportedAt")} value={lead.lastImportedAt ? formatDateTime(lead.lastImportedAt) : "-"} subtle />
                  <DefinitionItem label={t("lead.detail.archivedAt")} value={lead.archivedAt ? formatDateTime(lead.archivedAt) : "-"} subtle />
                </dl>
              </div>
            </details>
          </div>

          <aside className="space-y-4">
            <section
              id="lead-controls"
              className="rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]"
            >
              <div className="border-b border-[color:var(--cb-border)] pb-4">
                <p className="text-sm font-medium text-[color:var(--cb-accent)]">{t("lead.detail.status")}</p>
                <h2 className="mt-2 text-xl font-semibold text-[color:var(--cb-foreground)]">{t("lead.detail.statusUpdate")}</h2>
                <p className="mt-1 text-sm text-[color:var(--cb-muted-foreground)]">
                  {t("lead.detail.statusDescription")}
                </p>
              </div>

              <div className="mt-4">
                <LeadUpdateForm
                  leadId={lead.id}
                  leadStatus={lead.leadStatus}
                  priority={lead.priority}
                  packageFit={lead.packageFit}
                  nextActionAt={formatDateTimeLocalInput(lead.nextActionAt)}
                  nextActionDisplay={nextActionDisplay}
                />
              </div>
            </section>

            <section
              id="activity"
              className="space-y-4 rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]"
            >
              <div className="border-b border-[color:var(--cb-border)] pb-4">
                <p className="text-sm font-medium text-[color:var(--cb-accent)]">{t("lead.detail.activityLog")}</p>
                <h2 className="mt-2 text-xl font-semibold text-[color:var(--cb-foreground)]">
                  {t("lead.detail.activityHeading")}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--cb-muted-foreground)]">
                  {t("activity.bodyHint")}
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
  offerDrafts,
  t
}: {
  miniAuditDrafts: MiniAuditDraftRecord[];
  outreachDrafts: OutreachDraftRecord[];
  offerDrafts: OfferDraftClientRecord[];
  t: Translate;
}) {
  const latestOfferDraft = offerDrafts[0];
  const hasActiveOffer = offerDrafts.some(
    (draft) => !["ACCEPTED", "REJECTED", "ARCHIVED"].includes(draft.status)
  );

  if (miniAuditDrafts.length === 0) {
    return {
      title: t("lead.detail.recommendation.prepareReview"),
      description: t("lead.detail.recommendation.prepareReviewDescription"),
      primaryLabel: t("lead.detail.recommendation.prepareReview"),
      primaryHref: "#mini-audit",
      secondaryLabel: t("lead.detail.recommendation.openActivity"),
      secondaryHref: "#activity"
    };
  }

  if (outreachDrafts.length === 0) {
    return {
      title: t("lead.detail.recommendation.prepareMessage"),
      description: t("lead.detail.recommendation.prepareMessageDescription"),
      primaryLabel: t("lead.detail.recommendation.prepareMessage"),
      primaryHref: "#outreach",
      secondaryLabel: t("lead.detail.recommendation.reviewStatus"),
      secondaryHref: "#lead-controls"
    };
  }

  if (offerDrafts.length === 0) {
    return {
      title: t("lead.detail.recommendation.prepareDraft"),
      description: t("lead.detail.recommendation.prepareDraftDescription"),
      primaryLabel: t("lead.detail.recommendation.prepareDraft"),
      primaryHref: "#offer",
      secondaryLabel: t("lead.detail.recommendation.openActivity"),
      secondaryHref: "#activity"
    };
  }

  if (hasActiveOffer && latestOfferDraft) {
    return {
      title: t("lead.detail.recommendation.reviewDraft"),
      description: t("lead.detail.recommendation.reviewDraftDescription", {
        status: t(getTaxonomyTranslationKey(latestOfferDraft.status))
      }),
      primaryLabel: t("lead.detail.recommendation.reviewDraft"),
      primaryHref: "#offer",
      secondaryLabel: t("lead.detail.recommendation.openActivity"),
      secondaryHref: "#activity"
    };
  }

  return {
    title: t("lead.detail.recommendation.logOrUpdate"),
    description: t("lead.detail.recommendation.logOrUpdateDescription"),
    primaryLabel: t("lead.detail.recommendation.logActivity"),
    primaryHref: "#activity",
    secondaryLabel: t("lead.detail.recommendation.updateLead"),
    secondaryHref: "#lead-controls"
  };
}

function getArtifactPanelTitle(name: string, count: number, t: Translate) {
  return count === 0
    ? t("lead.detail.artifactNotStarted", { name })
    : t("lead.detail.artifactReady", { name });
}

function getMiniAuditPanelStatus(drafts: Array<{ status: string }>) {
  return drafts[0].status as MiniAuditStatusValue;
}

function getMiniAuditPanelDescription(drafts: MiniAuditDraftRecord[], t: Translate) {
  const latest = drafts[0];
  if (!latest) {
    return t("lead.detail.reviewDescription");
  }

  return latest.recommendation ?? latest.problem1 ?? t("lead.detail.reviewReady");
}

function getMiniAuditPanelUpdatedAt(drafts: MiniAuditDraftRecord[]) {
  return drafts[0]?.updatedAt ?? null;
}

function getOutreachPanelStatus(drafts: OutreachDraftRecord[]) {
  return drafts[0].status as OutreachDraftStatusValue;
}

function getOutreachPanelDescription(drafts: OutreachDraftRecord[], t: Translate) {
  const latest = drafts[0];
  if (!latest) {
    return t("lead.detail.outreachDescription");
  }

  return latest.subject ?? latest.openingHook ?? latest.message ?? t("lead.detail.outreachReady");
}

function getOutreachPanelUpdatedAt(drafts: OutreachDraftRecord[]) {
  return drafts[0]?.updatedAt ?? null;
}

function getOfferPanelTitle(drafts: OfferDraftClientRecord[], t: Translate) {
  const latest = drafts[0];
  return latest ? latest.title : t("lead.detail.draftNotStarted");
}

function getOfferPanelDescription(
  drafts: OfferDraftClientRecord[],
  t: Translate,
  formatCurrency: (value: number, currency: string) => string
) {
  const latest = drafts[0];
  if (!latest) {
    return t("lead.detail.offerDescription");
  }

  const price = latest.priceNet
    ? formatCurrency(Number(latest.priceNet), latest.currency)
    : t("lead.detail.noPrice");
  return [latest.title, price].filter(Boolean).join(" | ");
}

function getOfferPanelStatus(drafts: OfferDraftClientRecord[]) {
  return drafts[0].status as OfferDraftStatusValue;
}

function getOfferPanelUpdatedAt(drafts: OfferDraftClientRecord[]) {
  return drafts[0]?.updatedAt ?? null;
}

function getArtifactPanelAction(drafts: unknown[], t: Translate) {
  return drafts.length === 0 ? t("lead.detail.createFirstDraft") : t("lead.detail.openEditor");
}

function getArtifactFooter(
  updatedAt: Date | null,
  emptyMessage: string,
  t: Translate,
  formatDate: (value: Date) => string
) {
  return updatedAt ? t("lead.detail.updated", { date: formatDate(updatedAt) }) : emptyMessage;
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
    <div className="rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--cb-muted-foreground)]">{label}</p>
      <p className="mt-3 text-lg font-semibold text-[color:var(--cb-foreground)]">{value}</p>
      <p className="mt-1 text-sm text-[color:var(--cb-muted-foreground)]">{detail}</p>
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
    <div className={`rounded-[var(--cb-radius-lg)] border p-4 ${subtle ? "border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)]" : "border-[color:var(--cb-border)] bg-[color:var(--cb-surface)]"}`}>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--cb-muted-foreground)]">{label}</dt>
      <dd className="mt-2 break-words text-sm leading-6 text-[color:var(--cb-foreground)]">{value}</dd>
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
  footerText,
  actionLabel,
  children
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  statusBadge: ReactNode;
  packageBadge: ReactNode | null;
  footerText: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <details id={id} className="group rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] shadow-[var(--cb-shadow-surface)]">
      <summary className="list-none cursor-pointer rounded-[var(--cb-radius-xl)] px-5 py-4 transition hover:bg-[color:var(--cb-elevated-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[color:var(--cb-accent)]">{label}</p>
              {statusBadge}
              {packageBadge}
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-[color:var(--cb-foreground)]">{title}</h3>
            <p className="max-w-3xl text-sm leading-6 text-[color:var(--cb-muted-foreground)]">{description}</p>
            <p className="text-xs text-[color:var(--cb-muted-foreground)]">
              {footerText}
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 py-1 text-sm font-medium text-[color:var(--cb-foreground)]">
            {actionLabel}
            <span aria-hidden="true" className="text-base transition-transform group-open:rotate-180">
              v
            </span>
          </span>
        </div>
      </summary>

      <div className="border-t border-[color:var(--cb-border)] p-5">{children}</div>
    </details>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 py-2 text-sm font-medium text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)] hover:text-[color:var(--cb-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
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
    <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 py-2 text-sm text-[color:var(--cb-muted-foreground)]">
      <span className="font-semibold uppercase tracking-[0.2em] text-[color:var(--cb-muted-foreground)]">{label}</span>
      <span className="text-[color:var(--cb-foreground)]">{value}</span>
    </span>
  );
}

function SecondaryBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-2.5 py-1 text-xs font-medium text-[color:var(--cb-foreground)]">
      {children}
    </span>
  );
}
