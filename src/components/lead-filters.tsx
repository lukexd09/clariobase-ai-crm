"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Badge, Button, Label, Select } from "@/components/clariobase-ui";
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
    <section aria-busy={isPending} className="space-y-4 rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex min-h-10 items-center gap-2 rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] px-3">
          <span className="text-sm font-medium text-[color:var(--cb-muted-foreground)]">Result summary</span>
          <span className="text-sm font-semibold tabular-nums text-[color:var(--cb-foreground)]">{resultSummary}</span>
        </div>
        <div className="flex items-center gap-2">
          {isPending ? <span className="text-xs font-medium text-[color:var(--cb-muted-foreground)]" aria-live="polite">Updating...</span> : null}
          {hasActiveFilters ? (
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      <fieldset>
        <legend className="sr-only">Filter leads</legend>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label="Status" name="status" value={filters.status ?? ""} options={options.status} onChange={(value) => updateFilter("status", value)} />
          <FilterSelect label="Priority" name="priority" value={filters.priority ?? ""} options={options.priority} onChange={(value) => updateFilter("priority", value)} />
          <FilterSelect label="City" name="city" value={filters.city ?? ""} options={options.city} onChange={(value) => updateFilter("city", value)} />
          <FilterSelect label="Package fit" name="packageFit" value={filters.packageFit ?? ""} options={options.packageFit} onChange={(value) => updateFilter("packageFit", value)} />
        </div>
      </fieldset>

      {hasActiveFilters ? (
        <ul aria-label="Active filters" className="flex flex-wrap gap-2">
          {(
            [
              ["status", filters.status],
              ["priority", filters.priority],
              ["city", filters.city],
              ["packageFit", filters.packageFit]
            ] as const
          ).map(([key, value]) =>
            value ? (
              <li key={key}>
                <Badge tone="neutral">{filterLabels[key]}: {formatFilterValue(value)}</Badge>
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
      <Label className="block text-sm font-medium text-[color:var(--cb-foreground)]">{label}</Label>
      <Select name={name} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || "all"} value={option}>
            {option ? option.replaceAll("_", " ") : "All"}
          </option>
        ))}
      </Select>
    </label>
  );
}
