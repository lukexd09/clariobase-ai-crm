import { getLeadFilterOptions, getLeadPage } from "@/lib/leads";
import { LeadTable } from "@/components/lead-table";
import { LeadFilters } from "@/components/lead-filters";
import { LeadPagination } from "@/components/lead-pagination";
import { formatLeadResultSummary, normalizeLeadFilters } from "@/lib/lead-query";
import { parseLeadPage } from "@/lib/lead-pagination";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = normalizeLeadFilters(params);
  const requestedPage = parseLeadPage(params.page);
  const leadPage = await getLeadPage(filters, requestedPage);
  const filterOptions = await getLeadFilterOptions(filters);
  const resultSummary = formatLeadResultSummary(
    leadPage.rangeStart,
    leadPage.rangeEnd,
    leadPage.totalCount
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Lead CRM</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
              Leads
            </h1>
          </div>
        </header>

        <LeadTable
          leads={leadPage.leads}
          filterControls={
            <LeadFilters
              filters={filters}
              options={{
                status: ["", ...filterOptions.status],
                priority: ["", ...filterOptions.priority],
                city: ["", ...filterOptions.city],
                packageFit: ["", ...filterOptions.packageFit]
              }}
              resultSummary={resultSummary}
            />
          }
        />

        <div className="mt-5">
          <LeadPagination
            pathname="/leads"
            searchParams={params}
            page={leadPage.page}
            totalPages={leadPage.totalPages}
          />
        </div>
      </div>
    </main>
  );
}
