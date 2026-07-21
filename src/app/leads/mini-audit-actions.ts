"use server";

import { revalidatePath } from "next/cache";
import { createLeadActivity } from "@/lib/activities";
import { requireUser } from "@/lib/auth-context";
import { miniAuditDraftFormSchema } from "@/lib/mini-audit-form";
import { createMiniAuditDraft, updateMiniAuditDraft } from "@/lib/mini-audits";
import { normalizeLeadNoticeCode } from "@/lib/lead-notices";

export async function saveMiniAuditDraftAction(leadId: string, formData: FormData) {
  try {
    await requireUser();
  } catch {
    return { ok: false, code: "unauthorized", status: 401 as const };
  }

  const parsed = miniAuditDraftFormSchema.safeParse({
    draftId: formData.get("draftId"),
    status: formData.get("status"),
    problem1: formData.get("problem1"),
    problem2: formData.get("problem2"),
    problem3: formData.get("problem3"),
    recommendation: formData.get("recommendation"),
    suggestedPackage: formData.get("suggestedPackage"),
    outreachAngle: formData.get("outreachAngle"),
    draftMessage: formData.get("draftMessage"),
    riskNotes: formData.get("riskNotes"),
    approvedAt: formData.get("approvedAt")
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: normalizeLeadNoticeCode(parsed.error.issues[0]?.message, "invalid_mini_audit")
    };
  }

  const draftPayload = {
    status: parsed.data.status,
    problem1: parsed.data.problem1,
    problem2: parsed.data.problem2,
    problem3: parsed.data.problem3,
    recommendation: parsed.data.recommendation,
    suggestedPackage: parsed.data.suggestedPackage,
    outreachAngle: parsed.data.outreachAngle,
    draftMessage: parsed.data.draftMessage,
    riskNotes: parsed.data.riskNotes,
    approvedAt: parsed.data.approvedAt
  };

  const savedDraft = parsed.data.draftId
    ? await updateMiniAuditDraft(parsed.data.draftId, leadId, draftPayload)
    : await createMiniAuditDraft(leadId, draftPayload);

  if (!savedDraft) {
    return {
      ok: false,
      code: "mini_audit_not_found"
    };
  }

  await createLeadActivity({
    leadId,
    type: "AUDIT",
    title: parsed.data.draftId ? "Mini-audit draft updated" : "Mini-audit draft created",
    body: [
      `Status: ${draftPayload.status}`,
      `Package: ${draftPayload.suggestedPackage}`,
      draftPayload.recommendation ? `Recommendation: ${draftPayload.recommendation}` : null
    ]
      .filter(Boolean)
      .join(" | "),
    occurredAt: new Date()
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/work");

  return {
    ok: true,
    code: parsed.data.draftId ? "mini_audit_updated" : "mini_audit_created"
  };
}
