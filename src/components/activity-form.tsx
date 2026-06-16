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
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Add manual activity</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Type"
          control={
            <select name="type" defaultValue="NOTE" className={fieldInputClassName}>
              {ACTIVITY_TYPE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          value={<StatusPill value={"NOTE" as ActivityTypeValue} appearance="light" />}
        />
        <Field
          label="Title"
          control={<input name="title" defaultValue="" className={fieldInputClassName} placeholder="Quick call summary" />}
          value="Short summary of what happened"
        />
        <Field
          label="Occurred at"
          control={<input name="occurredAt" type="datetime-local" className={fieldInputClassName} />}
          value="Defaults to now if empty"
        />
        <Field
          label="Body"
          control={
            <textarea
              name="body"
              rows={4}
              className={`${fieldInputClassName} min-h-28 resize-y`}
              placeholder="Notes, context, or next step..."
            />
          }
          value="Optional notes and context"
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
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-lg font-semibold text-slate-950">Activity timeline</h2>
      <div className="mt-4 space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">No activities yet.</p>
        ) : (
          activities.map((activity) => (
            <article key={activity.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={activity.type} appearance="light" />
                <h3 className="text-base font-medium text-slate-950">{activity.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">{activity.body ?? "-"}</p>
              <dl className="mt-3 grid gap-2 text-xs uppercase tracking-[0.24em] text-slate-500 sm:grid-cols-2">
                <div>
                  <dt>Occurred</dt>
                  <dd className="mt-1 normal-case tracking-normal text-slate-900">
                    {formatDate(activity.occurredAt)}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd className="mt-1 normal-case tracking-normal text-slate-900">
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
      <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
        {label}
      </span>
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
