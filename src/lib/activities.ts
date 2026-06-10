import { type ActivityType, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildLeadUpdateActivityBody } from "@/lib/activity-utils";

export type ActivityInput = {
  leadId: string;
  type: ActivityType;
  title: string;
  body?: string | null;
  occurredAt: Date;
};

const activitySelect = {
  id: true,
  leadId: true,
  type: true,
  title: true,
  body: true,
  occurredAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ActivitySelect;

export async function getLeadActivities(leadId: string) {
  return prisma.activity.findMany({
    where: { leadId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    select: activitySelect
  });
}

export async function createLeadActivity(input: ActivityInput) {
  return prisma.activity.create({
    data: {
      leadId: input.leadId,
      type: input.type,
      title: input.title,
      body: input.body?.trim() || null,
      occurredAt: input.occurredAt
    }
  });
}

export { buildLeadUpdateActivityBody };
