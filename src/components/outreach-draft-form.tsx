"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveOutreachDraftAction } from "@/app/leads/outreach-draft-actions";
import { StatusPill } from "@/components/lead-status-pill";
import {
  OUTREACH_CHANNEL_VALUES,
  OUTREACH_DRAFT_STATUS_VALUES,
  type OutreachChannelValue,
  type OutreachDraftStatusValue
} from "@/lib/lead-values";
import type { MiniAuditDraftRecord } from "@/lib/mini-audits";
import type { OutreachDraftRecord } from "@/lib/outreach-drafts";

type DraftState = {
  ok: boolean;
  message: string;
};

const initialState: DraftState = {
  ok: true,
  message: ""
};

const fieldInputClassName =
  "w-full rounded-2xl border border-[var(--clariobase-border)] bg-[var(--clariobase-surface-subtle)] px-4 py-3 text-sm text-[var(--clariobase-text-primary)] outline-none transition placeholder:text-[var(--clariobase-text-secondary)] focus-visible:border-[var(--clariobase-primary)] focus-visible:ring-2 focus-visible:ring-[var(--clariobase-primary)]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[var(--clariobase-primary)] px-4 py-2 font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clariobase-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}

export function OutreachDraftSection({
  leadId,
  drafts,
  miniAuditDrafts
}: {
  leadId: string;
  drafts: OutreachDraftRecord[];
  miniAuditDrafts: MiniAuditDraftRecord[];
}) {
  return (
    <section className="space-y-3">
      <OutreachDraftEditor leadId={leadId} miniAuditDrafts={miniAuditDrafts} />

      <div className="space-y-3">
        {drafts.map((draft) => (
          <OutreachDraftEditor
            key={draft.id}
            leadId={leadId}
            draft={draft}
            miniAuditDrafts={miniAuditDrafts}
          />
        ))}
      </div>
    </section>
  );
}

function OutreachDraftEditor({
  leadId,
  draft,
  miniAuditDrafts
}: {
  leadId: string;
  draft?: OutreachDraftRecord;
  miniAuditDrafts: MiniAuditDraftRecord[];
}) {
  const [state, formAction] = useActionState<DraftState, FormData>(
    async (_previous, formData) => saveOutreachDraftAction(leadId, formData),
    initialState
  );
  const feedbackId = draft ? `outreach-feedback-${draft.id}` : "outreach-feedback-new";

  return (
    <form
      action={formAction}
      aria-describedby={state.message ? feedbackId : undefined}
      className="space-y-4 rounded-[24px] border border-[var(--clariobase-border)] bg-[var(--clariobase-surface)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[var(--clariobase-text-primary)]">
            {draft ? `Draft ${draft.id.slice(0, 8)}` : "Create outreach draft"}
          </h3>
          <p className="mt-1 text-xs text-[var(--clariobase-text-secondary)]">
            {draft ? "Update the existing outreach draft below." : "Create the first outreach draft for this lead."}
          </p>
        </div>
        {draft ? (
          <div className="flex flex-wrap gap-2">
            <StatusPill value={draft.status as OutreachDraftStatusValue} appearance="light" />
            <StatusPill value={draft.channel as OutreachChannelValue} appearance="light" />
          </div>
        ) : (
          <span className="rounded-full border border-[var(--clariobase-border)] bg-[var(--clariobase-surface-subtle)] px-3 py-1 text-sm font-medium text-[var(--clariobase-text-primary)]">
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
              {OUTREACH_DRAFT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          hint="Set the current stage for this outreach draft."
        />
        <DraftField
          label="Channel"
          control={
            <select name="channel" defaultValue={draft?.channel ?? "EMAIL"} className={fieldInputClassName}>
              {OUTREACH_CHANNEL_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          hint="Choose the channel this draft is prepared for."
        />
        <DraftField
          label="Linked mini-audit"
          control={
            <select
              name="miniAuditDraftId"
              defaultValue={draft?.miniAuditDraftId ?? ""}
              className={fieldInputClassName}
            >
              <option value="">None</option>
              {miniAuditDrafts.map((miniAuditDraft) => (
                <option key={miniAuditDraft.id} value={miniAuditDraft.id}>
                  {miniAuditDraft.id.slice(0, 8)} - {miniAuditDraft.status.replaceAll("_", " ")} -{" "}
                  {miniAuditDraft.suggestedPackage.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          hint="Optional link to the supporting mini-audit draft."
        />
        <DraftField
          label="Subject"
          control={<input name="subject" defaultValue={draft?.subject ?? ""} className={fieldInputClassName} />}
          hint="Optional email subject."
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
          hint="Optional manual send timestamp in local operator time."
        />
        <DraftField
          label="Opening hook"
          control={
            <textarea
              name="openingHook"
              rows={3}
              defaultValue={draft?.openingHook ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="Lead-specific opening line."
        />
        <DraftField
          label="Message"
          control={
            <textarea
              name="message"
              rows={5}
              defaultValue={draft?.message ?? ""}
              className={`${fieldInputClassName} min-h-32 resize-y md:col-span-2`}
            />
          }
          hint="Prepared outreach text."
        />
        <DraftField
          label="Call to action"
          control={
            <textarea
              name="callToAction"
              rows={3}
              defaultValue={draft?.callToAction ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="What should the lead do next."
        />
        <DraftField
          label="Notes"
          control={
            <textarea
              name="notes"
              rows={3}
              defaultValue={draft?.notes ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint="Internal context or reminders."
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? "Save outreach draft" : "Create outreach draft"}</SubmitButton>
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
      <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--clariobase-text-secondary)]">
        {label}
      </span>
      {control}
      <span className="block text-xs leading-5 text-[var(--clariobase-text-secondary)]">{hint}</span>
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
