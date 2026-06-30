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
    <div className="space-y-4">
      <header className="rounded-[var(--cb-ui-radius-lg)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] min-[768px]:p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--cb-ui-primary)]">Creator workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--cb-ui-foreground)] sm:text-3xl">
            Leads
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--cb-ui-muted-foreground)]">
            Filter the queue, confirm the current result window, and open any lead for deeper operator work.
          </p>
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

      <div>
        <LeadPagination
          pathname="/leads"
          searchParams={params}
          page={leadPage.page}
          totalPages={leadPage.totalPages}
        />
      </div>
    </div>
  );
}
