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
  const { t } = useI18n();
  const [state, formAction] = useActionState<DraftState, FormData>(
    async (_previous, formData) => saveOutreachDraftAction(leadId, formData),
    initialState
  );
  const feedbackId = draft ? `outreach-feedback-${draft.id}` : "outreach-feedback-new";

  return (
    <form
      action={formAction}
      aria-describedby={state.code ? feedbackId : undefined}
      className="space-y-4 rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[color:var(--cb-foreground)]">
            {draft ? t("draft.named", { id: draft.id.slice(0, 8) }) : t("outreach.create")}
          </h3>
          <p className="mt-1 text-xs text-[color:var(--cb-muted-foreground)]">
            {draft ? t("draft.updateExisting") : t("outreach.createDescription")}
          </p>
        </div>
        {draft ? (
          <div className="flex flex-wrap gap-2">
            <StatusPill value={draft.status as OutreachDraftStatusValue} appearance="light" />
            <StatusPill value={draft.channel as OutreachChannelValue} appearance="light" />
          </div>
        ) : (
          <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 py-1 text-sm font-medium text-[color:var(--cb-foreground)]">
            {t("draft.new")}
          </span>
        )}
      </div>

      {draft ? <input type="hidden" name="draftId" value={draft.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <DraftField
          label={t("draft.status")}
          control={
            <select name="status" defaultValue={draft?.status ?? "DRAFT"} className={fieldInputClassName}>
              {OUTREACH_DRAFT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(getTaxonomyTranslationKey(value))}
                </option>
              ))}
            </select>
          }
          hint={t("outreach.statusHint")}
        />
        <DraftField
          label={t("outreach.channel")}
          control={
            <select name="channel" defaultValue={draft?.channel ?? "EMAIL"} className={fieldInputClassName}>
              {OUTREACH_CHANNEL_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(getTaxonomyTranslationKey(value))}
                </option>
              ))}
            </select>
          }
          hint={t("outreach.channelHint")}
        />
        <DraftField
          label={t("outreach.linkedReview")}
          control={
            <select
              name="miniAuditDraftId"
              defaultValue={draft?.miniAuditDraftId ?? ""}
              className={fieldInputClassName}
            >
              <option value="">{t("common.none")}</option>
              {miniAuditDrafts.map((miniAuditDraft) => (
                <option key={miniAuditDraft.id} value={miniAuditDraft.id}>
                  {miniAuditDraft.id.slice(0, 8)} - {t(getTaxonomyTranslationKey(miniAuditDraft.status))} -{" "}
                  {t(getTaxonomyTranslationKey(miniAuditDraft.suggestedPackage))}
                </option>
              ))}
            </select>
          }
          hint={t("outreach.linkedReviewHint")}
        />
        <DraftField
          label={t("outreach.subject")}
          control={<input name="subject" defaultValue={draft?.subject ?? ""} className={fieldInputClassName} />}
          hint={t("outreach.subjectHint")}
        />
        <DraftField
          label={t("outreach.sentAt")}
          control={
            <input
              name="sentAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocalInput(draft?.sentAt)}
              className={fieldInputClassName}
            />
          }
          hint={t("outreach.sentAtHint")}
        />
        <DraftField
          label={t("outreach.openingLine")}
          control={
            <textarea
              name="openingHook"
              rows={3}
              defaultValue={draft?.openingHook ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("outreach.openingLineHint")}
        />
        <DraftField
          label={t("outreach.message")}
          control={
            <textarea
              name="message"
              rows={5}
              defaultValue={draft?.message ?? ""}
              className={`${fieldInputClassName} min-h-32 resize-y md:col-span-2`}
            />
          }
          hint={t("outreach.messageHint")}
        />
        <DraftField
          label={t("outreach.nextStep")}
          control={
            <textarea
              name="callToAction"
              rows={3}
              defaultValue={draft?.callToAction ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("outreach.nextStepHint")}
        />
        <DraftField
          label={t("outreach.notes")}
          control={
            <textarea
              name="notes"
              rows={3}
              defaultValue={draft?.notes ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("outreach.notesHint")}
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? t("outreach.save") : t("outreach.create")}</SubmitButton>
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
