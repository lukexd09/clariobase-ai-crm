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
  "w-full rounded-2xl border border-[var(--clariobase-border)] bg-[var(--clariobase-surface-subtle)] px-4 py-3 text-sm text-[var(--clariobase-text-primary)] outline-none transition placeholder:text-[var(--clariobase-text-secondary)] focus-visible:border-[var(--clariobase-primary)] focus-visible:ring-2 focus-visible:ring-[var(--clariobase-primary)]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[var(--clariobase-primary)] px-4 py-2 font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clariobase-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
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
  const feedbackId = "activity-form-feedback";

  return (
    <form
      action={formAction}
      aria-describedby={state.message ? feedbackId : undefined}
      className="space-y-4 rounded-[24px] border border-[var(--clariobase-border)] bg-[var(--clariobase-surface)] p-4"
    >
      <h3 className="text-lg font-semibold text-[var(--clariobase-text-primary)]">Add manual activity</h3>
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
          hint={<StatusPill value={"NOTE" as ActivityTypeValue} appearance="light" />}
        />
        <Field
          label="Title"
          className="md:col-span-2"
          control={<input name="title" defaultValue="" className={fieldInputClassName} placeholder="Quick call summary" />}
          hint="Use a short summary that is still easy to scan later."
        />
        <Field
          label="Occurred at"
          control={<input name="occurredAt" type="datetime-local" className={fieldInputClassName} />}
          hint="If left empty, the activity uses the current local time."
        />
        <Field
          label="Body"
          className="md:col-span-2"
          control={
            <textarea
              name="body"
              rows={4}
              className={`${fieldInputClassName} min-h-28 resize-y`}
              placeholder="Notes, context, or next step..."
            />
          }
          hint="Capture the key outcome, context, or next step."
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
    <section className="rounded-[24px] border border-[var(--clariobase-border)] bg-[var(--clariobase-surface)] p-4">
      <h2 className="text-lg font-semibold text-[var(--clariobase-text-primary)]">Activity timeline</h2>
      <div className="mt-4 space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-[var(--clariobase-text-secondary)]">No activities yet.</p>
        ) : (
          activities.map((activity) => (
            <article key={activity.id} className="rounded-2xl border border-[var(--clariobase-border)] bg-[var(--clariobase-surface-subtle)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={activity.type} appearance="light" />
                <h3 className="text-base font-medium text-[var(--clariobase-text-primary)]">{activity.title}</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--clariobase-text-secondary)]">{activity.body ?? "-"}</p>
              <dl className="mt-3 grid gap-2 text-xs uppercase tracking-[0.24em] text-[var(--clariobase-text-secondary)] sm:grid-cols-2">
                <div>
                  <dt>Occurred</dt>
                  <dd className="mt-1 normal-case tracking-normal text-[var(--clariobase-text-primary)]">
                    {formatDate(activity.occurredAt)}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd className="mt-1 normal-case tracking-normal text-[var(--clariobase-text-primary)]">
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
  hint,
  className
}: {
  label: string;
  control: React.ReactNode;
  hint: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className ?? ""}`}>
      <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--clariobase-text-secondary)]">
        {label}
      </span>
      {control}
      <span className="block text-xs leading-5 text-[var(--clariobase-text-secondary)]">{hint}</span>
    </label>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}
