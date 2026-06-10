"use server";

import { revalidatePath } from "next/cache";
import { DuplicateCandidateStatus } from "@/generated/prisma/client";
import { setDuplicateCandidateStatus } from "@/lib/duplicates";

export async function updateDuplicateCandidateAction(
  candidateId: string,
  status: DuplicateCandidateStatus
) {
  await setDuplicateCandidateStatus(candidateId, status);
  revalidatePath("/duplicates");
  revalidatePath(`/duplicates/${candidateId}`);
}
