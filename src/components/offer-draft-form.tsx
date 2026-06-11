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
  "w-full rounded-2xl border border-[#1E293B] bg-[#0A0C10] px-4 py-3 text-sm text-[#F0F4F9] outline-none transition placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#22D3EE]/25";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[#22D3EE] px-4 py-2 font-semibold text-[#00363e] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
    <section className="space-y-4 rounded-3xl border border-[#1E293B] bg-[#11141D] p-6">
      <div>
        <h2 className="text-lg font-semibold text-[#F0F4F9]">Offer drafts</h2>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Prepare commercial offer drafts locally. No PDF export or sending workflow is included
          here.
        </p>
      </div>

      <OfferDraftEditor leadId={leadId} />

      <div className="space-y-4">
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

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0A0C10]/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[#F0F4F9]">
            {draft ? `Draft ${draft.id.slice(0, 8)}` : "Create offer draft"}
          </h3>
          <p className="mt-1 text-xs text-[#94A3B8]">
            {draft ? "Update the existing offer draft below." : "Start a new commercial offer draft for this lead."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill value={(draft?.status ?? "DRAFT") as OfferDraftStatusValue} />
          <StatusPill value={(draft?.packageFit ?? "UNKNOWN") as PackageFitValue} />
        </div>
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
          value={<StatusPill value={(draft?.status ?? "DRAFT") as OfferDraftStatusValue} />}
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
          value={<StatusPill value={(draft?.packageFit ?? "UNKNOWN") as PackageFitValue} />}
        />
        <DraftField
          label="Title"
          control={<input name="title" defaultValue={draft?.title ?? ""} className={fieldInputClassName} />}
          value="Required offer title"
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
          value="Optional numeric price"
        />
        <DraftField
          label="Currency"
          control={<input name="currency" defaultValue={draft?.currency ?? "PLN"} className={fieldInputClassName} />}
          value="Defaults to PLN"
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
          value="Optional expiry timestamp"
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
          value="Manual send timestamp"
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
          value="Optional acceptance timestamp"
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
          value="Optional rejection timestamp"
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
          value="What is included in the offer"
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
          value="What the price assumes"
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
          value="What should happen after this draft"
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
          value="Optional rejection note"
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? "Save offer draft" : "Create offer draft"}</SubmitButton>
        {state.message ? (
          <p className={state.ok ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}

function DraftField({
  label,
  control,
  value
}: {
  label: string;
  control: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <label className="space-y-2 md:col-span-1">
      <span className="block text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      {control}
      <span className="block text-xs text-slate-500">{value}</span>
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
