"use client";

import { useFormStatus } from "react-dom";
import { LeadPriority, LeadStatus, PackageFit } from "@prisma/client";
import { useActionState } from "react";
import { updateLeadAction } from "@/app/leads/actions";
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
      className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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
  leadStatus: LeadStatus;
  priority: LeadPriority;
  packageFit: PackageFit;
  nextActionAt: string;
}) {
  const [state, formAction] = useActionState<LeadUpdateState, FormData>(
    async (_prevState, formData) => updateLeadAction(leadId, formData),
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Lead status" value={<StatusPill value={leadStatus} />} control={
          <select name="leadStatus" defaultValue={leadStatus} className="input">
            {Object.values(LeadStatus).map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        } />
        <Field label="Priority" value={<StatusPill value={priority} />} control={
          <select name="priority" defaultValue={priority} className="input">
            {Object.values(LeadPriority).map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        } />
        <Field label="Package fit" value={<StatusPill value={packageFit} />} control={
          <select name="packageFit" defaultValue={packageFit} className="input">
            {Object.values(PackageFit).map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        } />
        <Field
          label="Next action date"
          value={nextActionAt || "—"}
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
