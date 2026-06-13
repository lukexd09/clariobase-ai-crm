import {
  Prisma,
  LeadPriority,
  LeadStatus,
  PackageFit
} from "@/generated/prisma/client";
import { DEFAULT_LEAD_PAGE_SIZE, getLeadPageWindow } from "@/lib/lead-pagination";
import { type LeadFilters } from "@/lib/lead-query";
import { prisma } from "@/lib/prisma";

export type LeadUpdateInput = {
  leadStatus: LeadStatus;
  priority: LeadPriority;
  packageFit: PackageFit;
  nextActionAt: Date | null;
};

const leadListSelect = {
  id: true,
  customerId: true,
  businessName: true,
  category: true,
  city: true,
  leadStatus: true,
  priority: true,
  packageFit: true,
  scoreTotal: true,
  scoreLabel: true,
  nextActionAt: true,
  updatedAt: true,
  lastImportedAt: true
} satisfies Prisma.LeadSelect;

export async function getLeads(filters: LeadFilters = {}) {
  return prisma.lead.findMany({
    where: buildLeadWhere(filters),
    orderBy: [{ updatedAt: "desc" }, { businessName: "asc" }],
    select: leadListSelect
  });
}

export async function getLeadPage(
  filters: LeadFilters = {},
  page = 1,
  pageSize = DEFAULT_LEAD_PAGE_SIZE
) {
  const where = buildLeadWhere(filters);
  const totalCount = await prisma.lead.count({ where });
  const pagination = getLeadPageWindow(page, totalCount, pageSize);
  const [, leads] = await prisma.$transaction([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { businessName: "asc" }, { id: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
      select: leadListSelect
    })
  ]);

  return {
    leads,
    ...pagination
  };
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id }
  });
}

export async function getLeadFilterOptions(filters: LeadFilters = {}) {
  const [statusRows, priorityRows, cityRows, packageRows] = await Promise.all([
    prisma.lead.findMany({
      where: buildLeadWhere({ ...filters, status: undefined }),
      select: { leadStatus: true }
    }),
    prisma.lead.findMany({
      where: buildLeadWhere({ ...filters, priority: undefined }),
      select: { priority: true }
    }),
    prisma.lead.findMany({
      where: buildLeadWhere({ ...filters, city: undefined }),
      select: { city: true }
    }),
    prisma.lead.findMany({
      where: buildLeadWhere({ ...filters, packageFit: undefined }),
      select: { packageFit: true }
    })
  ]);

  return {
    status: uniqueSorted(statusRows.map((row) => row.leadStatus)),
    priority: uniqueSorted(priorityRows.map((row) => row.priority)),
    city: uniqueSorted(cityRows.map((row) => row.city).filter(isDefined)),
    packageFit: uniqueSorted(packageRows.map((row) => row.packageFit))
  };
}

export async function updateLeadOperationalFields(id: string, input: LeadUpdateInput) {
  return prisma.lead.update({
    where: { id },
    data: {
      leadStatus: input.leadStatus,
      priority: input.priority,
      packageFit: input.packageFit,
      nextActionAt: input.nextActionAt
    }
  });
}

export function buildLeadWhere(filters: LeadFilters): Prisma.LeadWhereInput {
  return {
    ...(filters.status ? { leadStatus: filters.status as LeadStatus } : {}),
    ...(filters.priority ? { priority: filters.priority as LeadPriority } : {}),
    ...(filters.city
      ? {
          city: {
            contains: filters.city,
            mode: "insensitive"
          }
        }
      : {}),
    ...(filters.packageFit ? { packageFit: filters.packageFit as PackageFit } : {})
  };
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(isDefined))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function isDefined(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}
