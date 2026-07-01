import { ButtonLink, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { DataQualityPageHeader, DataQualityStatusBadge } from "@/components/data-quality-primitives";
import { getImportBatches } from "@/lib/imports";
import { type ImportBatchStatusValue, type ImportSourceTypeValue } from "@/lib/lead-values";

export const dynamic = "force-dynamic";

const IMPORT_SOURCE_LABELS: Record<ImportSourceTypeValue, string> = {
  LOCAL_JSON: "Local file",
  HARVESTER_EXPORT: "Harvester export",
  MANUAL_AI_PREPARED_FILE: "Prepared AI file"
};

const IMPORT_BATCH_STATUS_LABELS: Record<ImportBatchStatusValue, string> = {
  RUNNING: "In progress",
  COMPLETED: "Completed successfully",
  COMPLETED_WITH_ERRORS: "Completed with issues",
  FAILED: "Failed"
};

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(value)
    : "-";
}

function getBatchLabel(batch: {
  sourceName: string | null;
  fileName: string | null;
}) {
  return batch.sourceName ?? batch.fileName ?? "Import batch";
}

function CountChip({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
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
      {label}: {value}
    </span>
  );
}

export default async function ImportsPage() {
  const batches = await getImportBatches();

  return (
    <div className="space-y-4">
      <DataQualityPageHeader
        eyebrow="Data intake"
        title="Import batches"
        description="Review each file import, confirm row outcomes, and open the affected leads without leaving the CRM workflow."
      />

      <TableSurface aria-label="Scrollable import batches table">
        <Table>
          <caption className="sr-only">Import batches and their processing results.</caption>
          <TableHead>
            <tr>
              <TableHeadCell scope="col">Batch</TableHeadCell>
              <TableHeadCell scope="col">Rows</TableHeadCell>
              <TableHeadCell scope="col">Status</TableHeadCell>
              <TableHeadCell scope="col">Started</TableHeadCell>
              <TableHeadCell scope="col">Finished</TableHeadCell>
              <TableHeadCell scope="col">Review</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>
                  <div className="font-medium text-[color:var(--cb-foreground)]">{getBatchLabel(batch)}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--cb-muted-foreground)]">
                    <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-2.5 py-1 font-medium text-[color:var(--cb-foreground)]">
                      {IMPORT_SOURCE_LABELS[batch.sourceType]}
                    </span>
                    {batch.fileName && batch.fileName !== batch.sourceName ? (
                      <span className="break-words">File: {batch.fileName}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xl flex-wrap gap-2">
                    <CountChip label="Total" value={batch.totalRows} tone="neutral" />
                    <CountChip label="Created" value={batch.createdRows} tone="success" />
                    <CountChip label="Updated" value={batch.updatedRows} tone="information" />
                    <CountChip label="Rejected" value={batch.rejectedRows} tone="danger" />
                    <CountChip label="Skipped" value={batch.skippedRows} tone="warning" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-[color:var(--cb-foreground)]">{IMPORT_BATCH_STATUS_LABELS[batch.status]}</div>
                    <DataQualityStatusBadge label={IMPORT_BATCH_STATUS_LABELS[batch.status]} tone={batch.status === "RUNNING" ? "information" : batch.status === "COMPLETED" ? "success" : batch.status === "COMPLETED_WITH_ERRORS" ? "warning" : "danger"} />
                </TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{formatDate(batch.startedAt)}</TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{formatDate(batch.finishedAt)}</TableCell>
                <TableCell>
                  <ButtonLink
                    href={`/imports/${batch.id}`}
                    aria-label={`Open results for ${getBatchLabel(batch)}`}
                    className="whitespace-nowrap"
                  >
                    Open batch results
                  </ButtonLink>
                </TableCell>
              </TableRow>
            ))}
            {batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-left sm:text-center text-[color:var(--cb-muted-foreground)]">
                  No import batches yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
