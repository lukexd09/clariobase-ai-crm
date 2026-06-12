import Link from "next/link";

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
  options
}: {
  filters: Record<string, string | undefined>;
  options: FilterOptions;
}) {
  return (
    <form method="get" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <fieldset>
        <legend className="sr-only">Filter leads</legend>

        <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(150px,1fr))_auto]">
          <FilterSelect label="Status" name="status" value={filters.status ?? ""} options={options.status} />
          <FilterSelect
            label="Priority"
            name="priority"
            value={filters.priority ?? ""}
            options={options.priority}
          />
          <FilterSelect label="City" name="city" value={filters.city ?? ""} options={options.city} />
          <FilterSelect
            label="Package fit"
            name="packageFit"
            value={filters.packageFit ?? ""}
            options={options.packageFit}
          />
          <div className="flex items-center gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Apply filters
            </button>
            <Link
              href="/leads"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Clear filters
            </Link>
          </div>
        </div>
      </fieldset>

      {(
        [
          ["status", filters.status],
          ["priority", filters.priority],
          ["city", filters.city],
          ["packageFit", filters.packageFit]
        ] as const
      ).some(([, value]) => Boolean(value)) ? (
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
                className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700"
              >
                <span className="text-slate-500">{filterLabels[key]}:</span>
                <span className="ml-1 text-slate-900">{formatFilterValue(value)}</span>
              </li>
            ) : null
          )}
        </ul>
      ) : null}
    </form>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
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
