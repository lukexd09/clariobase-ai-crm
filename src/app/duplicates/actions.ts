"use server";

import { revalidatePath } from "next/cache";
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

  await setDuplicateCandidateStatus(candidateId, status);
  revalidatePath("/duplicates");
  revalidatePath(`/duplicates/${candidateId}`);
}
