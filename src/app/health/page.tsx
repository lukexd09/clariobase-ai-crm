import { unstable_noStore as noStore } from "next/cache";
import { Badge, Surface, SurfaceContent, SurfaceDescription, SurfaceHeader } from "@/components/clariobase-ui";
import { TechnicalDisclosure } from "@/components/data-quality-primitives";
import { getI18n } from "@/i18n/server";
import { getRuntimeReadiness } from "@/lib/runtime-readiness";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HealthPage() {
  noStore();
  const [{ body }, { t, formatDateTime }] = await Promise.all([
    getRuntimeReadiness(),
    getI18n()
  ]);
  const checks = [
    {
      key: "application",
      label: t("health.application"),
      status: body.status === "ready" ? t("health.working") : t("health.needsAttention"),
      tone: body.status === "ready" ? "success" : "danger"
    },
    {
      key: "database",
      label: t("health.database"),
      status: body.checks.database === "ok" ? t("health.available") : t("health.unavailable"),
      tone: body.checks.database === "ok" ? "success" : "danger"
    },
    {
      key: "authentication",
      label: t("health.authentication"),
      status: body.checks.authentication === "ok" ? t("health.configured") : t("health.needsConfiguration"),
      tone: body.checks.authentication === "ok" ? "success" : "warning"
    }
  ] as const;

  return (
    <div className="space-y-5">
      <Surface>
        <SurfaceHeader>
          <p className="text-sm font-medium text-[color:var(--cb-accent)]">{t("health.eyebrow")}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--cb-foreground)] sm:text-3xl">{t("health.title")}</h1>
          <SurfaceDescription>{t("health.description")}</SurfaceDescription>
        </SurfaceHeader>
        <SurfaceContent className="space-y-5">
          <dl className="grid gap-3 md:grid-cols-3">
            {checks.map((check) => (
              <div key={check.key} className="rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-background)] p-4">
                <dt className="text-sm font-medium text-[color:var(--cb-muted-foreground)]">{check.label}</dt>
                <dd className="mt-2"><Badge tone={check.tone}>{check.status}</Badge></dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-[color:var(--cb-border)] pt-4">
            <p className="text-sm text-[color:var(--cb-muted-foreground)]">{t("health.lastCheck")}</p>
            <p className="mt-1 font-medium text-[color:var(--cb-foreground)]">{formatDateTime(body.timestamp)}</p>
          </div>

          <TechnicalDisclosure title={t("health.technicalDetails")}>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-[color:var(--cb-foreground)]">{t("health.service")}</dt>
                <dd className="break-all font-mono">{body.service}</dd>
              </div>
              <div>
                <dt className="font-medium text-[color:var(--cb-foreground)]">{t("health.status")}</dt>
                <dd className="break-all font-mono">{body.status}</dd>
              </div>
              <div>
                <dt className="font-medium text-[color:var(--cb-foreground)]">{t("health.database")}</dt>
                <dd className="break-all font-mono">{body.checks.database}</dd>
              </div>
              <div>
                <dt className="font-medium text-[color:var(--cb-foreground)]">{t("health.authentication")}</dt>
                <dd className="break-all font-mono">{body.checks.authentication}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-[color:var(--cb-foreground)]">{t("health.timestamp")}</dt>
                <dd className="break-all font-mono">{body.timestamp}</dd>
              </div>
            </dl>
          </TechnicalDisclosure>
        </SurfaceContent>
      </Surface>
    </div>
  );
}
