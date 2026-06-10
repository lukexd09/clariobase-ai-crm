"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { createLeadActivity } from "@/lib/activities";
import { offerDraftFormSchema } from "@/lib/offer-draft-form";
import { createOfferDraft, updateOfferDraft } from "@/lib/offer-drafts";
import { prisma } from "@/lib/prisma";

export async function saveOfferDraftAction(leadId: string, formData: FormData) {
  const parsed = offerDraftFormSchema.safeParse({
    draftId: formData.get("draftId"),
    status: formData.get("status"),
    title: formData.get("title"),
    packageFit: formData.get("packageFit"),
    priceNet: formData.get("priceNet"),
    currency: formData.get("currency"),
    scopeSummary: formData.get("scopeSummary"),
    assumptions: formData.get("assumptions"),
    nextStep: formData.get("nextStep"),
    validUntil: formData.get("validUntil"),
    sentAt: formData.get("sentAt"),
    acceptedAt: formData.get("acceptedAt"),
    rejectedAt: formData.get("rejectedAt"),
    rejectionReason: formData.get("rejectionReason")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid offer draft"
    };
  }

  const draftPayload = {
    status: parsed.data.status,
    title: parsed.data.title,
    packageFit: parsed.data.packageFit,
    priceNet:
      parsed.data.priceNet === null ? null : new Prisma.Decimal(String(parsed.data.priceNet)),
    currency: parsed.data.currency,
    scopeSummary: parsed.data.scopeSummary,
    assumptions: parsed.data.assumptions,
    nextStep: parsed.data.nextStep,
    validUntil: parsed.data.validUntil,
    sentAt: parsed.data.sentAt,
    acceptedAt: parsed.data.acceptedAt,
    rejectedAt: parsed.data.rejectedAt,
    rejectionReason: parsed.data.rejectionReason
  };

  const existingDraft = parsed.data.draftId
    ? await prisma.offerDraft.findFirst({
        where: { id: parsed.data.draftId, leadId },
        select: { id: true, status: true }
      })
    : null;

  const savedDraft = parsed.data.draftId
    ? await updateOfferDraft(parsed.data.draftId, leadId, draftPayload)
    : await createOfferDraft(leadId, draftPayload);

  if (!savedDraft) {
    return {
      ok: false,
      message: "Offer draft not found"
    };
  }

  if (!parsed.data.draftId) {
    await createLeadActivity({
      leadId,
      type: "NOTE",
      title: "Offer draft created",
      body: [
        `Title: ${draftPayload.title}`,
        `Status: ${draftPayload.status}`,
        `Package: ${draftPayload.packageFit}`,
        draftPayload.priceNet !== null
          ? `Price: ${draftPayload.priceNet.toString()} ${draftPayload.currency}`
          : null
      ]
        .filter(Boolean)
        .join(" | "),
      occurredAt: new Date()
    });
  } else if (existingDraft && existingDraft.status !== parsed.data.status) {
    await createLeadActivity({
      leadId,
      type: "STATUS_CHANGE",
      title: `Offer draft marked ${parsed.data.status.replaceAll("_", " ").toLowerCase()}`,
      body: [
        `Draft: ${parsed.data.title}`,
        `Status: ${existingDraft.status} -> ${parsed.data.status}`,
        `Package: ${draftPayload.packageFit}`
      ]
        .filter(Boolean)
        .join(" | "),
      occurredAt: new Date()
    });
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/reports/sales");

  return {
    ok: true,
    message: parsed.data.draftId ? "Offer draft updated" : "Offer draft created"
  };
}
