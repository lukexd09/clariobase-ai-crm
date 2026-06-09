"use client";

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
  const current = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) current.set(key, value);
  }

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(current);
    if (value) params.set(key, value);
    else params.delete(key);
    window.location.href = `/leads${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
      <FilterSelect
        label="Status"
        value={filters.status ?? ""}
        options={options.status}
        onChange={(value) => updateParam("status", value)}
      />
      <FilterSelect
        label="Priority"
        value={filters.priority ?? ""}
        options={options.priority}
        onChange={(value) => updateParam("priority", value)}
      />
      <FilterSelect
        label="City"
        value={filters.city ?? ""}
        options={options.city}
        onChange={(value) => updateParam("city", value)}
      />
      <FilterSelect
        label="Package fit"
        value={filters.packageFit ?? ""}
        options={options.packageFit}
        onChange={(value) => updateParam("packageFit", value)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <select
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
