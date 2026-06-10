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

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div>
        <h2 className="text-lg font-medium">Mini-audit drafts</h2>
        <p className="mt-1 text-sm text-slate-400">
          Capture the first diagnosis, suggested package fit, and a draft message angle.
        </p>
      </div>

      <MiniAuditDraftEditor leadId={leadId} />

      <div className="space-y-4">
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

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">
            {draft ? `Draft ${draft.id.slice(0, 8)}` : "Create mini-audit draft"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {draft ? "Update the existing draft below." : "Start a new draft for this lead."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill value={(draft?.status ?? "DRAFT") as MiniAuditStatusValue} />
          <StatusPill value={(draft?.suggestedPackage ?? "UNKNOWN") as PackageFitValue} />
        </div>
      </div>

      {draft ? <input type="hidden" name="draftId" value={draft.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <DraftField
          label="Status"
          control={
            <select name="status" defaultValue={draft?.status ?? "DRAFT"} className="input">
              {MINI_AUDIT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          value={<StatusPill value={(draft?.status ?? "DRAFT") as MiniAuditStatusValue} />}
        />
        <DraftField
          label="Suggested package"
          control={
            <select name="suggestedPackage" defaultValue={draft?.suggestedPackage ?? "UNKNOWN"} className="input">
              {PACKAGE_FIT_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          value={<StatusPill value={(draft?.suggestedPackage ?? "UNKNOWN") as PackageFitValue} />}
        />
        <DraftField
          label="Problem 1"
          control={<input name="problem1" defaultValue={draft?.problem1 ?? ""} className="input" />}
          value="First core issue"
        />
        <DraftField
          label="Problem 2"
          control={<input name="problem2" defaultValue={draft?.problem2 ?? ""} className="input" />}
          value="Second core issue"
        />
        <DraftField
          label="Problem 3"
          control={<input name="problem3" defaultValue={draft?.problem3 ?? ""} className="input" />}
          value="Third core issue"
        />
        <DraftField
          label="Approved at"
          control={
            <input
              name="approvedAt"
              type="datetime-local"
              defaultValue={asDateTimeLocal(draft?.approvedAt)}
              className="input"
            />
          }
          value="Optional review timestamp"
        />
        <DraftField
          label="Recommendation"
          control={
            <textarea
              name="recommendation"
              rows={3}
              defaultValue={draft?.recommendation ?? ""}
              className="input min-h-24 resize-y md:col-span-2"
            />
          }
          value="Short recommendation summary"
        />
        <DraftField
          label="Outreach angle"
          control={
            <textarea
              name="outreachAngle"
              rows={3}
              defaultValue={draft?.outreachAngle ?? ""}
              className="input min-h-24 resize-y md:col-span-2"
            />
          }
          value="Lead-in for the first message"
        />
        <DraftField
          label="Draft message"
          control={
            <textarea
              name="draftMessage"
              rows={5}
              defaultValue={draft?.draftMessage ?? ""}
              className="input min-h-32 resize-y md:col-span-2"
            />
          }
          value="Prepared message text"
        />
        <DraftField
          label="Risk notes"
          control={
            <textarea
              name="riskNotes"
              rows={3}
              defaultValue={draft?.riskNotes ?? ""}
              className="input min-h-24 resize-y md:col-span-2"
            />
          }
          value="Potential objections or caveats"
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton>{draft ? "Save mini-audit draft" : "Create mini-audit draft"}</SubmitButton>
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
