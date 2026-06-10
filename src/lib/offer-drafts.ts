import { type PackageFit, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const offerDraftSelect = {
  id: true,
  leadId: true,
  status: true,
  title: true,
  packageFit: true,
  priceNet: true,
  currency: true,
  scopeSummary: true,
  assumptions: true,
  nextStep: true,
  validUntil: true,
  sentAt: true,
  acceptedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.OfferDraftSelect;

export type OfferDraftRecord = Prisma.OfferDraftGetPayload<{
  select: typeof offerDraftSelect;
}>;

export type OfferDraftClientRecord = Omit<OfferDraftRecord, "priceNet"> & {
  priceNet: string | null;
};

export type OfferDraftInput = {
  status: Prisma.OfferDraftUncheckedCreateInput["status"];
  title: string;
  packageFit: PackageFit;
  priceNet: Prisma.Decimal | null;
  currency: string;
  scopeSummary: string | null;
  assumptions: string | null;
  nextStep: string | null;
  validUntil: Date | null;
  sentAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
};

export function toOfferDraftClientRecord(draft: OfferDraftRecord): OfferDraftClientRecord {
  return {
    ...draft,
    priceNet: draft.priceNet === null ? null : draft.priceNet.toString()
  };
}

export async function getLeadOfferDrafts(leadId: string) {
  return prisma.offerDraft.findMany({
    where: { leadId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: offerDraftSelect
  });
}

export async function createOfferDraft(leadId: string, input: OfferDraftInput) {
  return prisma.offerDraft.create({
    data: {
      leadId,
      ...input
    }
  });
}

export async function updateOfferDraft(
  draftId: string,
  leadId: string,
  input: OfferDraftInput
) {
  const existingDraft = await prisma.offerDraft.findFirst({
    where: { id: draftId, leadId },
    select: { id: true }
  });

  if (!existingDraft) {
    return null;
  }

  return prisma.offerDraft.update({
    where: { id: draftId },
    data: input
  });
}
