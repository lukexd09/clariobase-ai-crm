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
  nextActionAt,
  nextActionDisplay
}: {
  leadId: string;
  leadStatus: LeadStatusValue;
  priority: LeadPriorityValue;
  packageFit: PackageFitValue;
  nextActionAt: string;
  nextActionDisplay: string;
}) {
  const [state, formAction] = useActionState<LeadUpdateState, FormData>(
    async (_prevState, formData) => updateLeadAction(leadId, formData),
    initialState
  );
  const feedbackId = "lead-update-feedback";

  return (
    <form
      id="quick-update"
      action={formAction}
      aria-describedby={state.message ? feedbackId : undefined}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Lead status"
          hint="Choose the current working status for this lead."
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
          hint="Use the priority that best reflects follow-up urgency."
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
          hint="Keep the current package assessment aligned with the lead."
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
          label="Next action"
          hint={
            nextActionDisplay === "No next action set"
              ? "No next action is scheduled yet."
              : `Current schedule: ${nextActionDisplay}`
          }
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

function Field({
  label,
  control,
  hint
}: {
  label: string;
  control: React.ReactNode;
  hint: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
        {label}
      </span>
      {control}
      <span className="block text-xs leading-5 text-slate-500">{hint}</span>
    </label>
  );
}
