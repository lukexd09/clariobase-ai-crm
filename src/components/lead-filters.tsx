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
    <form method="get" className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
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
      <div className="md:col-span-4 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
        >
          Apply filters
        </button>
        <Link
          href="/leads"
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200"
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
      <span className="block text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
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
