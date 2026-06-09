import { Prisma, LeadPriority, LeadStatus, PackageFit } from "@prisma/client";
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
  nextActionAt: true
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
