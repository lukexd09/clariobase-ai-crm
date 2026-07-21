import { ACTIVITY_TYPE_VALUES } from "@/lib/activity-values";
import { z } from "zod";
import { parseFormDateTime } from "@/lib/form-date-time";

export const activityCreateSchema = z.object({
  type: z.enum(ACTIVITY_TYPE_VALUES),
  title: z.string().trim().min(1, "validation.activity.title_required"),
  body: z.string().trim().optional().transform((value) => value?.length ? value : null),
  occurredAt: z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) return new Date();
      return parseFormDateTime(value);
    }, z.date({ error: "validation.activity.occurred_at_invalid" }))
    .refine((value) => !Number.isNaN(value.getTime()), {
      message: "validation.activity.occurred_at_invalid"
    })
});

export type ActivityCreateFormData = z.infer<typeof activityCreateSchema>;
