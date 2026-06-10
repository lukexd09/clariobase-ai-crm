import { type PackageFit, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const miniAuditSelect = {
  id: true,
  leadId: true,
  status: true,
  problem1: true,
  problem2: true,
  problem3: true,
  recommendation: true,
  suggestedPackage: true,
  outreachAngle: true,
  draftMessage: true,
  riskNotes: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.MiniAuditDraftSelect;

export type MiniAuditDraftRecord = Prisma.MiniAuditDraftGetPayload<{
  select: typeof miniAuditSelect;
}>;

export type MiniAuditDraftInput = {
  status: Prisma.MiniAuditDraftUncheckedCreateInput["status"];
  problem1: string | null;
  problem2: string | null;
  problem3: string | null;
  recommendation: string | null;
  suggestedPackage: PackageFit;
  outreachAngle: string | null;
  draftMessage: string | null;
  riskNotes: string | null;
  approvedAt: Date | null;
};

export async function getLeadMiniAuditDrafts(leadId: string) {
  return prisma.miniAuditDraft.findMany({
    where: { leadId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: miniAuditSelect
  });
}

export async function createMiniAuditDraft(leadId: string, input: MiniAuditDraftInput) {
  return prisma.miniAuditDraft.create({
    data: {
      leadId,
      ...input
    }
  });
}

export async function updateMiniAuditDraft(
  draftId: string,
  leadId: string,
  input: MiniAuditDraftInput
) {
  const existingDraft = await prisma.miniAuditDraft.findFirst({
    where: { id: draftId, leadId },
    select: { id: true }
  });

  if (!existingDraft) {
    return null;
  }

  return prisma.miniAuditDraft.update({
    where: { id: draftId },
    data: input
  });
}
