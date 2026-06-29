"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { buildLeadUrl, type LeadFilters as LeadFilterState } from "@/lib/lead-query";

type FilterOptions = {
  status: string[];
  priority: string[];
  city: string[];
  packageFit: string[];
};

const filterLabels: Record<keyof FilterOptions, string> = {
  status: "Status",
  priority: "Priority",
  city: "City",
  packageFit: "Package"
};

function formatFilterValue(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function LeadFilters({
  filters,
  options,
  resultSummary
}: {
  filters: LeadFilterState;
  options: FilterOptions;
  resultSummary: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasActiveFilters = Boolean(
    filters.status || filters.priority || filters.city || filters.packageFit
  );
  const searchParamsValue = searchParams.toString();

  function updateFilter(name: keyof LeadFilterState, value: string) {
    startTransition(() => {
      router.replace(buildLeadUrl(pathname, searchParamsValue, { [name]: value || null }), {
        scroll: false
      });
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.replace(buildLeadUrl(pathname, searchParamsValue, {
        status: null,
        priority: null,
        city: null,
        packageFit: null,
        page: 1
      }), {
        scroll: false
      });
    });
  }

  return (
    <section
      aria-busy={isPending}
      className="rounded-[var(--cb-ui-radius-lg)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--cb-ui-radius-md)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-surface)] px-3 text-sm font-medium text-[color:var(--cb-ui-muted-foreground)]">
          <span className="tabular-nums text-[color:var(--cb-ui-foreground)]">{resultSummary}</span>
        </div>

        <div className="flex items-center gap-2">
          {isPending ? (
            <span className="text-xs font-medium text-[color:var(--cb-ui-muted-foreground)]" aria-live="polite">
              Updating...
            </span>
          ) : null}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[var(--cb-ui-radius-md)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] px-4 text-sm font-medium text-[color:var(--cb-ui-foreground)] transition hover:border-[color:var(--cb-ui-primary)]/30 hover:bg-[color:var(--cb-ui-surface)] hover:text-[color:var(--cb-ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-ui-background)]"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <fieldset>
        <legend className="sr-only">Filter leads</legend>

        <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(150px,1fr))]">
          <FilterSelect
            label="Status"
            name="status"
            value={filters.status ?? ""}
            options={options.status}
            onChange={(value) => updateFilter("status", value)}
          />
          <FilterSelect
            label="Priority"
            name="priority"
            value={filters.priority ?? ""}
            options={options.priority}
            onChange={(value) => updateFilter("priority", value)}
          />
          <FilterSelect
            label="City"
            name="city"
            value={filters.city ?? ""}
            options={options.city}
            onChange={(value) => updateFilter("city", value)}
          />
          <FilterSelect
            label="Package fit"
            name="packageFit"
            value={filters.packageFit ?? ""}
            options={options.packageFit}
            onChange={(value) => updateFilter("packageFit", value)}
          />
        </div>
      </fieldset>

      {hasActiveFilters ? (
        <ul aria-label="Active filters" className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["status", filters.status],
              ["priority", filters.priority],
              ["city", filters.city],
              ["packageFit", filters.packageFit]
            ] as const
          ).map(([key, value]) =>
            value ? (
              <li
                key={key}
                className="inline-flex min-h-9 items-center rounded-full border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-surface)] px-3 text-sm font-medium text-[color:var(--cb-ui-foreground)]"
              >
                <span className="text-[color:var(--cb-ui-muted-foreground)]">{filterLabels[key]}:</span>
                <span className="ml-1 text-[color:var(--cb-ui-foreground)]">{formatFilterValue(value)}</span>
              </li>
            ) : null
          )}
        </ul>
      ) : null}
    </section>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
  onChange
}: {
  label: string;
  name: keyof FilterOptions;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-sm font-medium text-[color:var(--cb-ui-foreground)]">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-[var(--cb-ui-radius-md)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-background)] px-3 text-sm text-[color:var(--cb-ui-foreground)] outline-none transition focus:border-[color:var(--cb-ui-ring)] focus:ring-2 focus:ring-[color:var(--cb-ui-ring)]/20"
      >
        {options.map((option) => (
          <option key={option || "all"} value={option}>
            {option ? option.replaceAll("_", " ") : "All"}
          </option>
        ))}
      </select>
    </label>
  );
}
