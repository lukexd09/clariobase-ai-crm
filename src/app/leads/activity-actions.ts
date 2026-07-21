"use server";

import { revalidatePath } from "next/cache";
import { activityCreateSchema } from "@/lib/activity-form";
import { createLeadActivity } from "@/lib/activities";
import { requireUser } from "@/lib/auth-context";
import { normalizeLeadNoticeCode } from "@/lib/lead-notices";

export async function createLeadActivityAction(leadId: string, formData: FormData) {
  try {
    await requireUser();
  } catch {
    return { ok: false, code: "unauthorized", status: 401 as const };
  }

  const parsed = activityCreateSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body"),
    occurredAt: formData.get("occurredAt")
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: normalizeLeadNoticeCode(parsed.error.issues[0]?.message, "invalid_activity")
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
    code: "activity_added"
  };
}
