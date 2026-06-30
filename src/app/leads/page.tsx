import { getLeadFilterOptions, getLeadPage } from "@/lib/leads";
import { LeadTable } from "@/components/lead-table";
import { LeadFilters } from "@/components/lead-filters";
import { LeadPagination } from "@/components/lead-pagination";
import { formatLeadResultSummary, normalizeLeadFilters } from "@/lib/lead-query";
import { parseLeadPage } from "@/lib/lead-pagination";
import {
  ProofCard,
  ProofCardDescription,
  ProofCardHeader,
  ProofCardTitle
} from "@/components/clariobase-ui/proof-card";

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
    <div data-ui-foundation="shadboard-proof" className="space-y-4">
      <ProofCard className="mb-4 p-4 lg:p-5">
        <ProofCardHeader className="p-0">
          <p className="text-sm font-medium text-[color:var(--cb-accent)]">Lead CRM</p>
          <ProofCardTitle className="text-2xl text-[color:var(--cb-foreground)] sm:text-3xl">
            Leads
          </ProofCardTitle>
          <ProofCardDescription className="text-sm leading-6">
            Filter the queue, confirm the current result window, and open any lead for deeper operator work.
          </ProofCardDescription>
        </ProofCardHeader>
      </ProofCard>

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
