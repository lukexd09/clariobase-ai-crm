import { getLeads } from "@/lib/leads";
import { LeadTable } from "@/components/lead-table";
import { LeadFilters } from "@/components/lead-filters";
import { LeadPriority, LeadStatus, PackageFit } from "@prisma/client";

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
  const filterControls = (
    <LeadFilters
      filters={filters}
      options={{
        status: ["", ...Object.values(LeadStatus)],
        priority: ["", ...Object.values(LeadPriority)],
        city: ["", "Warsaw", "Krakow", "Gdansk", "Poznan", "Wroclaw", "Lodz"],
        packageFit: ["", ...Object.values(PackageFit)]
      }}
    />
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Lead CRM</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leads</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            Review leads, filter the daily queue, and open each record for operational updates.
          </p>
        </header>

        <LeadTable
          leads={leads}
          filterControls={filterControls}
        />
      </div>
    </main>
  );
}
