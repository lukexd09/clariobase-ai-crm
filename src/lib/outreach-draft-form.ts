import { OUTREACH_CHANNEL_VALUES, OUTREACH_DRAFT_STATUS_VALUES } from "@/lib/lead-values";
import { z } from "zod";
import { parseFormDateTime } from "@/lib/form-date-time";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value?.length ? value : null));

const optionalDateTime = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    return parseFormDateTime(value);
  }, z.date({ error: "validation.outreach.sent_at_invalid" }).nullable())
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: "validation.outreach.sent_at_invalid"
  });

export const outreachDraftFormSchema = z.object({
  draftId: z.string().trim().min(1).optional(),
  status: z.enum(OUTREACH_DRAFT_STATUS_VALUES),
  channel: z.enum(OUTREACH_CHANNEL_VALUES),
  subject: optionalText,
  openingHook: optionalText,
  message: z.string().trim().min(1, "validation.outreach.message_required"),
  callToAction: optionalText,
  notes: optionalText,
  sentAt: optionalDateTime,
  miniAuditDraftId: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z.string().trim().min(1).nullable()
  )
});

export type OutreachDraftFormData = z.infer<typeof outreachDraftFormSchema>;
