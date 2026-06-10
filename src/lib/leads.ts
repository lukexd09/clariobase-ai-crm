import {
  Prisma,
  LeadPriority,
  LeadStatus,
  PackageFit
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type LeadFilters = {
  status?: string;
  priority?: string;
  city?: string;
  packageFit?: string;
};

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
    where: {
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
      ...(filters.packageFit
        ? { packageFit: filters.packageFit as PackageFit }
        : {})
    },
    orderBy: [{ updatedAt: "desc" }, { businessName: "asc" }],
    select: leadListSelect
  });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id }
  });
}

export async function getLeadFilterOptions(filters: LeadFilters = {}) {
  const [statusRows, priorityRows, cityRows, packageRows] = await Promise.all([
    prisma.lead.findMany({
      where: leadFiltersToWhere(filters, "status"),
      select: { leadStatus: true }
    }),
    prisma.lead.findMany({
      where: leadFiltersToWhere(filters, "priority"),
      select: { priority: true }
    }),
    prisma.lead.findMany({
      where: leadFiltersToWhere(filters, "city"),
      select: { city: true }
    }),
    prisma.lead.findMany({
      where: leadFiltersToWhere(filters, "packageFit"),
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

function leadFiltersToWhere(
  filters: LeadFilters,
  omitKey?: keyof LeadFilters
): Prisma.LeadWhereInput {
  return {
    ...(omitKey === "status" || !filters.status
      ? {}
      : { leadStatus: filters.status as LeadStatus }),
    ...(omitKey === "priority" || !filters.priority
      ? {}
      : { priority: filters.priority as LeadPriority }),
    ...(omitKey === "city" || !filters.city
      ? {}
      : {
          city: {
            contains: filters.city,
            mode: "insensitive"
          }
        }),
    ...(omitKey === "packageFit" || !filters.packageFit
      ? {}
      : { packageFit: filters.packageFit as PackageFit })
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
