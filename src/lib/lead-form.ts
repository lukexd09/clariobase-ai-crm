import {
  LEAD_PRIORITY_VALUES,
  LEAD_STATUS_VALUES,
  PACKAGE_FIT_VALUES
} from "@/lib/lead-values";
import { z } from "zod";
import { parseFormDateTime } from "@/lib/form-date-time";

export const leadUpdateSchema = z.object({
  leadStatus: z.enum(LEAD_STATUS_VALUES),
  priority: z.enum(LEAD_PRIORITY_VALUES),
  packageFit: z.enum(PACKAGE_FIT_VALUES),
  nextActionAt: z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) return null;
      return parseFormDateTime(value);
    }, z.date({ error: "validation.lead.next_action_invalid" }).nullable())
    .refine((value) => value === null || !Number.isNaN(value.getTime()), {
      message: "validation.lead.next_action_invalid"
    })
});

export type LeadUpdateFormData = z.infer<typeof leadUpdateSchema>;
