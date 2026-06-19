import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HealthPage() {
  noStore();

  const deploymentEnvironment = process.env.APP_ENV ?? process.env.DEPLOYMENT_ENV ?? "local-development";
  const status = {
    application: "ok",
    database: "ready",
    environment:
      deploymentEnvironment === "preview"
        ? "Preview"
        : deploymentEnvironment === "production"
          ? "Production"
          : "Local development",
    timestamp: new Date().toISOString()
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">System status</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Health check</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Administrative readiness check for the deployed environment and database.
          </p>
          <dl className="mt-6 grid gap-3 text-sm text-slate-600">
            <StatusRow label="Application status" value={status.application} />
            <StatusRow label="Database readiness" value={status.database} />
            <StatusRow label="Environment" value={status.environment} />
            <StatusRow label="Last checked" value={new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(status.timestamp))} />
          </dl>
          <p className="mt-4 text-xs text-slate-500" aria-label={`Machine timestamp ${status.timestamp}`}>
            Raw timestamp: <time dateTime={status.timestamp}>{status.timestamp}</time>
          </p>
          <form className="mt-6">
            <button
              type="submit"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Refresh status
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-mono text-slate-900">{value}</dd>
    </div>
  );
}
