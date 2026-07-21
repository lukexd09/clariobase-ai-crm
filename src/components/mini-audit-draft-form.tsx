"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveMiniAuditDraftAction } from "@/app/leads/mini-audit-actions";
import { StatusPill } from "@/components/lead-status-pill";
import {
  MINI_AUDIT_STATUS_VALUES,
  type MiniAuditStatusValue,
} from "@/lib/lead-values";
import type { MiniAuditDraftRecord } from "@/lib/mini-audits";
import { useI18n } from "@/i18n/provider";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";
import { getLeadNoticeTranslationKey } from "@/lib/lead-notices";
import { formatDateTimeLocalInput } from "@/i18n/format";

type DraftState = {
  ok: boolean;
  code: string;
};

const initialState: DraftState = {
  ok: true,
  code: ""
};

const fieldInputClassName =
  "w-full rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-4 py-3 text-sm text-[color:var(--cb-foreground)] outline-none transition placeholder:text-[color:var(--cb-muted-foreground)] focus-visible:border-[color:var(--cb-accent)] focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[color:var(--cb-accent)] px-4 py-2 font-semibold text-[color:var(--cb-accent-foreground)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? t("common.saving") : children}
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
  const { t } = useI18n();
  const [state, formAction] = useActionState<DraftState, FormData>(
    async (_previous, formData) => saveMiniAuditDraftAction(leadId, formData),
    initialState
  );
  const feedbackId = draft ? `mini-audit-feedback-${draft.id}` : "mini-audit-feedback-new";

  return (
    <form
      action={formAction}
      aria-describedby={state.code ? feedbackId : undefined}
      className="space-y-4 rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[color:var(--cb-foreground)]">
            {draft ? t("draft.named", { id: draft.id.slice(0, 8) }) : t("miniAudit.create")}
          </h3>
          <p className="mt-1 text-xs text-[color:var(--cb-muted-foreground)]">
            {draft ? t("draft.updateExisting") : t("miniAudit.createDescription")}
          </p>
        </div>
        {draft ? (
          <div className="flex flex-wrap gap-2">
            <StatusPill value={draft.status as MiniAuditStatusValue} appearance="light" />
          </div>
        ) : (
          <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 py-1 text-sm font-medium text-[color:var(--cb-foreground)]">
            {t("draft.new")}
          </span>
        )}
      </div>

      {draft ? <input type="hidden" name="draftId" value={draft.id} /> : null}
      <input type="hidden" name="suggestedPackage" value={draft?.suggestedPackage ?? "UNKNOWN"} />

      <div className="grid gap-4 md:grid-cols-2">
        <DraftField
          label={t("draft.status")}
          control={
            <select name="status" defaultValue={draft?.status ?? "DRAFT"} className={fieldInputClassName}>
              {MINI_AUDIT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(getTaxonomyTranslationKey(value))}
                </option>
              ))}
            </select>
          }
          hint={t("miniAudit.statusHint")}
        />
        <DraftField
          label={t("miniAudit.finding1")}
          control={<input name="problem1" defaultValue={draft?.problem1 ?? ""} className={fieldInputClassName} />}
          hint={t("miniAudit.finding1Hint")}
        />
        <DraftField
          label={t("miniAudit.finding2")}
          control={<input name="problem2" defaultValue={draft?.problem2 ?? ""} className={fieldInputClassName} />}
          hint={t("miniAudit.finding2Hint")}
        />
        <DraftField
          label={t("miniAudit.finding3")}
          control={<input name="problem3" defaultValue={draft?.problem3 ?? ""} className={fieldInputClassName} />}
          hint={t("miniAudit.finding3Hint")}
        />
        <DraftField
          label={t("miniAudit.approvedAt")}
          control={
            <input
              name="approvedAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocalInput(draft?.approvedAt)}
              className={fieldInputClassName}
            />
          }
          hint={t("miniAudit.approvedAtHint")}
        />
        <DraftField
          label={t("miniAudit.reviewNote")}
          control={
            <textarea
              name="recommendation"
              rows={3}
              defaultValue={draft?.recommendation ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("miniAudit.reviewNoteHint")}
        />
        <DraftField
          label={t("miniAudit.messageAngle")}
          control={
            <textarea
              name="outreachAngle"
              rows={3}
              defaultValue={draft?.outreachAngle ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("miniAudit.messageAngleHint")}
        />
        <DraftField
          label={t("miniAudit.draftNote")}
          control={
            <textarea
              name="draftMessage"
              rows={5}
              defaultValue={draft?.draftMessage ?? ""}
              className={`${fieldInputClassName} min-h-32 resize-y md:col-span-2`}
            />
          }
          hint={t("miniAudit.draftNoteHint")}
        />
        <DraftField
          label={t("miniAudit.riskNotes")}
          control={
            <textarea
              name="riskNotes"
              rows={3}
              defaultValue={draft?.riskNotes ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("miniAudit.riskNotesHint")}
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? t("miniAudit.save") : t("miniAudit.create")}</SubmitButton>
        {state.code ? (
          <p
            id={feedbackId}
            role={state.ok ? "status" : "alert"}
            aria-live={state.ok ? "polite" : "assertive"}
            className={state.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"}
          >
            {t(getLeadNoticeTranslationKey(state.code))}
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
