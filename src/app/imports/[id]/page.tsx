import { notFound } from "next/navigation";
import { ButtonLink, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { DataQualityMetric, DataQualityPageHeader, DataQualityStatusBadge, TechnicalDisclosure } from "@/components/data-quality-primitives";
import { getImportBatchById } from "@/lib/imports";
import {
  type ImportRowStatusValue,
} from "@/lib/lead-values";
import { requireUser } from "@/lib/auth-context";
import { getI18n } from "@/i18n/server";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";
import type { Translate } from "@/i18n/types";

export const dynamic = "force-dynamic";

function getBatchLabel(batch: {
  sourceName: string | null;
  fileName: string | null;
}, fallback: string) {
  return batch.sourceName ?? batch.fileName ?? fallback;
}

function getRowOutcomeMessage(status: ImportRowStatusValue, t: Translate) {
  switch (status) {
    case "CREATED":
      return t("imports.row.createdMessage");
    case "UPDATED":
      return t("imports.row.updatedMessage");
    case "REJECTED":
      return t("imports.row.rejectedMessage");
    case "SKIPPED":
      return t("imports.row.skippedMessage");
    default:
      return t("imports.row.noOutcome");
  }
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "information" | "danger" | "warning";
}) {
  return <DataQualityMetric label={label} value={value} tone={tone} />;
}

export default async function ImportBatchDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser({ mode: "redirect", returnTo: `/imports/${id}` });
  const { t, formatDateTime, formatNumber } = await getI18n();
  const batch = await getImportBatchById(id);

  if (!batch) notFound();

  return (
    <div className="space-y-4">
      <ButtonLink href="/imports">{t("imports.back")}</ButtonLink>

      <DataQualityPageHeader
        eyebrow={t("imports.eyebrow")}
        title={getBatchLabel(batch, t("imports.batchFallback"))}
        description={t("imports.detailDescription")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--cb-muted-foreground)]">
            <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-2.5 py-1 text-xs font-medium text-[color:var(--cb-foreground)]">
              {t(getTaxonomyTranslationKey(batch.sourceType))}
            </span>
            <DataQualityStatusBadge
              label={t(getTaxonomyTranslationKey(batch.status))}
              tone={batch.status === "RUNNING" ? "information" : batch.status === "COMPLETED" ? "success" : batch.status === "COMPLETED_WITH_ERRORS" ? "warning" : "danger"}
            />
            <span aria-hidden="true" className="text-[color:var(--cb-muted-foreground)]">|</span>
            <span>{t("imports.started")}: {batch.startedAt ? formatDateTime(batch.startedAt) : t("common.unavailable")}</span>
            <span aria-hidden="true" className="text-[color:var(--cb-muted-foreground)]">|</span>
            <span>{t("imports.finished")}: {batch.finishedAt ? formatDateTime(batch.finishedAt) : t("common.unavailable")}</span>
            {batch.fileName && batch.fileName !== batch.sourceName ? (
              <>
                <span aria-hidden="true" className="text-[color:var(--cb-muted-foreground)]">|</span>
                <span className="break-words">{t("imports.file")}: {batch.fileName}</span>
              </>
            ) : null}
          </div>
        }
      />

      <dl className="grid gap-4 md:grid-cols-5">
        <Metric label={t("imports.totalRows")} value={formatNumber(batch.totalRows)} tone="neutral" />
        <Metric label={t("imports.created")} value={formatNumber(batch.createdRows)} tone="success" />
        <Metric label={t("imports.updated")} value={formatNumber(batch.updatedRows)} tone="information" />
        <Metric label={t("imports.rejected")} value={formatNumber(batch.rejectedRows)} tone="danger" />
        <Metric label={t("imports.skipped")} value={formatNumber(batch.skippedRows)} tone="warning" />
      </dl>

      <TableSurface aria-label={t("imports.rowsTableAria")}>
        <Table className="min-w-[1100px]">
          <caption className="sr-only">{t("imports.rowsCaption")}</caption>
          <TableHead>
            <tr>
              <TableHeadCell scope="col">{t("imports.row")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.status")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.businessContext")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.sourceContext")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.result")}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {batch.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{formatNumber(row.rowNumber)}</TableCell>
                <TableCell>
                  <DataQualityStatusBadge
                    label={t(getTaxonomyTranslationKey(row.status))}
                    tone={row.status === "CREATED" ? "success" : row.status === "UPDATED" ? "information" : row.status === "REJECTED" ? "danger" : "warning"}
                  />
                </TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">
                  <div className="font-medium text-[color:var(--cb-foreground)]">{row.businessName ?? "-"}</div>
                  <div className="mt-1 text-xs">{t("imports.customerId")}: {row.customerId ?? t("imports.notProvided")}</div>
                </TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">
                  <div>{row.source ?? t(getTaxonomyTranslationKey(batch.sourceType))}</div>
                  <div className="mt-1 break-words text-xs">{t("imports.sourceRecord")}: {row.sourceRecordId ?? t("imports.notProvided")}</div>
                </TableCell>
                <TableCell>
                  <div className="max-w-2xl space-y-3">
                    <div className="font-medium text-[color:var(--cb-foreground)]">{getRowOutcomeMessage(row.status, t)}</div>
                    {row.leadId ? (
                      <ButtonLink href={`/leads/${row.leadId}`} aria-label={t("imports.openLeadAria", { row: row.rowNumber, name: row.businessName ?? "" })}>
                        {t("imports.openLead")}
                      </ButtonLink>
                    ) : (
                      <>
                        <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">
                          {row.rejectionReason
                            ? t("imports.reviewValidation")
                            : t("imports.noLeadLink")}
                        </p>
                        {row.rejectionReason ? (
                          <TechnicalDisclosure title={t("imports.technicalValidation")}>
                            <p className="break-words whitespace-pre-wrap text-xs leading-6 text-[color:var(--cb-muted-foreground)]">
                              {row.rejectionReason}
                            </p>
                          </TechnicalDisclosure>
                        ) : null}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {batch.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-left sm:text-center text-[color:var(--cb-muted-foreground)]">
                  {t("imports.rowsEmpty")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
