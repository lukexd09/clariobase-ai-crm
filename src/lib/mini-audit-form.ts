import { PACKAGE_FIT_VALUES, MINI_AUDIT_STATUS_VALUES } from "@/lib/lead-values";
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
  }, z.date({ error: "validation.mini_audit.approved_at_invalid" }).nullable())
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: "validation.mini_audit.approved_at_invalid"
  });

export const miniAuditDraftFormSchema = z.object({
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
  approvedAt: optionalDateTime
}).refine(
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

export type MiniAuditDraftFormData = z.infer<typeof miniAuditDraftFormSchema>;
