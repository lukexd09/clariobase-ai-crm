"use server";

import { revalidatePath } from "next/cache";
import { createLeadActivity } from "@/lib/activities";
import { requireUser } from "@/lib/auth-context";
import { createOutreachDraftFormSchema } from "@/lib/outreach-draft-form";
import { createOutreachDraft, updateOutreachDraft } from "@/lib/outreach-drafts";
import { normalizeLeadNoticeCode } from "@/lib/lead-notices";
import { prisma } from "@/lib/prisma";

export async function saveOutreachDraftAction(leadId: string, formData: FormData) {
  try {
    await requireUser();
  } catch {
    return { ok: false, code: "unauthorized", status: 401 as const };
  }

  const draftId = formData.get("draftId");
  const existingDraft = typeof draftId === "string" && draftId.trim()
    ? await prisma.outreachDraft.findFirst({
        where: { id: draftId, leadId },
        select: { sentAt: true }
      })
    : null;

  const parsed = createOutreachDraftFormSchema({ sentAt: existingDraft?.sentAt ?? null }).safeParse({
    draftId,
    status: formData.get("status"),
    channel: formData.get("channel"),
    subject: formData.get("subject"),
    openingHook: formData.get("openingHook"),
    message: formData.get("message"),
    callToAction: formData.get("callToAction"),
    notes: formData.get("notes"),
    sentAt: formData.get("sentAt"),
    sentAtOriginal: formData.get("sentAtOriginal"),
    miniAuditDraftId: formData.get("miniAuditDraftId")
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: normalizeLeadNoticeCode(parsed.error.issues[0]?.message, "invalid_outreach")
    };
  }

  const draftPayload = {
    miniAuditDraftId: parsed.data.miniAuditDraftId ?? null,
    status: parsed.data.status,
    channel: parsed.data.channel,
    subject: parsed.data.subject,
    openingHook: parsed.data.openingHook,
    message: parsed.data.message,
    callToAction: parsed.data.callToAction,
    notes: parsed.data.notes,
    sentAt: parsed.data.sentAt
  };

  const savedDraft = parsed.data.draftId
    ? await updateOutreachDraft(parsed.data.draftId, leadId, draftPayload)
    : await createOutreachDraft(leadId, draftPayload);

  if (!savedDraft) {
    return {
      ok: false,
      code: "outreach_not_found"
    };
  }

  await createLeadActivity({
    leadId,
    type: "MESSAGE",
    title: parsed.data.draftId ? "Outreach draft updated" : "Outreach draft created",
    body: [
      `Status: ${draftPayload.status}`,
      `Channel: ${draftPayload.channel}`,
      draftPayload.subject ? `Subject: ${draftPayload.subject}` : null
    ]
      .filter(Boolean)
      .join(" | "),
    occurredAt: new Date()
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/work");

  return {
    ok: true,
    code: parsed.data.draftId ? "outreach_updated" : "outreach_created"
  };
}
