import { ButtonLink, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { ConfidenceBadge, DataQualityPageHeader, DataQualityStatusBadge } from "@/components/data-quality-primitives";
import { getDuplicateCandidates, type DuplicateReason } from "@/lib/duplicates";
import { requireUser } from "@/lib/auth-context";
import { getI18n } from "@/i18n/server";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";
import type { Translate } from "@/i18n/types";
import { getDuplicateSignalLabelTranslationKey } from "@/lib/duplicate-reasons";

export const dynamic = "force-dynamic";

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

function getReasonPreview(reasons: unknown, fallback: string, t: Translate) {
  if (!Array.isArray(reasons)) {
    return [];
  }

  return reasons
    .filter((reason): reason is DuplicateReason => Boolean(reason && typeof reason === "object"))
    .map((reason) => {
      const key = getDuplicateSignalLabelTranslationKey(reason.signal);
      const label = key ? t(key) : reason.label;
      const summary = [label, reason.value].filter(Boolean).join(": ");
      return summary || reason.label || fallback;
    })
    .filter(Boolean)
    .slice(0, 2);
}

export default async function DuplicatesPage() {
  await requireUser({ mode: "redirect", returnTo: "/duplicates" });
  const { t, formatDateTime, formatNumber } = await getI18n();
  const candidates = await getDuplicateCandidates();

  return (
    <div className="space-y-4">
      <DataQualityPageHeader
        eyebrow={t("duplicates.eyebrow")}
        title={t("duplicates.title")}
        description={t("duplicates.description")}
      />

      <TableSurface aria-label={t("duplicates.tableAria")}>
        <Table className="min-w-[1100px]">
          <caption className="sr-only">{t("duplicates.caption")}</caption>
          <TableHead>
            <tr>
              <TableHeadCell scope="col">{t("duplicates.candidate")}</TableHeadCell>
              <TableHeadCell scope="col">{t("duplicates.confidence")}</TableHeadCell>
              <TableHeadCell scope="col">{t("duplicates.signals")}</TableHeadCell>
              <TableHeadCell scope="col">{t("duplicates.status")}</TableHeadCell>
              <TableHeadCell scope="col">{t("duplicates.updated")}</TableHeadCell>
              <TableHeadCell scope="col">{t("duplicates.review")}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {candidates.map((candidate) => {
              const confidence = getConfidenceMeta(candidate.score, t);
              const previewReasons = getReasonPreview(candidate.reasons, t("duplicates.signalFallback"), t);

              return (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium text-[color:var(--cb-foreground)]">{candidate.leadA.businessName}</div>
                        <div className="text-xs text-[color:var(--cb-muted-foreground)]">
                          {candidate.leadA.city ?? t("duplicates.noCity")} | {candidate.leadA.category ?? t("duplicates.noCategory")}
                        </div>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--cb-muted-foreground)]">
                        {t("duplicates.versus")}
                      </div>
                      <div>
                        <div className="font-medium text-[color:var(--cb-foreground)]">{candidate.leadB.businessName}</div>
                        <div className="text-xs text-[color:var(--cb-muted-foreground)]">
                          {candidate.leadB.city ?? t("duplicates.noCity")} | {candidate.leadB.category ?? t("duplicates.noCategory")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ConfidenceBadge label={confidence.label} score={formatNumber(candidate.score)} scoreLabel={t("duplicates.score")} tone={confidence.tone} detail={confidence.detail} />
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
                      label={t(getTaxonomyTranslationKey(candidate.status))}
                      tone={candidate.status === "OPEN" ? "information" : candidate.status === "NEEDS_REVIEW" ? "warning" : candidate.status === "DISMISSED" ? "neutral" : "success"}
                    />
                  </TableCell>
                  <TableCell className="text-[color:var(--cb-muted-foreground)]">{formatDateTime(candidate.updatedAt)}</TableCell>
                  <TableCell>
                    <ButtonLink
                      href={`/duplicates/${candidate.id}`}
                      aria-label={t("duplicates.openAria", { left: candidate.leadA.businessName, right: candidate.leadB.businessName })}
                      className="whitespace-nowrap"
                    >
                      {t("duplicates.open")}
                    </ButtonLink>
                  </TableCell>
                </TableRow>
              );
            })}
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-left sm:text-center text-[color:var(--cb-muted-foreground)]">
                  {t("duplicates.empty")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
