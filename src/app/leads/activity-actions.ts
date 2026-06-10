"use server";

import { revalidatePath } from "next/cache";
import { activityCreateSchema } from "@/lib/activity-form";
import { createLeadActivity } from "@/lib/activities";

export async function createLeadActivityAction(leadId: string, formData: FormData) {
  const parsed = activityCreateSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body"),
    occurredAt: formData.get("occurredAt")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid activity"
    };
  }

  await createLeadActivity({
    leadId,
    ...parsed.data
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/work");

  return {
    ok: true,
    message: "Activity added"
  };
}
