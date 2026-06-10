"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createLeadActivityAction } from "@/app/leads/activity-actions";
import { ACTIVITY_TYPE_VALUES, type ActivityTypeValue } from "@/lib/activity-values";
import { StatusPill } from "@/components/lead-status-pill";

type ActivityFormState = {
  ok: boolean;
  message: string;
};

const initialState: ActivityFormState = {
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
      {pending ? "Saving..." : "Add activity"}
    </button>
  );
}

export function ActivityForm({ leadId }: { leadId: string }) {
  const [state, formAction] = useActionState<ActivityFormState, FormData>(
    async (_prevState, formData) => createLeadActivityAction(leadId, formData),
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-[#1E293B] bg-[#11141D] p-6">
      <h3 className="text-lg font-semibold text-[#F0F4F9]">Add manual activity</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Type"
          control={
            <select name="type" defaultValue="NOTE" className="input">
              {ACTIVITY_TYPE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          value={<StatusPill value={"NOTE" as ActivityTypeValue} />}
        />
        <Field
          label="Title"
          control={<input name="title" defaultValue="" className="input" placeholder="Quick call summary" />}
          value="Short summary of what happened"
        />
        <Field
          label="Occurred at"
          control={<input name="occurredAt" type="datetime-local" className="input" />}
          value="Defaults to now if empty"
        />
        <Field
          label="Body"
          control={<textarea name="body" rows={4} className="input min-h-28 resize-y" placeholder="Notes, context, or next step..." />}
          value="Optional notes and context"
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

export function ActivityTimeline({
  activities
}: {
  activities: {
    id: string;
    type: ActivityTypeValue;
    title: string;
    body: string | null;
    occurredAt: Date;
    createdAt: Date;
  }[];
}) {
  return (
    <section className="rounded-3xl border border-[#1E293B] bg-[#11141D] p-6">
      <h2 className="text-lg font-semibold text-[#F0F4F9]">Activity timeline</h2>
      <div className="mt-4 space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">No activities yet.</p>
        ) : (
          activities.map((activity) => (
            <article key={activity.id} className="rounded-2xl border border-[#1E293B] bg-[#0A0C10] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={activity.type} />
                <h3 className="text-base font-medium text-[#F0F4F9]">{activity.title}</h3>
              </div>
              <p className="mt-2 text-sm text-[#94A3B8]">{activity.body ?? "-"}</p>
              <dl className="mt-3 grid gap-2 text-xs uppercase tracking-[0.25em] text-[#94A3B8] sm:grid-cols-2">
                <div>
                  <dt>Occurred</dt>
                  <dd className="mt-1 normal-case tracking-normal text-[#F0F4F9]">
                    {formatDate(activity.occurredAt)}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd className="mt-1 normal-case tracking-normal text-[#F0F4F9]">
                    {formatDate(activity.createdAt)}
                  </dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </section>
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}
