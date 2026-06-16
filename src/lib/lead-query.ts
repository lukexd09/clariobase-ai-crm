export type LeadFilters = {
  status?: string;
  priority?: string;
  city?: string;
  packageFit?: string;
};

export type LeadFilterKey = keyof LeadFilters;

export type LeadSearchParamsInput = string | Record<string, string | string[] | undefined>;

const leadFilterKeys: LeadFilterKey[] = ["status", "priority", "city", "packageFit"];

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readLeadFilters(input: LeadSearchParamsInput) {
  if (typeof input === "string") {
    const params = new URLSearchParams(input);

    return {
      status: params.get("status") ?? undefined,
      priority: params.get("priority") ?? undefined,
      city: params.get("city") ?? undefined,
      packageFit: params.get("packageFit") ?? undefined,
      page: params.get("page") ?? undefined
    };
  }

  return {
    status: firstValue(input.status),
    priority: firstValue(input.priority),
    city: firstValue(input.city),
    packageFit: firstValue(input.packageFit),
    page: firstValue(input.page)
  };
}

export function normalizeLeadFilters(input: LeadSearchParamsInput): LeadFilters {
  const filters = readLeadFilters(input);

  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.packageFit ? { packageFit: filters.packageFit } : {})
  };
}

export function buildLeadUrl(
  pathname: string,
  currentSearchParams: LeadSearchParamsInput,
  updates: Partial<Record<LeadFilterKey, string | null>> & { page?: number | null } = {}
) {
  const current = readLeadFilters(currentSearchParams);
  const next = { ...current };
  const filterChanged = leadFilterKeys.some((key) =>
    Object.prototype.hasOwnProperty.call(updates, key)
  );

  for (const key of leadFilterKeys) {
    if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;

    const value = updates[key];
    if (typeof value === "string" && value.length > 0) {
      next[key] = value;
    } else {
      delete next[key];
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, "page")) {
    const page = updates.page;

    if (typeof page === "number" && Number.isFinite(page) && page > 1) {
      next.page = String(Math.floor(page));
    } else {
      delete next.page;
    }
  } else if (filterChanged) {
    delete next.page;
  }

  const params = new URLSearchParams();

  for (const key of leadFilterKeys) {
    const value = next[key];
    if (value) {
      params.set(key, value);
    }
  }

  if (next.page) {
    params.set("page", next.page);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function formatLeadResultSummary(
  rangeStart: number,
  rangeEnd: number,
  totalCount: number
) {
  if (totalCount === 0) {
    return "0 leads";
  }

  const formatter = new Intl.NumberFormat("en-US");
  const noun = totalCount === 1 ? "lead" : "leads";

  return `${formatter.format(rangeStart)}-${formatter.format(rangeEnd)} of ${formatter.format(totalCount)} ${noun}`;
}
