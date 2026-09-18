"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DuplicateCandidateStatus } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth-context";
import { setDuplicateCandidateStatus } from "@/lib/duplicates";

export async function updateDuplicateCandidateAction(
  candidateId: string,
  status: DuplicateCandidateStatus
) : Promise<void> {
  try {
    await requireUser();
  } catch {
    return;
  }

  try {
    await setDuplicateCandidateStatus(candidateId, status);
    revalidatePath("/duplicates");
    revalidatePath(`/duplicates/${candidateId}`);
  } catch {
    redirect(`/duplicates/${encodeURIComponent(candidateId)}?tone=error&noticeCode=update_failed`);
  }
  redirect(`/duplicates/${encodeURIComponent(candidateId)}?tone=success&noticeCode=review_updated`);
}
