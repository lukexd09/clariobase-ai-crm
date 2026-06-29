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
      className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--cb-ui-radius-lg)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <p className="text-sm text-[color:var(--cb-ui-muted-foreground)]">
        Page <span className="tabular-nums font-medium text-[color:var(--cb-ui-foreground)]">{page}</span> of{" "}
        <span className="tabular-nums font-medium text-[color:var(--cb-ui-foreground)]">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {previousPage ? (
          <Link
            href={buildLeadUrl(pathname, searchParams, { page: previousPage })}
            className="inline-flex h-9 items-center rounded-[var(--cb-ui-radius-md)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] px-3 text-sm font-medium text-[color:var(--cb-ui-foreground)] transition hover:border-[color:var(--cb-ui-primary)]/30 hover:bg-[color:var(--cb-ui-surface)] hover:text-[color:var(--cb-ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-ui-background)]"
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex h-9 items-center rounded-[var(--cb-ui-radius-md)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-surface)] px-3 text-sm font-medium text-[color:var(--cb-ui-muted-foreground)]"
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
                className="inline-flex h-9 items-center rounded-[var(--cb-ui-radius-md)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] px-3 text-sm font-medium text-[color:var(--cb-ui-foreground)] transition hover:border-[color:var(--cb-ui-primary)]/30 hover:bg-[color:var(--cb-ui-surface)] hover:text-[color:var(--cb-ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-ui-background)]"
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
            className="inline-flex h-9 items-center rounded-[var(--cb-ui-radius-md)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] px-3 text-sm font-medium text-[color:var(--cb-ui-foreground)] transition hover:border-[color:var(--cb-ui-primary)]/30 hover:bg-[color:var(--cb-ui-surface)] hover:text-[color:var(--cb-ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-ui-background)]"
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex h-9 items-center rounded-[var(--cb-ui-radius-md)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-surface)] px-3 text-sm font-medium text-[color:var(--cb-ui-muted-foreground)]"
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}

