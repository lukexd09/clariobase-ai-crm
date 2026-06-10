import { ACTIVITY_TYPE_VALUES } from "@/lib/activity-values";
import { z } from "zod";

export const activityCreateSchema = z.object({
  type: z.enum(ACTIVITY_TYPE_VALUES),
  title: z.string().trim().min(1, "Activity title is required"),
  body: z.string().trim().optional().transform((value) => value?.length ? value : null),
  occurredAt: z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) return new Date();
      if (typeof value === "string") return new Date(value);
      return value;
    }, z.date())
    .refine((value) => !Number.isNaN(value.getTime()), {
      message: "Occurred at must be a valid date"
    })
});

export type ActivityCreateFormData = z.infer<typeof activityCreateSchema>;
