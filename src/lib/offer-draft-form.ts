import { OFFER_DRAFT_STATUS_VALUES, PACKAGE_FIT_VALUES } from "@/lib/lead-values";
import { z } from "zod";
import { parseFormDateTime } from "@/lib/form-date-time";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value?.length ? value : null));

const optionalDateTime = (code: string) =>
  z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) return null;
      return parseFormDateTime(value);
    }, z.date({ error: code }).nullable())
    .refine((value) => value === null || !Number.isNaN(value.getTime()), {
      message: code
    });

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
}, z.string().trim().regex(/^[A-Za-z]{3}$/, "validation.offer.currency_invalid").transform((value) => value.toUpperCase()));

export const offerDraftFormSchema = z.object({
  draftId: z.string().trim().min(1).optional(),
  status: z.enum(OFFER_DRAFT_STATUS_VALUES),
  title: z.string().trim().min(1, "validation.offer.title_required"),
  packageFit: z.enum(PACKAGE_FIT_VALUES),
  priceNet: optionalPriceNet,
  currency: currencySchema,
  scopeSummary: optionalText,
  assumptions: optionalText,
  nextStep: optionalText,
  validUntil: optionalDateTime("validation.offer.valid_until_invalid"),
  sentAt: optionalDateTime("validation.offer.sent_at_invalid"),
  acceptedAt: optionalDateTime("validation.offer.accepted_at_invalid"),
  rejectedAt: optionalDateTime("validation.offer.rejected_at_invalid"),
  rejectionReason: optionalText
});

export type OfferDraftFormData = z.infer<typeof offerDraftFormSchema>;
