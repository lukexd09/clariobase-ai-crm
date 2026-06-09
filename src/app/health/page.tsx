export default function HealthPage() {
  const status = {
    service: "clariobase-ai-crm",
    status: "ok",
    timestamp: new Date().toISOString()
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20">
          <h1 className="text-3xl font-semibold">Health check</h1>
          <dl className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between gap-6">
              <dt>Service</dt>
              <dd className="font-mono text-slate-100">{status.service}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt>Status</dt>
              <dd className="font-mono text-emerald-300">{status.status}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt>Timestamp</dt>
              <dd className="font-mono text-slate-100">{status.timestamp}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
