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
      className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="text-lg font-medium">Add manual activity</h3>
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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-medium">Activity timeline</h2>
      <div className="mt-4 space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-400">No activities yet.</p>
        ) : (
          activities.map((activity) => (
            <article key={activity.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={activity.type} />
                <h3 className="text-base font-medium">{activity.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-300">{activity.body ?? "-"}</p>
              <dl className="mt-3 grid gap-2 text-xs uppercase tracking-[0.25em] text-slate-500 sm:grid-cols-2">
                <div>
                  <dt>Occurred</dt>
                  <dd className="mt-1 normal-case tracking-normal text-slate-300">
                    {formatDate(activity.occurredAt)}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd className="mt-1 normal-case tracking-normal text-slate-300">
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
