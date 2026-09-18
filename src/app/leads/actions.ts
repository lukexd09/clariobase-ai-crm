"use server";

import { revalidatePath } from "next/cache";
import { createLeadActivity, buildLeadUpdateActivityBody } from "@/lib/activities";
import { requireUser } from "@/lib/auth-context";
import { createLeadUpdateSchema } from "@/lib/lead-form";
import { getLeadById, updateLeadOperationalFields } from "@/lib/leads";
import { normalizeLeadNoticeCode } from "@/lib/lead-notices";

export async function updateLeadAction(leadId: string, formData: FormData) {
  try {
    await requireUser();
  } catch {
    return { ok: false, code: "unauthorized", status: 401 as const };
  }

  const existingLead = await getLeadById(leadId);
  const parsed = createLeadUpdateSchema({ nextActionAt: existingLead?.nextActionAt ?? null }).safeParse({
    leadStatus: formData.get("leadStatus"),
    priority: formData.get("priority"),
    packageFit: formData.get("packageFit"),
    nextActionAt: formData.get("nextActionAt"),
    nextActionAtOriginal: formData.get("nextActionAtOriginal")
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: normalizeLeadNoticeCode(parsed.error.issues[0]?.message, "invalid_lead_update")
    };
  }

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
  if (existingLead && changedFields.length > 0) {
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
    code: "lead_updated"
  };
}
