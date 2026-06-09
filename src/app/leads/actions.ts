"use server";

import { revalidatePath } from "next/cache";
import { leadUpdateSchema } from "@/lib/lead-form";
import { updateLeadOperationalFields } from "@/lib/leads";

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

  await updateLeadOperationalFields(leadId, parsed.data);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);

  return {
    ok: true,
    message: "Lead updated"
  };
}
