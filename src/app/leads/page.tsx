import { getLeadFilterOptions, getLeadPage } from "@/lib/leads";
import { LeadTable } from "@/components/lead-table";
import { LeadFilters } from "@/components/lead-filters";
import { LeadPagination } from "@/components/lead-pagination";
import { formatLeadResultSummary, normalizeLeadFilters } from "@/lib/lead-query";
import { parseLeadPage } from "@/lib/lead-pagination";
import { PageSurface } from "@/components/core-work-primitives";
import { requireUser } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser({ mode: "redirect", returnTo: "/leads" });
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
      <PageSurface
        eyebrow="Workspace"
        title="Leads"
        description="Filter the queue, confirm the current result window, and open any record for deeper operator work."
      >
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
      </PageSurface>

      <div className="mt-4">
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
