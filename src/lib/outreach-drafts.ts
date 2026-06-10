import { type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const outreachDraftSelect = {
  id: true,
  leadId: true,
  miniAuditDraftId: true,
  status: true,
  channel: true,
  subject: true,
  openingHook: true,
  message: true,
  callToAction: true,
  notes: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.OutreachDraftSelect;

export type OutreachDraftRecord = Prisma.OutreachDraftGetPayload<{
  select: typeof outreachDraftSelect;
}>;

export type OutreachDraftInput = {
  miniAuditDraftId: string | null;
  status: Prisma.OutreachDraftUncheckedCreateInput["status"];
  channel: Prisma.OutreachDraftUncheckedCreateInput["channel"];
  subject: string | null;
  openingHook: string | null;
  message: string | null;
  callToAction: string | null;
  notes: string | null;
  sentAt: Date | null;
};

export async function getLeadOutreachDrafts(leadId: string) {
  return prisma.outreachDraft.findMany({
    where: { leadId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: outreachDraftSelect
  });
}

export async function createOutreachDraft(leadId: string, input: OutreachDraftInput) {
  return prisma.outreachDraft.create({
    data: {
      leadId,
      ...input
    }
  });
}

export async function updateOutreachDraft(
  draftId: string,
  leadId: string,
  input: OutreachDraftInput
) {
  const existingDraft = await prisma.outreachDraft.findFirst({
    where: { id: draftId, leadId },
    select: { id: true }
  });

  if (!existingDraft) {
    return null;
  }

  return prisma.outreachDraft.update({
    where: { id: draftId },
    data: input
  });
}
