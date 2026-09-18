"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveOfferDraftAction } from "@/app/leads/offer-draft-actions";
import { StatusPill } from "@/components/lead-status-pill";
import {
  OFFER_DRAFT_STATUS_VALUES,
  type OfferDraftStatusValue,
} from "@/lib/lead-values";
import type { OfferDraftClientRecord } from "@/lib/offer-drafts";
import { useI18n } from "@/i18n/provider";
import { getTaxonomyTranslationKey } from "@/i18n/taxonomy";
import { getLeadNoticeTranslationKey } from "@/lib/lead-notices";
import { formatDateTimeLocalInput } from "@/i18n/format";
import { formatFormDateTimeOriginalInput } from "@/lib/form-date-time";

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
  const { t } = useI18n();
  const [state, formAction] = useActionState<DraftState, FormData>(
    async (_previous, formData) => saveOfferDraftAction(leadId, formData),
    initialState
  );
  const feedbackId = draft ? `offer-feedback-${draft.id}` : "offer-feedback-new";

  return (
    <form
      action={formAction}
      aria-describedby={state.code ? feedbackId : undefined}
      className="space-y-4 rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[color:var(--cb-foreground)]">
            {draft ? t("draft.named", { id: draft.id.slice(0, 8) }) : t("offer.create")}
          </h3>
          <p className="mt-1 text-xs text-[color:var(--cb-muted-foreground)]">
            {draft ? t("draft.updateExisting") : t("offer.createDescription")}
          </p>
        </div>
        {draft ? (
          <div className="flex flex-wrap gap-2">
            <StatusPill value={draft.status as OfferDraftStatusValue} appearance="light" />
          </div>
        ) : (
          <span className="rounded-full border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 py-1 text-sm font-medium text-[color:var(--cb-foreground)]">
            {t("draft.new")}
          </span>
        )}
      </div>

      {draft ? <input type="hidden" name="draftId" value={draft.id} /> : null}
      {draft ? (
        <>
          <input type="hidden" name="validUntilOriginal" value={formatFormDateTimeOriginalInput(draft.validUntil)} />
          <input type="hidden" name="sentAtOriginal" value={formatFormDateTimeOriginalInput(draft.sentAt)} />
          <input type="hidden" name="acceptedAtOriginal" value={formatFormDateTimeOriginalInput(draft.acceptedAt)} />
          <input type="hidden" name="rejectedAtOriginal" value={formatFormDateTimeOriginalInput(draft.rejectedAt)} />
        </>
      ) : null}
      <input type="hidden" name="packageFit" value={draft?.packageFit ?? "UNKNOWN"} />

      <div className="grid gap-4 md:grid-cols-2">
        <DraftField
          label={t("draft.status")}
          control={
            <select name="status" defaultValue={draft?.status ?? "DRAFT"} className={fieldInputClassName}>
              {OFFER_DRAFT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(getTaxonomyTranslationKey(value))}
                </option>
              ))}
            </select>
          }
          hint={t("offer.statusHint")}
        />
        <DraftField
          label={t("offer.title")}
          control={<input name="title" defaultValue={draft?.title ?? ""} className={fieldInputClassName} />}
          hint={t("offer.titleHint")}
        />
        <DraftField
          label={t("offer.price")}
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
          hint={t("offer.priceHint")}
        />
        <DraftField
          label={t("offer.currency")}
          control={<input name="currency" defaultValue={draft?.currency ?? "PLN"} className={fieldInputClassName} />}
          hint={t("offer.currencyHint")}
        />
        <DraftField
          label={t("offer.expires")}
          control={
            <input
              name="validUntil"
              type="datetime-local"
              defaultValue={formatDateTimeLocalInput(draft?.validUntil)}
              className={fieldInputClassName}
            />
          }
          hint={t("offer.expiresHint")}
        />
        <DraftField
          label={t("offer.sentAt")}
          control={
            <input
              name="sentAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocalInput(draft?.sentAt)}
              className={fieldInputClassName}
            />
          }
          hint={t("offer.sentAtHint")}
        />
        <DraftField
          label={t("offer.acceptedAt")}
          control={
            <input
              name="acceptedAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocalInput(draft?.acceptedAt)}
              className={fieldInputClassName}
            />
          }
          hint={t("offer.acceptedAtHint")}
        />
        <DraftField
          label={t("offer.rejectedAt")}
          control={
            <input
              name="rejectedAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocalInput(draft?.rejectedAt)}
              className={fieldInputClassName}
            />
          }
          hint={t("offer.rejectedAtHint")}
        />
        <DraftField
          label={t("offer.scopeSummary")}
          control={
            <textarea
              name="scopeSummary"
              rows={3}
              defaultValue={draft?.scopeSummary ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("offer.scopeSummaryHint")}
        />
        <DraftField
          label={t("offer.assumptions")}
          control={
            <textarea
              name="assumptions"
              rows={3}
              defaultValue={draft?.assumptions ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("offer.assumptionsHint")}
        />
        <DraftField
          label={t("offer.nextStep")}
          control={
            <textarea
              name="nextStep"
              rows={3}
              defaultValue={draft?.nextStep ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("offer.nextStepHint")}
        />
        <DraftField
          label={t("offer.rejectionReason")}
          control={
            <textarea
              name="rejectionReason"
              rows={3}
              defaultValue={draft?.rejectionReason ?? ""}
              className={`${fieldInputClassName} min-h-24 resize-y md:col-span-2`}
            />
          }
          hint={t("offer.rejectionReasonHint")}
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? t("offer.save") : t("offer.create")}</SubmitButton>
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

function asInputNumberValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? Number(value) : Number(value);
}
