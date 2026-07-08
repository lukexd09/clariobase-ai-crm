import { notFound } from "next/navigation";
import { ButtonLink, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TableSurface } from "@/components/clariobase-ui";
import { DataQualityMetric, DataQualityPageHeader, DataQualityStatusBadge, TechnicalDisclosure } from "@/components/data-quality-primitives";
import { getImportBatchById } from "@/lib/imports";
import {
  type ImportBatchStatusValue,
  type ImportRowStatusValue,
  type ImportSourceTypeValue
} from "@/lib/lead-values";

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

const IMPORT_ROW_STATUS_LABELS: Record<ImportRowStatusValue, string> = {
  CREATED: "Lead created",
  UPDATED: "Lead updated",
  REJECTED: "Needs correction",
  SKIPPED: "Skipped"
};

function formatDate(value: Date | null | undefined) {
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

function getRowOutcomeMessage(status: ImportRowStatusValue) {
  switch (status) {
    case "CREATED":
      return "A new lead was created from this row.";
    case "UPDATED":
      return "An existing lead was updated from this row.";
    case "REJECTED":
      return "This row needs correction before it can create or update a lead.";
    case "SKIPPED":
      return "This row was skipped and did not change a lead record.";
    default:
      return "No lead outcome is available for this row.";
  }
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
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
  const batch = await getImportBatchById(id);

  if (!batch) notFound();

  return (
    <div className="space-y-4">
      <ButtonLink href="/imports">Back to imports</ButtonLink>

      <DataQualityPageHeader
        eyebrow="Data intake"
        title={getBatchLabel(batch)}
        description="Keep the row results readable, open affected leads directly, and treat technical validation output as secondary detail."
        meta={
          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--cb-muted-foreground)]">
            <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-2.5 py-1 text-xs font-medium text-[color:var(--cb-foreground)]">
              {IMPORT_SOURCE_LABELS[batch.sourceType]}
            </span>
            <DataQualityStatusBadge
              label={IMPORT_BATCH_STATUS_LABELS[batch.status]}
              tone={batch.status === "RUNNING" ? "information" : batch.status === "COMPLETED" ? "success" : batch.status === "COMPLETED_WITH_ERRORS" ? "warning" : "danger"}
            />
            <span aria-hidden="true" className="text-[color:var(--cb-muted-foreground)]">|</span>
            <span>Started {formatDate(batch.startedAt)}</span>
            <span aria-hidden="true" className="text-[color:var(--cb-muted-foreground)]">|</span>
            <span>Finished {formatDate(batch.finishedAt)}</span>
            {batch.fileName && batch.fileName !== batch.sourceName ? (
              <>
                <span aria-hidden="true" className="text-[color:var(--cb-muted-foreground)]">|</span>
                <span className="break-words">File: {batch.fileName}</span>
              </>
            ) : null}
          </div>
        }
      />

      <dl className="grid gap-4 md:grid-cols-5">
        <Metric label="Total rows" value={batch.totalRows} tone="neutral" />
        <Metric label="Created" value={batch.createdRows} tone="success" />
        <Metric label="Updated" value={batch.updatedRows} tone="information" />
        <Metric label="Rejected" value={batch.rejectedRows} tone="danger" />
        <Metric label="Skipped" value={batch.skippedRows} tone="warning" />
      </dl>

      <TableSurface aria-label="Scrollable import batch rows table">
        <Table className="min-w-[1100px]">
          <caption className="sr-only">Individual row results for the selected import batch.</caption>
          <TableHead>
            <tr>
              <TableHeadCell scope="col">Row</TableHeadCell>
              <TableHeadCell scope="col">Status</TableHeadCell>
              <TableHeadCell scope="col">Business context</TableHeadCell>
              <TableHeadCell scope="col">Source context</TableHeadCell>
              <TableHeadCell scope="col">Result</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {batch.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">{row.rowNumber}</TableCell>
                <TableCell>
                  <DataQualityStatusBadge
                    label={IMPORT_ROW_STATUS_LABELS[row.status]}
                    tone={row.status === "CREATED" ? "success" : row.status === "UPDATED" ? "information" : row.status === "REJECTED" ? "danger" : "warning"}
                  />
                </TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">
                  <div className="font-medium text-[color:var(--cb-foreground)]">{row.businessName ?? "-"}</div>
                  <div className="mt-1 text-xs">Customer ID: {row.customerId ?? "Not provided"}</div>
                </TableCell>
                <TableCell className="text-[color:var(--cb-muted-foreground)]">
                  <div>{row.source ?? IMPORT_SOURCE_LABELS[batch.sourceType]}</div>
                  <div className="mt-1 break-words text-xs">Source record: {row.sourceRecordId ?? "Not provided"}</div>
                </TableCell>
                <TableCell>
                  <div className="max-w-2xl space-y-3">
                    <div className="font-medium text-[color:var(--cb-foreground)]">{getRowOutcomeMessage(row.status)}</div>
                    {row.leadId ? (
                      <ButtonLink href={`/leads/${row.leadId}`} aria-label={`Open lead for row ${row.rowNumber}${row.businessName ? `, ${row.businessName}` : ""}`}>
                        Open lead
                      </ButtonLink>
                    ) : (
                      <>
                        <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">
                          {row.rejectionReason
                            ? "Review the validation details below before retrying this row."
                            : "No lead link is available for this row."}
                        </p>
                        {row.rejectionReason ? (
                          <TechnicalDisclosure title="Technical validation details">
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
                  No row results available for this batch.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableSurface>
    </div>
  );
}
