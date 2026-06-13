export const DEFAULT_LEAD_PAGE_SIZE = 50;

export function parseLeadPage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function getLeadPageWindow(
  page: number,
  totalCount: number,
  pageSize = DEFAULT_LEAD_PAGE_SIZE
) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const skip = totalCount === 0 ? 0 : (currentPage - 1) * pageSize;
  const take = pageSize;
  const rangeStart = totalCount === 0 ? 0 : skip + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(skip + take, totalCount);

  return {
    page: currentPage,
    pageSize,
    totalCount,
    totalPages,
    rangeStart,
    rangeEnd,
    skip,
    take
  };
}

export type LeadPaginationItem =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

export function getLeadPaginationItems(page: number, totalPages: number): LeadPaginationItem[] {
  if (totalPages <= 1) {
    return [{ type: "page", page: 1 }];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: "page",
      page: index + 1
    })) as LeadPaginationItem[];
  }

  const items: LeadPaginationItem[] = [];
  const addPage = (itemPage: number) => {
    if (!items.some((item) => item.type === "page" && item.page === itemPage)) {
      items.push({ type: "page", page: itemPage });
    }
  };

  const startPages = [1];
  const middlePages = [page - 1, page, page + 1].filter(
    (value) => value > 1 && value < totalPages
  );
  const endPages = [totalPages];

  for (const itemPage of startPages) addPage(itemPage);

  if (middlePages[0] && middlePages[0] > 2) {
    items.push({ type: "ellipsis", key: "start" });
  }

  for (const itemPage of middlePages) addPage(itemPage);

  if (middlePages.length > 0 && middlePages[middlePages.length - 1] < totalPages - 1) {
    items.push({ type: "ellipsis", key: "end" });
  }

  for (const itemPage of endPages) addPage(itemPage);

  return items;
}
