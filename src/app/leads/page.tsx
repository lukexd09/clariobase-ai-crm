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
      <div className="w-full px-4 py-5 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-6">
        <header className="mb-5 grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:p-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Lead CRM</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Leads
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Review leads, filter the daily queue, and open each record for operational updates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Current filter
              </span>
              <span className="font-medium text-slate-900">
                {filters.status || filters.priority || filters.city || filters.packageFit
                  ? "Filtered view"
                  : "All leads"}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Visible rows
              </span>
              <span className="font-medium text-slate-900">{leads.length}</span>
            </div>
          </div>
        </header>

        <LeadTable leads={leads} filterControls={filterControls} />
      </div>
    </main>
  );
}
