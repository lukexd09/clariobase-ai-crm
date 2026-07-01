import Link from "next/link";
import { ButtonLink } from "@/components/clariobase-ui";
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
    <nav aria-label="Lead pagination" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-3">
      <p className="text-sm text-[color:var(--cb-muted-foreground)]">
        Page <span className="tabular-nums font-medium text-[color:var(--cb-foreground)]">{page}</span> of{" "}
        <span className="tabular-nums font-medium text-[color:var(--cb-foreground)]">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {previousPage ? (
          <ButtonLink href={buildLeadUrl(pathname, searchParams, { page: previousPage })} variant="secondary" className="min-h-9 px-3 py-1.5">
            Previous
          </ButtonLink>
        ) : (
          <span aria-disabled="true" className="inline-flex min-h-9 items-center rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 text-sm font-medium text-[color:var(--cb-muted-foreground)]">
            Previous
          </span>
        )}

        {pages.map((item) =>
          item.type === "page" ? (
            item.page === page ? (
              <span
                key={item.page}
                aria-current="page"
                className="inline-flex min-h-9 items-center rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 text-sm font-semibold text-[color:var(--cb-foreground)]"
              >
                {item.page}
              </span>
            ) : (
              <Link
                key={item.page}
                href={buildLeadUrl(pathname, searchParams, { page: item.page })}
                className="inline-flex min-h-9 items-center rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 text-sm font-medium text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)]/35 hover:bg-[color:var(--cb-surface)] hover:text-[color:var(--cb-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)]"
              >
                {item.page}
              </Link>
            )
          ) : (
            <span key={item.key} className="px-1 text-sm text-[color:var(--cb-muted-foreground)]">
              ...
            </span>
          )
        )}

        {nextPage ? (
          <ButtonLink href={buildLeadUrl(pathname, searchParams, { page: nextPage })} variant="secondary" className="min-h-9 px-3 py-1.5">
            Next
          </ButtonLink>
        ) : (
          <span aria-disabled="true" className="inline-flex min-h-9 items-center rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3 text-sm font-medium text-[color:var(--cb-muted-foreground)]">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}

