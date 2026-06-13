import Link from "next/link";
import { buildLeadUrl, type LeadSearchParamsInput } from "@/lib/lead-query";
import { getLeadPaginationItems } from "@/lib/lead-pagination";

export function LeadPagination({
  pathname,
  searchParams,
  page,
  totalPages
}: {
  pathname: string;
  searchParams: LeadSearchParamsInput;
  page: number;
  totalPages: number;
}) {
  const pages = getLeadPaginationItems(page, totalPages);
  const previousPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <nav
      aria-label="Lead pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <p className="text-sm text-slate-600">
        Page <span className="tabular-nums font-medium text-slate-900">{page}</span> of{" "}
        <span className="tabular-nums font-medium text-slate-900">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {previousPage ? (
          <Link
            href={buildLeadUrl(pathname, searchParams, { page: previousPage })}
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-400"
          >
            Previous
          </span>
        )}

        {pages.map((item) =>
          item.type === "page" ? (
            item.page === page ? (
              <span
                key={item.page}
                aria-current="page"
                className="inline-flex h-9 items-center rounded-lg border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-800"
              >
                {item.page}
              </span>
            ) : (
              <Link
                key={item.page}
                href={buildLeadUrl(pathname, searchParams, { page: item.page })}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {item.page}
              </Link>
            )
          ) : (
            <span key={item.key} className="px-1 text-sm text-slate-400">
              ...
            </span>
          )
        )}

        {nextPage ? (
          <Link
            href={buildLeadUrl(pathname, searchParams, { page: nextPage })}
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-400"
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}

