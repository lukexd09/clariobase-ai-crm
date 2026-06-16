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

const fieldInputClassName =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-sky-700 px-4 py-2 font-semibold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
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
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Lead status"
          value={<StatusPill value={leadStatus} appearance="light" />}
          control={
            <select name="leadStatus" defaultValue={leadStatus} className={fieldInputClassName}>
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
          value={<StatusPill value={priority} appearance="light" />}
          control={
            <select name="priority" defaultValue={priority} className={fieldInputClassName}>
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
          value={<StatusPill value={packageFit} appearance="light" />}
          control={
            <select name="packageFit" defaultValue={packageFit} className={fieldInputClassName}>
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
              className={fieldInputClassName}
            />
          }
        />
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton />
        {state.message ? (
          <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{state.message}</p>
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
      <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
        {label}
      </span>
      {control}
      <span className="block text-xs text-slate-500">{value}</span>
    </label>
  );
}
