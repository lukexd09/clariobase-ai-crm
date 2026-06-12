import { getLeads } from "@/lib/leads";
import { LeadTable } from "@/components/lead-table";
import { LeadFilters } from "@/components/lead-filters";
import { getLeadFilterOptions } from "@/lib/leads";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = {
    status: firstValue(params.status),
    priority: firstValue(params.priority),
    city: firstValue(params.city),
    packageFit: firstValue(params.packageFit)
  };
  const leads = await getLeads(filters);
  const filterOptions = await getLeadFilterOptions(filters);
  const filterControls = (
    <LeadFilters
      filters={filters}
      options={{
        status: ["", ...filterOptions.status],
        priority: ["", ...filterOptions.priority],
        city: ["", ...filterOptions.city],
        packageFit: ["", ...filterOptions.packageFit]
      }}
    />
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:p-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Lead CRM</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Leads
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Review leads, filter the daily queue, and open each record for operational updates.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Current filter
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                {filters.status || filters.priority || filters.city || filters.packageFit
                  ? "Filtered view"
                  : "All leads"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Visible rows
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{leads.length}</p>
            </div>
          </div>
        </header>

        <LeadTable leads={leads} filterControls={filterControls} />
      </div>
    </main>
  );
}
