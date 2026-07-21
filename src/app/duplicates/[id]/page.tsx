import { type ReactNode } from "react";
import { notFound } from "next/navigation";
import { DuplicateCandidateStatus } from "@/generated/prisma/client";
import { updateDuplicateCandidateAction } from "@/app/duplicates/actions";
import { Button, ButtonLink, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { ConfidenceBadge, DataQualityPageHeader, DataQualityStatusBadge, TechnicalDisclosure } from "@/components/data-quality-primitives";
import { getDuplicateCandidateById } from "@/lib/duplicates";
import { requireUser } from "@/lib/auth-context";
import { getI18n } from "@/i18n/server";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";
import type { Translate } from "@/i18n/types";
import { getDuplicateNoticeTranslationKey } from "@/lib/duplicate-notices";
import { getDuplicateSignalLabelTranslationKey } from "@/lib/duplicate-reasons";

export const dynamic = "force-dynamic";

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getConfidenceMeta(score: number, t: Translate) {
  if (score >= 95) {
    return {
      label: t("duplicates.confidence.veryHigh"),
      detail: t("duplicates.confidence.veryHighDetail"),
      tone: "success" as const
    };
  }

  if (score >= 85) {
    return {
      label: t("duplicates.confidence.high"),
      detail: t("duplicates.confidence.highDetail"),
      tone: "information" as const
    };
  }

  return {
    label: t("duplicates.confidence.review"),
    detail: t("duplicates.confidence.reviewDetail"),
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

function getComparisonNote(state: "match" | "difference" | "missing", t: Translate) {
  if (state === "match") return t("duplicates.matchingField");
  if (state === "difference") return t("duplicates.differentField");
  return t("duplicates.missingBoth");
}

function renderReasons(reasons: unknown, t: Translate, formatNumber: (value: number) => string) {
  if (!Array.isArray(reasons) || reasons.length === 0) return "-";

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {reasons.map((reason, index) => {
        if (!reason || typeof reason !== "object") return null;
        const entry = reason as { label?: string; value?: string; score?: number; signal?: string };
        const signalLabelKey = getDuplicateSignalLabelTranslationKey(entry.signal);

        return (
          <li
            key={`${entry.signal ?? "reason"}-${index}`}
            className="rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-3"
          >
            <div className="text-sm font-medium text-[color:var(--cb-foreground)]">{signalLabelKey ? t(signalLabelKey) : entry.label ?? t("duplicates.signalFallback")}</div>
            <div className="mt-1 break-words text-sm text-[color:var(--cb-muted-foreground)]">{entry.value ?? "-"}</div>
            <div className="mt-2 text-xs text-[color:var(--cb-muted-foreground)]">{t("duplicates.signalStrength")}: {entry.score === undefined ? "-" : formatNumber(entry.score)}</div>
          </li>
        );
      })}
    </ul>
  );
}

function ComparisonLegend({ t }: { t: Translate }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-[color:var(--cb-muted-foreground)]">
      <span className="rounded-full border border-[color:var(--cb-success)]/25 bg-[color:var(--cb-success)]/10 px-2.5 py-1 text-[color:var(--cb-success-ink)]">
        {t("duplicates.matchingField")}
      </span>
      <span className="rounded-full border border-[color:var(--cb-warning)]/25 bg-[color:var(--cb-warning)]/10 px-2.5 py-1 text-[color:var(--cb-warning-ink)]">
        {t("duplicates.differentField")}
      </span>
      <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-2.5 py-1 text-[color:var(--cb-foreground)]">
        {t("duplicates.missingBoth")}
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
  rightDisplay,
  t
}: {
  label: string;
  leftValue: string | null | undefined;
  rightValue: string | null | undefined;
  leftDisplay: ReactNode;
  rightDisplay: ReactNode;
  t: Translate;
}) {
  const state = getComparisonState(leftValue, rightValue);

  return (
    <tr className="align-top">
      <th scope="row" className="px-4 py-4 text-left">
        <div className="text-sm font-medium text-[color:var(--cb-foreground)]">{label}</div>
        <div className="mt-1 text-xs text-[color:var(--cb-muted-foreground)]">{getComparisonNote(state, t)}</div>
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

function LinkOrText({ href, fallback }: { href: string | null | undefined; fallback: string }) {
  return href ? <ExternalLink href={href} /> : fallback;
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
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ noticeCode?: string; tone?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  await requireUser({ mode: "redirect", returnTo: `/duplicates/${id}` });
  const { t, formatDateTime, formatNumber } = await getI18n();
  const candidate = await getDuplicateCandidateById(id);

  if (!candidate) notFound();

  const confidence = getConfidenceMeta(candidate.score, t);
  const missing = t("duplicates.notProvided");

  return (
    <div className="space-y-4">
      <ButtonLink href="/duplicates">&larr; {t("duplicates.back")}</ButtonLink>

      {query.noticeCode ? (
        <div role={query.tone === "success" ? "status" : "alert"} className="rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-4 py-3 text-sm text-[color:var(--cb-foreground)]">
          {t(getDuplicateNoticeTranslationKey(query.noticeCode))}
        </div>
      ) : null}

      <DataQualityPageHeader
        eyebrow={t("duplicates.eyebrow")}
        title={t("duplicates.pairTitle", { left: candidate.leadA.businessName, right: candidate.leadB.businessName })}
        description={t("duplicates.detailDescription")}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceBadge label={confidence.label} score={formatNumber(candidate.score)} scoreLabel={t("duplicates.score")} tone={confidence.tone} detail={confidence.detail} />
            <DataQualityStatusBadge
              label={t(getTaxonomyTranslationKey(candidate.status))}
              tone={candidate.status === "OPEN" ? "information" : candidate.status === "NEEDS_REVIEW" ? "warning" : candidate.status === "DISMISSED" ? "neutral" : "success"}
            />
          </div>
        }
      />

      <section className="rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]">
        <h2 className="text-lg font-semibold text-[color:var(--cb-foreground)]">{t("duplicates.reasons")}</h2>
        <p className="mt-2 text-sm text-[color:var(--cb-muted-foreground)]">
          {t("duplicates.reasonsDescription")}
        </p>
        <div className="mt-4">{renderReasons(candidate.reasons, t, formatNumber)}</div>
      </section>

      <section className="rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--cb-foreground)]">{t("duplicates.comparison")}</h2>
              <p className="mt-2 text-sm text-[color:var(--cb-muted-foreground)]">
                {t("duplicates.comparisonDescription")}
              </p>
          </div>
          <ComparisonLegend t={t} />
        </div>

        <TableSurface aria-label={t("duplicates.comparisonAria")} className="mt-4">
          <Table className="min-w-[980px]">
            <caption className="sr-only">{t("duplicates.comparisonCaption")}</caption>
            <TableHead>
              <tr>
                <TableHeadCell scope="col">{t("duplicates.field")}</TableHeadCell>
                <TableHeadCell scope="col">{candidate.leadA.businessName}</TableHeadCell>
                <TableHeadCell scope="col">{candidate.leadB.businessName}</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              <ComparisonRow
                label={t("duplicates.businessName")}
                t={t}
                leftValue={candidate.leadA.businessName}
                rightValue={candidate.leadB.businessName}
                leftDisplay={candidate.leadA.businessName}
                rightDisplay={candidate.leadB.businessName}
              />
              <ComparisonRow t={t} label={t("duplicates.city")} leftValue={candidate.leadA.city} rightValue={candidate.leadB.city} leftDisplay={candidate.leadA.city ?? missing} rightDisplay={candidate.leadB.city ?? missing} />
              <ComparisonRow t={t} label={t("duplicates.category")} leftValue={candidate.leadA.category} rightValue={candidate.leadB.category} leftDisplay={candidate.leadA.category ?? missing} rightDisplay={candidate.leadB.category ?? missing} />
              <ComparisonRow t={t} label={t("duplicates.phone")} leftValue={candidate.leadA.phone} rightValue={candidate.leadB.phone} leftDisplay={candidate.leadA.phone ?? missing} rightDisplay={candidate.leadB.phone ?? missing} />
              <ComparisonRow t={t} label={t("duplicates.email")} leftValue={candidate.leadA.email} rightValue={candidate.leadB.email} leftDisplay={candidate.leadA.email ?? missing} rightDisplay={candidate.leadB.email ?? missing} />
              <ComparisonRow t={t} label={t("duplicates.website")} leftValue={candidate.leadA.websiteUrl} rightValue={candidate.leadB.websiteUrl} leftDisplay={<LinkOrText href={candidate.leadA.websiteUrl} fallback={missing} />} rightDisplay={<LinkOrText href={candidate.leadB.websiteUrl} fallback={missing} />} />
              <ComparisonRow t={t} label="Instagram" leftValue={candidate.leadA.instagramUrl} rightValue={candidate.leadB.instagramUrl} leftDisplay={<LinkOrText href={candidate.leadA.instagramUrl} fallback={missing} />} rightDisplay={<LinkOrText href={candidate.leadB.instagramUrl} fallback={missing} />} />
              <ComparisonRow t={t} label="Facebook" leftValue={candidate.leadA.facebookUrl} rightValue={candidate.leadB.facebookUrl} leftDisplay={<LinkOrText href={candidate.leadA.facebookUrl} fallback={missing} />} rightDisplay={<LinkOrText href={candidate.leadB.facebookUrl} fallback={missing} />} />
            </TableBody>
          </Table>
        </TableSurface>

        <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href={`/leads/${candidate.leadA.id}`} aria-label={t("duplicates.openLeadAria", { name: candidate.leadA.businessName })}>
              {t("duplicates.openLead", { name: candidate.leadA.businessName })}
            </ButtonLink>
            <ButtonLink href={`/leads/${candidate.leadB.id}`} aria-label={t("duplicates.openLeadAria", { name: candidate.leadB.businessName })}>
              {t("duplicates.openLead", { name: candidate.leadB.businessName })}
            </ButtonLink>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <TechnicalDisclosure title={t("duplicates.technicalFor", { name: candidate.leadA.businessName })}>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label={t("duplicates.customerId")} value={candidate.leadA.customerId} />
            <Field label={t("lead.detail.googlePlaceId")} value={candidate.leadA.googlePlaceId ?? missing} />
            <Field label={t("duplicates.source")} value={candidate.leadA.source ?? missing} />
            <Field label={t("duplicates.sourceRecordId")} value={candidate.leadA.sourceRecordId ?? missing} />
          </dl>
        </TechnicalDisclosure>
        <TechnicalDisclosure title={t("duplicates.technicalFor", { name: candidate.leadB.businessName })}>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label={t("duplicates.customerId")} value={candidate.leadB.customerId} />
            <Field label={t("lead.detail.googlePlaceId")} value={candidate.leadB.googlePlaceId ?? missing} />
            <Field label={t("duplicates.source")} value={candidate.leadB.source ?? missing} />
            <Field label={t("duplicates.sourceRecordId")} value={candidate.leadB.sourceRecordId ?? missing} />
          </dl>
        </TechnicalDisclosure>
      </div>

      <section className="rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-5 shadow-[var(--cb-shadow-surface)]">
        <h2 className="text-lg font-semibold text-[color:var(--cb-foreground)]">{t("duplicates.reviewMetadata")}</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-3">
          <Field
            label={t("duplicates.candidateStatus")}
            value={
              <DataQualityStatusBadge
                label={t(getTaxonomyTranslationKey(candidate.status))}
                tone={candidate.status === "OPEN" ? "information" : candidate.status === "NEEDS_REVIEW" ? "warning" : candidate.status === "DISMISSED" ? "neutral" : "success"}
              />
            }
          />
          <Field label={t("duplicates.reviewedAt")} value={candidate.reviewedAt ? formatDateTime(candidate.reviewedAt) : t("duplicates.notReviewed")} />
          <Field label={t("duplicates.updatedAt")} value={formatDateTime(candidate.updatedAt)} />
        </dl>
        {candidate.decisionNote ? <p className="mt-4 text-sm text-[color:var(--cb-muted-foreground)]">{t("duplicates.decisionNote")}: {candidate.decisionNote}</p> : null}

        <h3 className="mt-6 text-base font-semibold text-[color:var(--cb-foreground)]">{t("duplicates.reviewAction")}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--cb-muted-foreground)]">
          {t("duplicates.reviewActionDescription")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.DISMISSED)}>
            <Button type="submit" variant="secondary">
              {t("duplicates.keepSeparate")}
            </Button>
          </form>
          <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.NEEDS_REVIEW)}>
            <Button type="submit" variant="secondary">
              {t("duplicates.flagReview")}
            </Button>
          </form>
          <form action={updateDuplicateCandidateAction.bind(null, candidate.id, DuplicateCandidateStatus.RESOLVED)}>
            <Button type="submit" variant="primary">
              {t("duplicates.markComplete")}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
