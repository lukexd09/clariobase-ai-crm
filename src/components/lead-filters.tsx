import Link from "next/link";

type FilterOptions = {
  status: string[];
  priority: string[];
  city: string[];
  packageFit: string[];
};

export function LeadFilters({
  filters,
  options
}: {
  filters: Record<string, string | undefined>;
  options: FilterOptions;
}) {
  return (
    <form
      method="get"
      className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4"
    >
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
      <div className="flex flex-wrap items-center gap-3 md:col-span-4">
        <button
          type="submit"
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Apply filters
        </button>
        <Link
          href="/leads"
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Clear filters
        </Link>
      </div>
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
    <label className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-200"
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
