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
    <section className="space-y-4 rounded-3xl border border-[#1E293B] bg-[#11141D] p-6">
      <div>
        <h2 className="text-lg font-semibold text-[#F0F4F9]">Outreach drafts</h2>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Prepare the first outreach message, channel, and follow-up metadata locally.
        </p>
      </div>

      <OutreachDraftEditor leadId={leadId} miniAuditDrafts={miniAuditDrafts} />

      <div className="space-y-4">
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

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0A0C10]/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[#F0F4F9]">
            {draft ? `Draft ${draft.id.slice(0, 8)}` : "Create outreach draft"}
          </h3>
          <p className="mt-1 text-xs text-[#94A3B8]">
            {draft ? "Update the existing outreach draft below." : "Start a new outreach draft for this lead."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill value={(draft?.status ?? "DRAFT") as OutreachDraftStatusValue} />
          <StatusPill value={(draft?.channel ?? "EMAIL") as OutreachChannelValue} />
        </div>
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
          value={<StatusPill value={(draft?.status ?? "DRAFT") as OutreachDraftStatusValue} />}
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
          value={<StatusPill value={(draft?.channel ?? "EMAIL") as OutreachChannelValue} />}
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
          value="Optional downstream mini-audit link"
        />
        <DraftField
          label="Subject"
          control={<input name="subject" defaultValue={draft?.subject ?? ""} className={fieldInputClassName} />}
          value="Optional email subject"
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
          value="Optional manual sent timestamp"
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
          value="Lead-specific opening line"
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
          value="Prepared outreach text"
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
          value="What should the lead do next"
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
          value="Internal context or reminders"
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? "Save outreach draft" : "Create outreach draft"}</SubmitButton>
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
