"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateLeadAction } from "@/app/leads/actions";
import {
  LEAD_PRIORITY_VALUES,
  LEAD_STATUS_VALUES,
  PACKAGE_FIT_VALUES,
  type LeadPriorityValue,
  type LeadStatusValue,
  type PackageFitValue
} from "@/lib/lead-values";
import { StatusPill } from "@/components/lead-status-pill";

type LeadUpdateState = {
  ok: boolean;
  message: string;
};

const initialState: LeadUpdateState = {
  ok: true,
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[#22D3EE] px-4 py-2 font-semibold text-[#00363e] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save updates"}
    </button>
  );
}

export function LeadUpdateForm({
  leadId,
  leadStatus,
  priority,
  packageFit,
  nextActionAt
}: {
  leadId: string;
  leadStatus: LeadStatusValue;
  priority: LeadPriorityValue;
  packageFit: PackageFitValue;
  nextActionAt: string;
}) {
  const [state, formAction] = useActionState<LeadUpdateState, FormData>(
    async (_prevState, formData) => updateLeadAction(leadId, formData),
    initialState
  );

  return (
    <form
      id="quick-update"
      action={formAction}
      className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0A0C10]/80 p-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Lead status"
          value={<StatusPill value={leadStatus} />}
          control={
            <select name="leadStatus" defaultValue={leadStatus} className="input">
              {LEAD_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Priority"
          value={<StatusPill value={priority} />}
          control={
            <select name="priority" defaultValue={priority} className="input">
              {LEAD_PRIORITY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Package fit"
          value={<StatusPill value={packageFit} />}
          control={
            <select name="packageFit" defaultValue={packageFit} className="input">
              {PACKAGE_FIT_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Next action date"
          value={nextActionAt || "-"}
          control={
            <input
              name="nextActionAt"
              type="datetime-local"
              defaultValue={nextActionAt}
              className="input"
            />
          }
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton />
        {state.message ? (
          <p className={state.ok ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  control,
  value
}: {
  label: string;
  control: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      {control}
      <span className="block text-xs text-slate-500">{value}</span>
    </label>
  );
}
