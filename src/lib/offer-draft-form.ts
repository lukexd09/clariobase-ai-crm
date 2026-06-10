import { OFFER_DRAFT_STATUS_VALUES, PACKAGE_FIT_VALUES } from "@/lib/lead-values";
import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value?.length ? value : null));

const optionalDateTime = (label: string) =>
  z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) return null;
      if (typeof value === "string") return new Date(value);
      return value;
    }, z.date().nullable())
    .refine((value) => value === null || !Number.isNaN(value.getTime()), {
      message: `${label} must be a valid date`
    });

const optionalPriceNet = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number().nonnegative().nullable())
  .refine((value) => value === null || Number.isFinite(value), {
    message: "Price net must be a non-negative number"
  });

const currencySchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return "PLN";
  return value;
}, z.string().trim().min(3).max(3).transform((value) => value.toUpperCase()));

export const offerDraftFormSchema = z.object({
  draftId: z.string().trim().min(1).optional(),
  status: z.enum(OFFER_DRAFT_STATUS_VALUES),
  title: z.string().trim().min(1, "Title is required"),
  packageFit: z.enum(PACKAGE_FIT_VALUES),
  priceNet: optionalPriceNet,
  currency: currencySchema,
  scopeSummary: optionalText,
  assumptions: optionalText,
  nextStep: optionalText,
  validUntil: optionalDateTime("Valid until"),
  sentAt: optionalDateTime("Sent at"),
  acceptedAt: optionalDateTime("Accepted at"),
  rejectedAt: optionalDateTime("Rejected at"),
  rejectionReason: optionalText
});

export type OfferDraftFormData = z.infer<typeof offerDraftFormSchema>;
