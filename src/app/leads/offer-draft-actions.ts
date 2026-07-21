"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { createLeadActivity } from "@/lib/activities";
import { requireUser } from "@/lib/auth-context";
import { createOfferDraftFormSchema } from "@/lib/offer-draft-form";
import { createOfferDraft, updateOfferDraft } from "@/lib/offer-drafts";
import { prisma } from "@/lib/prisma";
import { normalizeLeadNoticeCode } from "@/lib/lead-notices";

export async function saveOfferDraftAction(leadId: string, formData: FormData) {
  try {
    await requireUser();
  } catch {
    return { ok: false, code: "unauthorized", status: 401 as const };
  }

  const draftId = formData.get("draftId");
  const existingDraft = typeof draftId === "string" && draftId.trim()
    ? await prisma.offerDraft.findFirst({
        where: { id: draftId, leadId },
        select: {
          id: true,
          status: true,
          validUntil: true,
          sentAt: true,
          acceptedAt: true,
          rejectedAt: true
        }
      })
    : null;

  const parsed = createOfferDraftFormSchema({
    validUntil: existingDraft?.validUntil ?? null,
    sentAt: existingDraft?.sentAt ?? null,
    acceptedAt: existingDraft?.acceptedAt ?? null,
    rejectedAt: existingDraft?.rejectedAt ?? null
  }).safeParse({
    draftId,
    status: formData.get("status"),
    title: formData.get("title"),
    packageFit: formData.get("packageFit"),
    priceNet: formData.get("priceNet"),
    currency: formData.get("currency"),
    scopeSummary: formData.get("scopeSummary"),
    assumptions: formData.get("assumptions"),
    nextStep: formData.get("nextStep"),
    validUntil: formData.get("validUntil"),
    validUntilOriginal: formData.get("validUntilOriginal"),
    sentAt: formData.get("sentAt"),
    sentAtOriginal: formData.get("sentAtOriginal"),
    acceptedAt: formData.get("acceptedAt"),
    acceptedAtOriginal: formData.get("acceptedAtOriginal"),
    rejectedAt: formData.get("rejectedAt"),
    rejectedAtOriginal: formData.get("rejectedAtOriginal"),
    rejectionReason: formData.get("rejectionReason")
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: normalizeLeadNoticeCode(parsed.error.issues[0]?.message, "invalid_offer")
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

  const savedDraft = parsed.data.draftId
    ? await updateOfferDraft(parsed.data.draftId, leadId, draftPayload)
    : await createOfferDraft(leadId, draftPayload);

  if (!savedDraft) {
    return {
      ok: false,
      code: "offer_not_found"
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
    code: parsed.data.draftId ? "offer_updated" : "offer_created"
  };
}
