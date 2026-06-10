import { OUTREACH_CHANNEL_VALUES, OUTREACH_DRAFT_STATUS_VALUES } from "@/lib/lead-values";
import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value?.length ? value : null));

const optionalDateTime = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "string") return new Date(value);
    return value;
  }, z.date().nullable())
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: "Sent at must be a valid date"
  });

export const outreachDraftFormSchema = z.object({
  draftId: z.string().trim().min(1).optional(),
  status: z.enum(OUTREACH_DRAFT_STATUS_VALUES),
  channel: z.enum(OUTREACH_CHANNEL_VALUES),
  subject: optionalText,
  openingHook: optionalText,
  message: z.string().trim().min(1, "Message is required"),
  callToAction: optionalText,
  notes: optionalText,
  sentAt: optionalDateTime,
  miniAuditDraftId: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z.string().trim().min(1).nullable()
  )
});

export type OutreachDraftFormData = z.infer<typeof outreachDraftFormSchema>;
