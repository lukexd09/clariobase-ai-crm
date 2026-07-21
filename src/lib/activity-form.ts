import { ACTIVITY_TYPE_VALUES } from "@/lib/activity-values";
import { z } from "zod";
import { parseRequiredDateTimeField } from "@/lib/form-date-time-schema";

export const activityCreateSchema = z
  .object({
    type: z.enum(ACTIVITY_TYPE_VALUES),
    title: z.string().trim().min(1, "validation.activity.title_required"),
    body: z.string().trim().optional().transform((value) => value?.length ? value : null),
    occurredAt: z.unknown().optional()
  })
  .transform((value, ctx) => ({
    type: value.type,
    title: value.title,
    body: value.body,
    occurredAt: parseRequiredDateTimeField(value.occurredAt, {
      code: "validation.activity.occurred_at_invalid",
      ctx,
      path: ["occurredAt"]
    })
  }));

export type ActivityCreateFormData = z.infer<typeof activityCreateSchema>;
