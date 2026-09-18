import { OFFER_DRAFT_STATUS_VALUES, PACKAGE_FIT_VALUES } from "@/lib/lead-values";
import { z } from "zod";
import { parseOptionalDateTimeField } from "@/lib/form-date-time-schema";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value?.length ? value : null));

type OfferDraftOriginals = {
  validUntil?: Date | null;
  sentAt?: Date | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
};

const optionalPriceNet = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number({ error: "validation.offer.price_non_negative" }).nonnegative("validation.offer.price_non_negative").nullable())
  .refine((value) => value === null || Number.isFinite(value), {
    message: "validation.offer.price_non_negative"
  });

const currencySchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return "PLN";
  return value;
}, z.string().trim().min(3, "validation.offer.currency_invalid").max(3, "validation.offer.currency_invalid").transform((value) => value.toUpperCase()));

export function createOfferDraftFormSchema(originals: OfferDraftOriginals = {}) {
  return z
    .object({
      draftId: z.string().trim().min(1).optional(),
      status: z.enum(OFFER_DRAFT_STATUS_VALUES),
      title: z.string().trim().min(1, "validation.offer.title_required"),
      packageFit: z.enum(PACKAGE_FIT_VALUES),
      priceNet: optionalPriceNet,
      currency: currencySchema,
      scopeSummary: optionalText,
      assumptions: optionalText,
      nextStep: optionalText,
      validUntil: z.unknown().optional(),
      validUntilOriginal: z.unknown().optional(),
      sentAt: z.unknown().optional(),
      sentAtOriginal: z.unknown().optional(),
      acceptedAt: z.unknown().optional(),
      acceptedAtOriginal: z.unknown().optional(),
      rejectedAt: z.unknown().optional(),
      rejectedAtOriginal: z.unknown().optional(),
      rejectionReason: optionalText
    })
    .transform((value, ctx) => ({
      draftId: value.draftId,
      status: value.status,
      title: value.title,
      packageFit: value.packageFit,
      priceNet: value.priceNet,
      currency: value.currency,
      scopeSummary: value.scopeSummary,
      assumptions: value.assumptions,
      nextStep: value.nextStep,
      validUntil: parseOptionalDateTimeField(value.validUntil, {
        code: "validation.offer.valid_until_invalid",
        ctx,
        originalInstant: value.validUntilOriginal,
        expectedOriginalInstant: originals.validUntil,
        path: ["validUntil"]
      }),
      sentAt: parseOptionalDateTimeField(value.sentAt, {
        code: "validation.offer.sent_at_invalid",
        ctx,
        originalInstant: value.sentAtOriginal,
        expectedOriginalInstant: originals.sentAt,
        path: ["sentAt"]
      }),
      acceptedAt: parseOptionalDateTimeField(value.acceptedAt, {
        code: "validation.offer.accepted_at_invalid",
        ctx,
        originalInstant: value.acceptedAtOriginal,
        expectedOriginalInstant: originals.acceptedAt,
        path: ["acceptedAt"]
      }),
      rejectedAt: parseOptionalDateTimeField(value.rejectedAt, {
        code: "validation.offer.rejected_at_invalid",
        ctx,
        originalInstant: value.rejectedAtOriginal,
        expectedOriginalInstant: originals.rejectedAt,
        path: ["rejectedAt"]
      }),
      rejectionReason: value.rejectionReason
    }));
}

export const offerDraftFormSchema = createOfferDraftFormSchema();

export type OfferDraftFormData = z.infer<typeof offerDraftFormSchema>;
