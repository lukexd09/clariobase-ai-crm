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
  "w-full rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-4 py-3 text-sm text-[color:var(--cb-foreground)] outline-none transition placeholder:text-[color:var(--cb-muted-foreground)] focus-visible:border-[color:var(--cb-accent)] focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[color:var(--cb-accent)] px-4 py-2 font-semibold text-[color:var(--cb-accent-foreground)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)] disabled:cursor-not-allowed disabled:opacity-60"
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
      className="space-y-4 rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]"
    >
      <h3 className="text-lg font-semibold text-[color:var(--cb-foreground)]">Add manual activity</h3>
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
    <section className="rounded-[var(--cb-radius-xl)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] p-4 shadow-[var(--cb-shadow-surface)]">
      <h2 className="text-lg font-semibold text-[color:var(--cb-foreground)]">Activity timeline</h2>
      <div className="mt-4 space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-[color:var(--cb-muted-foreground)]">No activities yet.</p>
        ) : (
          activities.map((activity) => (
            <article key={activity.id} className="rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-4 shadow-[var(--cb-shadow-surface)]">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={activity.type} appearance="light" />
                <h3 className="text-base font-medium text-[color:var(--cb-foreground)]">{activity.title}</h3>
              </div>
              <p className="mt-2 text-sm text-[color:var(--cb-muted-foreground)]">{activity.body ?? "-"}</p>
              <dl className="mt-3 grid gap-2 text-xs uppercase tracking-[0.24em] text-[color:var(--cb-muted-foreground)] sm:grid-cols-2">
                <div>
                  <dt>Occurred</dt>
                  <dd className="mt-1 normal-case tracking-normal text-[color:var(--cb-foreground)]">
                    {formatDate(activity.occurredAt)}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd className="mt-1 normal-case tracking-normal text-[color:var(--cb-foreground)]">
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
      <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--cb-muted-foreground)]">
        {label}
      </span>
      {control}
      <span className="block text-xs leading-5 text-[color:var(--cb-muted-foreground)]">{hint}</span>
    </label>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}
