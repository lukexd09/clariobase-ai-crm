"use server";

import { revalidatePath } from "next/cache";
import { createLeadActivity, buildLeadUpdateActivityBody } from "@/lib/activities";
import { leadUpdateSchema } from "@/lib/lead-form";
import { getLeadById, updateLeadOperationalFields } from "@/lib/leads";

export async function updateLeadAction(leadId: string, formData: FormData) {
  const parsed = leadUpdateSchema.safeParse({
    leadStatus: formData.get("leadStatus"),
    priority: formData.get("priority"),
    packageFit: formData.get("packageFit"),
    nextActionAt: formData.get("nextActionAt")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid lead update"
    };
  }

  const existingLead = await getLeadById(leadId);
  const changedFields: string[] = [];

  if (existingLead) {
    if (existingLead.leadStatus !== parsed.data.leadStatus) changedFields.push("lead status");
    if (existingLead.priority !== parsed.data.priority) changedFields.push("priority");
    if (existingLead.packageFit !== parsed.data.packageFit) changedFields.push("package fit");
    const previousNextAction = existingLead.nextActionAt?.getTime() ?? null;
    const nextActionValue = parsed.data.nextActionAt?.getTime() ?? null;
    if (previousNextAction !== nextActionValue) changedFields.push("next action date");
  }

  await updateLeadOperationalFields(leadId, parsed.data);
  if (existingLead) {
    await createLeadActivity({
      leadId,
      type: "STATUS_CHANGE",
      title: "Lead fields updated",
      body: buildLeadUpdateActivityBody(changedFields),
      occurredAt: new Date()
    });
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/work");

  return {
    ok: true,
    message: "Lead updated"
  };
}
