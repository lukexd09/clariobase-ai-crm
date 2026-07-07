"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveOfferDraftAction } from "@/app/leads/offer-draft-actions";
import { StatusPill } from "@/components/lead-status-pill";
import {
  OFFER_DRAFT_STATUS_VALUES,
  PACKAGE_FIT_VALUES,
  type OfferDraftStatusValue,
  type PackageFitValue
} from "@/lib/lead-values";
import type { OfferDraftClientRecord } from "@/lib/offer-drafts";

type DraftState = {
  ok: boolean;
  message: string;
};

const initialState: DraftState = {
  ok: true,
  message: ""
};

const fieldInputClassName =
  "w-full rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-4 py-3 text-sm text-[color:var(--cb-foreground)] outline-none transition placeholder:text-[color:var(--cb-muted-foreground)] focus-visible:border-[color:var(--cb-accent)] focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[color:var(--cb-accent)] px-4 py-2 font-semibold text-[color:var(--cb-accent-foreground)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}

export function OfferDraftSection({
  leadId,
  drafts
}: {
  leadId: string;
  drafts: OfferDraftClientRecord[];
}) {
  return (
    <section className="space-y-3">
      <OfferDraftEditor leadId={leadId} />

      <div className="space-y-3">
        {drafts.map((draft) => (
          <OfferDraftEditor key={draft.id} leadId={leadId} draft={draft} />
        ))}
      </div>
    </section>
  );
}

function OfferDraftEditor({
  leadId,
  draft
}: {
  leadId: string;
  draft?: OfferDraftClientRecord;
}) {
  const [state, formAction] = useActionState<DraftState, FormData>(
    async (_previous, formData) => saveOfferDraftAction(leadId, formData),
    initialState
  );
  const feedbackId = draft ? `offer-feedback-${draft.id}` : "offer-feedback-new";

  return (
    <form
      action={formAction}
      aria-describedby={state.message ? feedbackId : undefined}
      className="space-y-4 rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[color:var(--cb-foreground)]">
            {draft ? `Draft ${draft.id.slice(0, 8)}` : "Create offer draft"}
          </h3>
          <p className="mt-1 text-xs text-[color:var(--cb-muted-foreground)]">
            {draft ? "Update the existing offer draft below." : "Create the first commercial offer draft for this lead."}
          </p>
        </div>
        {draft ? (
          <div className="flex flex-wrap gap-2">
            <StatusPill value={draft.status as OfferDraftStatusValue} appearance="light" />
            <StatusPill value={draft.packageFit as PackageFitValue} appearance="light" />
          </div>
        ) : (
          <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 py-1 text-sm font-medium text-[color:var(--cb-foreground)]">
            New draft
          </span>
        )}
      </div>

      {draft ? <input type="hidden" name="draftId" value={draft.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <DraftField
          label="Status"
          control={
            <select name="status" defaultValue={draft?.status ?? "DRAFT"} className={fieldInputClassName}>
              {OFFER_DRAFT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          hint="Set the current stage for this offer draft."
        />
        <DraftField
          label="Package fit"
          control={
            <select
              name="packageFit"
              defaultValue={draft?.packageFit ?? "UNKNOWN"}
              className={fieldInputClassName}
            >
              {PACKAGE_FIT_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          hint="Record the package this offer currently targets."
        />
        <DraftField
          label="Title"
          control={<input name="title" defaultValue={draft?.title ?? ""} className={fieldInputClassName} />}
          hint="Required offer title."
        />
        <DraftField
          label="Price net"
          control={
            <input
              name="priceNet"
              type="number"
              min="0"
              step="0.01"
              defaultValue={asInputNumberValue(draft?.priceNet)}
              className={fieldInputClassName}
            />
          }
          hint="Optional numeric price."
        />
        <DraftField
          label="Currency"
          control={<input name="currency" defaultValue={draft?.currency ?? "PLN"} className={fieldInputClassName} />}
          hint="Defaults to PLN."
        />
        <DraftField
          label="Valid until"
          control={
            <input
              name="validUntil"
              type="datetime-local"
              defaultValue={asDateTimeLocal(draft?.validUntil)}
              className={fieldInputClassName}
            />
          }
          hint="Optional expiry timestamp in local operator time."
        />
        <DraftField
          label="Sent at"
          control={
            <input
              name="sentAt"
              type="datetime-local"
              defaultValue={asDateTimeLocal(draft?.sentAt)}
              className={fieldInputClassName}
            />
          }
          hint="Manual send timestamp in local operator time."
        />
        <DraftField
          label="Accepted at"
          control={
            <input
              name="acceptedAt"
              type="datetime-local"
              defaultValue={asDateTimeLocal(draft?.acceptedAt)}
              className={fieldInputClassName}
            />
          }
          hint="Optional acceptance timestamp in local operator time."
        />
        <DraftField
          label="Rejected at"
          control={
            <input
              name="rejectedAt"
              type="datetime-local"
              defaultValue={asDateTimeLocal(draft?.rejectedAt)}
              className={fieldInputClassName}
            />
          }
          hint="Optional rejection timestamp in local operator time."
        />
        <DraftField
          label="Scope summary"
          control={
            <textarea
              name="scopeSummary"
              rows={3}
              defaultValue={draft?.scopeSummary ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="What is included in the offer."
        />
        <DraftField
          label="Assumptions"
          control={
            <textarea
              name="assumptions"
              rows={3}
              defaultValue={draft?.assumptions ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="What the price assumes."
        />
        <DraftField
          label="Next step"
          control={
            <textarea
              name="nextStep"
              rows={3}
              defaultValue={draft?.nextStep ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="What should happen after this draft."
        />
        <DraftField
          label="Rejection reason"
          control={
            <textarea
              name="rejectionReason"
              rows={3}
              defaultValue={draft?.rejectionReason ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="Optional rejection note."
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? "Save offer draft" : "Create offer draft"}</SubmitButton>
        {state.message ? (
          <p
            id={feedbackId}
            role={state.ok ? "status" : "alert"}
            aria-live={state.ok ? "polite" : "assertive"}
            className={state.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function DraftField({
  label,
  control,
  hint
}: {
  label: string;
  control: React.ReactNode;
  hint: React.ReactNode;
}) {
  return (
    <label className="space-y-2 md:col-span-1">
      <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--cb-muted-foreground)]">
        {label}
      </span>
      {control}
      <span className="block text-xs leading-5 text-[color:var(--cb-muted-foreground)]">{hint}</span>
    </label>
  );
}

function asDateTimeLocal(value: Date | null | undefined) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function asInputNumberValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? Number(value) : Number(value);
}
