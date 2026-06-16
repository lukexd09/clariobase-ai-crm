import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HealthPage() {
  noStore();

  const status = {
    service: "clariobase-ai-crm",
    status: "ok",
    timestamp: new Date().toISOString()
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">System status</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Health check
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Quick confirmation that the CRM is responding and serving the current runtime state.
          </p>
          <dl className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Service</dt>
              <dd className="font-mono text-slate-900">{status.service}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Status</dt>
              <dd className="font-semibold text-emerald-700">{status.status}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Timestamp</dt>
              <dd className="break-all font-mono text-slate-900">{status.timestamp}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
