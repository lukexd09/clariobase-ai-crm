import { getLeadFilterOptions, getLeadPage } from "@/lib/leads";
import { LeadTable } from "@/components/lead-table";
import { LeadFilters } from "@/components/lead-filters";
import { LeadPagination } from "@/components/lead-pagination";
import { formatLeadResultSummary, normalizeLeadFilters } from "@/lib/lead-query";
import { parseLeadPage } from "@/lib/lead-pagination";
import { ProofCard } from "@/components/clariobase-ui/proof-card";
import { ProofShell } from "@/components/clariobase-ui/proof-shell";

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
    <ProofShell pathname="/leads">
      <main className="min-h-screen bg-[linear-gradient(180deg,var(--cb-ui-surface)_0%,var(--cb-ui-background)_100%)]">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 lg:py-5">
          <ProofCard className="mb-4 p-4 lg:p-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[color:var(--cb-ui-primary)]">Lead CRM</p>
              <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--cb-ui-foreground)] sm:text-3xl">
                Leads
              </h1>
              <p className="text-sm leading-6 text-[color:var(--cb-ui-muted-foreground)]">
                Filter the queue, confirm the current result window, and open any lead for deeper operator work.
              </p>
            </div>
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
      </main>
    </ProofShell>
  );
}
