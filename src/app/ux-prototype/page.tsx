import Link from "next/link";
import { PROTOTYPE_ROUTE_MAP } from "@/lib/ux-prototype";

export default function UxPrototypeHub() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-semibold text-slate-950">Prototype hub</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Use these routes to review the approval-ready experience without any production data or persistence.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PROTOTYPE_ROUTE_MAP.slice(1).map((route) => (
          <Link key={route.href} href={route.href} prefetch={false} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{route.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{("description" in route ? route.description : undefined) ?? "Prototype screen."}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
