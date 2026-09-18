import { OUTREACH_CHANNEL_VALUES, OUTREACH_DRAFT_STATUS_VALUES } from "@/lib/lead-values";
import { z } from "zod";
import { parseOptionalDateTimeField } from "@/lib/form-date-time-schema";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value?.length ? value : null));

type OutreachDraftOriginals = {
  sentAt?: Date | null;
};

export function createOutreachDraftFormSchema(originals: OutreachDraftOriginals = {}) {
  return z
    .object({
      draftId: z.string().trim().min(1).optional(),
      status: z.enum(OUTREACH_DRAFT_STATUS_VALUES),
      channel: z.enum(OUTREACH_CHANNEL_VALUES),
      subject: optionalText,
      openingHook: optionalText,
      message: z.string().trim().min(1, "validation.outreach.message_required"),
      callToAction: optionalText,
      notes: optionalText,
      sentAt: z.unknown().optional(),
      sentAtOriginal: z.unknown().optional(),
      miniAuditDraftId: z.preprocess(
        (value) => (value === "" || value === null || value === undefined ? null : value),
        z.string().trim().min(1).nullable()
      )
    })
    .transform((value, ctx) => ({
      draftId: value.draftId,
      status: value.status,
      channel: value.channel,
      subject: value.subject,
      openingHook: value.openingHook,
      message: value.message,
      callToAction: value.callToAction,
      notes: value.notes,
      sentAt: parseOptionalDateTimeField(value.sentAt, {
        code: "validation.outreach.sent_at_invalid",
        ctx,
        originalInstant: value.sentAtOriginal,
        expectedOriginalInstant: originals.sentAt,
        path: ["sentAt"]
      }),
      miniAuditDraftId: value.miniAuditDraftId
    }));
}

export const outreachDraftFormSchema = createOutreachDraftFormSchema();

export type OutreachDraftFormData = z.infer<typeof outreachDraftFormSchema>;
