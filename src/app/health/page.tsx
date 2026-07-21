import { unstable_noStore as noStore } from "next/cache";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HealthPage() {
  noStore();
  const { t } = await getI18n();

  const status = {
    service: "clariobase-ai-crm",
    status: "ok",
    timestamp: new Date().toISOString()
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">{t("health.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {t("health.title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("health.description")}
          </p>
          <dl className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{t("health.service")}</dt>
              <dd className="font-mono text-slate-900">{status.service}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{t("health.status")}</dt>
              <dd className="font-semibold text-emerald-700">{status.status}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{t("health.timestamp")}</dt>
              <dd className="break-all font-mono text-slate-900">{status.timestamp}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
