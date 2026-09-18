import {
  LEAD_PRIORITY_VALUES,
  LEAD_STATUS_VALUES,
  PACKAGE_FIT_VALUES
} from "@/lib/lead-values";
import { z } from "zod";
import { parseOptionalDateTimeField } from "@/lib/form-date-time-schema";

type LeadUpdateOriginals = {
  nextActionAt?: Date | null;
};

export function createLeadUpdateSchema(originals: LeadUpdateOriginals = {}) {
  return z
    .object({
      leadStatus: z.enum(LEAD_STATUS_VALUES),
      priority: z.enum(LEAD_PRIORITY_VALUES),
      packageFit: z.enum(PACKAGE_FIT_VALUES),
      nextActionAt: z.unknown().optional(),
      nextActionAtOriginal: z.unknown().optional()
    })
    .transform((value, ctx) => ({
      leadStatus: value.leadStatus,
      priority: value.priority,
      packageFit: value.packageFit,
      nextActionAt: parseOptionalDateTimeField(value.nextActionAt, {
        code: "validation.lead.next_action_invalid",
        ctx,
        originalInstant: value.nextActionAtOriginal,
        expectedOriginalInstant: originals.nextActionAt,
        path: ["nextActionAt"]
      })
    }));
}

export const leadUpdateSchema = createLeadUpdateSchema();

export type LeadUpdateFormData = z.infer<typeof leadUpdateSchema>;
