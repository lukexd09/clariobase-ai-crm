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
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">System status</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Health check</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Minimal runtime probe for deployment and uptime checks.
          </p>
          <dl className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Service</dt>
              <dd className="font-mono text-slate-900">{status.service}</dd>
            </div>
            <div className="flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-mono text-emerald-700">{status.status}</dd>
            </div>
            <div className="flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Timestamp</dt>
              <dd className="font-mono text-slate-900">{status.timestamp}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
