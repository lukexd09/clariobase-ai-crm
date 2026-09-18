import { PACKAGE_FIT_VALUES, MINI_AUDIT_STATUS_VALUES } from "@/lib/lead-values";
import { z } from "zod";
import { parseOptionalDateTimeField } from "@/lib/form-date-time-schema";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value?.length ? value : null));

type MiniAuditDraftOriginals = {
  approvedAt?: Date | null;
};

export function createMiniAuditDraftFormSchema(originals: MiniAuditDraftOriginals = {}) {
  return z
    .object({
      draftId: z.string().trim().min(1).optional(),
      status: z.enum(MINI_AUDIT_STATUS_VALUES),
      problem1: optionalText,
      problem2: optionalText,
      problem3: optionalText,
      recommendation: optionalText,
      suggestedPackage: z.enum(PACKAGE_FIT_VALUES),
      outreachAngle: optionalText,
      draftMessage: optionalText,
      riskNotes: optionalText,
      approvedAt: z.unknown().optional(),
      approvedAtOriginal: z.unknown().optional()
    })
    .transform((value, ctx) => ({
      draftId: value.draftId,
      status: value.status,
      problem1: value.problem1,
      problem2: value.problem2,
      problem3: value.problem3,
      recommendation: value.recommendation,
      suggestedPackage: value.suggestedPackage,
      outreachAngle: value.outreachAngle,
      draftMessage: value.draftMessage,
      riskNotes: value.riskNotes,
      approvedAt: parseOptionalDateTimeField(value.approvedAt, {
        code: "validation.mini_audit.approved_at_invalid",
        ctx,
        originalInstant: value.approvedAtOriginal,
        expectedOriginalInstant: originals.approvedAt,
        path: ["approvedAt"]
      })
    }))
    .refine(
      (value) =>
        [
          value.problem1,
          value.problem2,
          value.problem3,
          value.recommendation,
          value.outreachAngle,
          value.draftMessage,
          value.riskNotes
        ].some((field) => typeof field === "string" && field.length > 0),
      {
        message: "validation.mini_audit.content_required",
        path: ["problem1"]
      }
    );
}

export const miniAuditDraftFormSchema = createMiniAuditDraftFormSchema();

export type MiniAuditDraftFormData = z.infer<typeof miniAuditDraftFormSchema>;
