import { getLeadFilterOptions, getLeadPage } from "@/lib/leads";
import { LeadTable } from "@/components/lead-table";
import { LeadFilters } from "@/components/lead-filters";
import { LeadPagination } from "@/components/lead-pagination";
import { formatLeadResultSummary, normalizeLeadFilters } from "@/lib/lead-query";
import { parseLeadPage } from "@/lib/lead-pagination";
import { PageSurface } from "@/components/core-work-primitives";
import { requireUser } from "@/lib/auth-context";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser({ mode: "redirect", returnTo: "/leads" });
  const { t, formatNumber } = await getI18n();
  const params = await searchParams;
  const filters = normalizeLeadFilters(params);
  const requestedPage = parseLeadPage(params.page);
  const leadPage = await getLeadPage(filters, requestedPage);
  const filterOptions = await getLeadFilterOptions(filters);
  const resultSummary = formatLeadResultSummary(
    leadPage.rangeStart,
    leadPage.rangeEnd,
    leadPage.totalCount,
    t,
    formatNumber
  );

  return (
    <div className="space-y-4">
      <PageSurface
        eyebrow={t("leads.eyebrow")}
        title={t("leads.title")}
        description={t("leads.description")}
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
