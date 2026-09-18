import { ButtonLink, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { DataQualityPageHeader, DataQualityStatusBadge } from "@/components/data-quality-primitives";
import { getImportBatches } from "@/lib/imports";
import { requireUser } from "@/lib/auth-context";
import { getI18n } from "@/i18n/server";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";

export const dynamic = "force-dynamic";

function getBatchLabel(batch: {
  sourceName: string | null;
  fileName: string | null;
}, fallback: string) {
  return batch.sourceName ?? batch.fileName ?? fallback;
}

function CountChip({
  label,
  formattedValue,
  tone
}: {
  label: string;
  formattedValue: string;
  tone: "neutral" | "success" | "information" | "danger" | "warning";
}) {
  const toneClassName = {
    neutral: "border-[color:var(--cb-neutral)]/25 bg-[color:var(--cb-neutral)]/10 text-[color:var(--cb-neutral-ink)]",
    success: "border-[color:var(--cb-success)]/25 bg-[color:var(--cb-success)]/10 text-[color:var(--cb-success-ink)]",
    information: "border-[color:var(--cb-information)]/25 bg-[color:var(--cb-information)]/10 text-[color:var(--cb-information-ink)]",
    danger: "border-[color:var(--cb-danger)]/25 bg-[color:var(--cb-danger)]/10 text-[color:var(--cb-danger-ink)]",
    warning: "border-[color:var(--cb-warning)]/25 bg-[color:var(--cb-warning)]/10 text-[color:var(--cb-warning-ink)]"
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClassName}`}
    >
      {label}: {formattedValue}
    </span>
  );
}

export default async function ImportsPage() {
  await requireUser({ mode: "redirect", returnTo: "/imports" });
  const { t, formatDateTime, formatNumber } = await getI18n();
  const batches = await getImportBatches();
  const fallbackBatch = t("imports.batchFallback");

  return (
    <div className="space-y-4">
      <DataQualityPageHeader
        eyebrow={t("imports.eyebrow")}
        title={t("imports.title")}
        description={t("imports.description")}
      />

      <TableSurface aria-label={t("imports.tableAria")}>
        <Table className="min-w-[1050px]">
          <caption className="sr-only">{t("imports.caption")}</caption>
          <TableHead>
            <tr>
              <TableHeadCell scope="col">{t("imports.batch")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.rows")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.status")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.started")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.finished")}</TableHeadCell>
              <TableHeadCell scope="col">{t("imports.review")}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>
                  <div className="font-medium text-[color:var(--cb-foreground)]">{getBatchLabel(batch, fallbackBatch)}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--cb-muted-foreground)]">
                    <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-2.5 py-1 font-medium text-[color:var(--cb-foreground)]">
                      {t(getTaxonomyTranslationKey(batch.sourceType))}
                    </span>
                    {batch.fileName && batch.fileName !== batch.sourceName ? (
                      <span className="break-words">{t("imports.file")}: {batch.fileName}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xl flex-wrap gap-2">
                    <CountChip label={t("imports.total")} formattedValue={formatNumber(batch.totalRows)} tone="neutral" />
                    <CountChip label={t("imports.created")} formattedValue={formatNumber(batch.createdRows)} tone="success" />
                    <CountChip label={t("imports.updated")} formattedValue={formatNumber(batch.updatedRows)} tone="information" />
                    <CountChip label={t("imports.rejected")} formattedValue={formatNumber(batch.rejectedRows)} tone="danger" />
                    <CountChip label={t("imports.skipped")} formattedValue={formatNumber(batch.skippedRows)} tone="warning" />
                  </div>
                </TableCell>
                <TableCell>
                  <DataQualityStatusBadge
                    label={t(getTaxonomyTranslationKey(batch.status))}
                    tone={batch.status === "RUNNING" ? "information" : batch.status === "COMPLETED" ? "success" : batch.status === "COMPLETED_WITH_ERRORS" ? "warning" : "danger"}
                  />
                </TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{batch.startedAt ? formatDateTime(batch.startedAt) : t("common.unavailable")}</TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{batch.finishedAt ? formatDateTime(batch.finishedAt) : t("common.unavailable")}</TableCell>
                <TableCell>
                  <ButtonLink
                    href={`/imports/${batch.id}`}
                    aria-label={t("imports.openAria", { name: getBatchLabel(batch, fallbackBatch) })}
                    className="whitespace-nowrap"
                  >
                    {t("imports.open")}
                  </ButtonLink>
                </TableCell>
              </TableRow>
            ))}
            {batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-left sm:text-center text-[color:var(--cb-muted-foreground)]">
                  {t("imports.empty")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
