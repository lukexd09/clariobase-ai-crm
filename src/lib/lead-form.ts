import {
  LEAD_PRIORITY_VALUES,
  LEAD_STATUS_VALUES,
  PACKAGE_FIT_VALUES
} from "@/lib/lead-values";
import { z } from "zod";

export const leadUpdateSchema = z.object({
  leadStatus: z.enum(LEAD_STATUS_VALUES),
  priority: z.enum(LEAD_PRIORITY_VALUES),
  packageFit: z.enum(PACKAGE_FIT_VALUES),
  nextActionAt: z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) return null;
      if (typeof value === "string") return new Date(value);
      return value;
    }, z.date().nullable())
    .refine((value) => value === null || !Number.isNaN(value.getTime()), {
      message: "Next action date must be a valid date"
    })
});

export type LeadUpdateFormData = z.infer<typeof leadUpdateSchema>;
