"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveMiniAuditDraftAction } from "@/app/leads/mini-audit-actions";
import { StatusPill } from "@/components/lead-status-pill";
import {
  MINI_AUDIT_STATUS_VALUES,
  PACKAGE_FIT_VALUES,
  type MiniAuditStatusValue,
  type PackageFitValue
} from "@/lib/lead-values";
import type { MiniAuditDraftRecord } from "@/lib/mini-audits";

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

export function MiniAuditDraftSection({
  leadId,
  drafts
}: {
  leadId: string;
  drafts: MiniAuditDraftRecord[];
}) {
  return (
    <section className="space-y-3">
      <MiniAuditDraftEditor leadId={leadId} />

      <div className="space-y-3">
        {drafts.map((draft) => (
          <MiniAuditDraftEditor key={draft.id} leadId={leadId} draft={draft} />
        ))}
      </div>
    </section>
  );
}

function MiniAuditDraftEditor({
  leadId,
  draft
}: {
  leadId: string;
  draft?: MiniAuditDraftRecord;
}) {
  const [state, formAction] = useActionState<DraftState, FormData>(
    async (_previous, formData) => saveMiniAuditDraftAction(leadId, formData),
    initialState
  );
  const feedbackId = draft ? `mini-audit-feedback-${draft.id}` : "mini-audit-feedback-new";

  return (
    <form
      action={formAction}
      aria-describedby={state.message ? feedbackId : undefined}
      className="space-y-4 rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[color:var(--cb-foreground)]">
            {draft ? `Draft ${draft.id.slice(0, 8)}` : "Create review draft"}
          </h3>
          <p className="mt-1 text-xs text-[color:var(--cb-muted-foreground)]">
            {draft ? "Update the existing draft below." : "Create the first review draft for this lead."}
          </p>
        </div>
        {draft ? (
          <div className="flex flex-wrap gap-2">
            <StatusPill value={draft.status as MiniAuditStatusValue} appearance="light" />
            <StatusPill value={draft.suggestedPackage as PackageFitValue} appearance="light" />
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
              {MINI_AUDIT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          hint="Set the current review stage for this draft."
        />
        <DraftField
          label="Suggested match"
          control={
            <select
              name="suggestedPackage"
              defaultValue={draft?.suggestedPackage ?? "UNKNOWN"}
              className={fieldInputClassName}
            >
              {PACKAGE_FIT_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          hint="Record the current match recommendation."
        />
        <DraftField
          label="Finding 1"
          control={<input name="problem1" defaultValue={draft?.problem1 ?? ""} className={fieldInputClassName} />}
          hint="First core finding to address."
        />
        <DraftField
          label="Finding 2"
          control={<input name="problem2" defaultValue={draft?.problem2 ?? ""} className={fieldInputClassName} />}
          hint="Second core finding to address."
        />
        <DraftField
          label="Finding 3"
          control={<input name="problem3" defaultValue={draft?.problem3 ?? ""} className={fieldInputClassName} />}
          hint="Third core finding to address."
        />
        <DraftField
          label="Approved at"
          control={
            <input
              name="approvedAt"
              type="datetime-local"
              defaultValue={asDateTimeLocal(draft?.approvedAt)}
              className={fieldInputClassName}
            />
          }
          hint="Optional approval timestamp in local operator time."
        />
        <DraftField
          label="Review note"
          control={
            <textarea
              name="recommendation"
              rows={3}
              defaultValue={draft?.recommendation ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="Short review summary."
        />
        <DraftField
          label="Message angle"
          control={
            <textarea
              name="outreachAngle"
              rows={3}
              defaultValue={draft?.outreachAngle ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="Lead-in for the first message."
        />
        <DraftField
          label="Draft note"
          control={
            <textarea
              name="draftMessage"
              rows={5}
              defaultValue={draft?.draftMessage ?? ""}
              className={`${fieldInputClassName} min-h-32 resize-y md:col-span-2`}
            />
          }
          hint="Prepared note text."
        />
        <DraftField
          label="Risk notes"
          control={
            <textarea
              name="riskNotes"
              rows={3}
              defaultValue={draft?.riskNotes ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="Potential objections or caveats."
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? "Save review draft" : "Create review draft"}</SubmitButton>
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
