import { Prisma, DuplicateCandidateStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type DuplicateReason = {
  signal: string;
  label: string;
  score: number;
  value: string;
};

export type DuplicatePairProposal = {
  leadIdA: string;
  leadIdB: string;
  score: number;
  reasons: DuplicateReason[];
};

const leadSummarySelect = {
  id: true,
  businessName: true,
  city: true,
  category: true,
  phone: true,
  email: true,
  websiteUrl: true,
  instagramUrl: true,
  facebookUrl: true,
  googlePlaceId: true,
  customerId: true,
  source: true,
  sourceRecordId: true
} satisfies Prisma.LeadSelect;

type LeadSummary = Prisma.LeadGetPayload<{
  select: typeof leadSummarySelect;
}>;

const duplicateCandidateSelect = {
  id: true,
  leadIdA: true,
  leadIdB: true,
  status: true,
  score: true,
  reasons: true,
  reviewedAt: true,
  decisionNote: true,
  createdAt: true,
  updatedAt: true,
  leadA: {
    select: leadSummarySelect
  },
  leadB: {
    select: leadSummarySelect
  }
} satisfies Prisma.DuplicateCandidateSelect;

export const ACTIVE_DUPLICATE_CANDIDATE_STATUSES = [
  DuplicateCandidateStatus.OPEN,
  DuplicateCandidateStatus.NEEDS_REVIEW
] as const;

export function normalizeDuplicateText(value: string | null | undefined) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function extractDomain(value: string | null | undefined) {
  if (!value) return "";

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    if (["example.com", "example.org", "example.net", "localhost"].includes(hostname)) {
      return "";
    }
    return hostname;
  } catch {
    return "";
  }
}

export function extractHandle(value: string | null | undefined) {
  if (!value) return "";

  try {
    const url = new URL(value);
    const pathname = url.pathname.replace(/\/+$/, "");
    if (!pathname || pathname === "/") return "";
    return pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  } catch {
    return "";
  }
}

export function normalizePhone(value: string | null | undefined) {
  return value ? value.replace(/\D+/g, "") : "";
}

export function sortLeadPair(leadIdA: string, leadIdB: string) {
  return leadIdA < leadIdB
    ? { leadIdA, leadIdB }
    : { leadIdA: leadIdB, leadIdB: leadIdA };
}

export async function getDuplicateCandidates() {
  return prisma.duplicateCandidate.findMany({
    orderBy: [{ updatedAt: "desc" }, { score: "desc" }],
    select: duplicateCandidateSelect
  });
}

export async function getActiveDuplicateCandidateCount() {
  return prisma.duplicateCandidate.count({
    where: {
      status: {
        in: [...ACTIVE_DUPLICATE_CANDIDATE_STATUSES]
      }
    }
  });
}

export async function getDuplicateCandidateById(id: string) {
  return prisma.duplicateCandidate.findUnique({
    where: { id },
    select: duplicateCandidateSelect
  });
}

export async function updateDuplicateCandidateStatus(
  id: string,
  status: DuplicateCandidateStatus,
  decisionNote?: string | null
) {
  return prisma.duplicateCandidate.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      decisionNote: decisionNote ?? undefined
    },
    select: duplicateCandidateSelect
  });
}

export async function scanDuplicateCandidates() {
  const leads = await prisma.lead.findMany({
    select: leadSummarySelect,
    orderBy: [{ updatedAt: "desc" }, { businessName: "asc" }]
  });

  const proposals: DuplicatePairProposal[] = [];
  let checkedPairs = 0;
  let createdCandidates = 0;
  let existingCandidatesSkipped = 0;

  for (let indexA = 0; indexA < leads.length; indexA += 1) {
    for (let indexB = indexA + 1; indexB < leads.length; indexB += 1) {
      checkedPairs += 1;
      const proposal = scoreLeadPair(leads[indexA], leads[indexB]);

      if (!proposal) continue;

      proposals.push(proposal);
    }
  }

  for (const proposal of proposals) {
    const pair = sortLeadPair(proposal.leadIdA, proposal.leadIdB);

    const existing = await prisma.duplicateCandidate.findUnique({
      where: {
        leadIdA_leadIdB: pair
      },
      select: { id: true }
    });

    if (existing) {
      existingCandidatesSkipped += 1;
      continue;
    }

    await prisma.duplicateCandidate.create({
      data: {
        ...pair,
        score: proposal.score,
        reasons: proposal.reasons
      }
    });
    createdCandidates += 1;
  }

  const openCandidatesCount = await prisma.duplicateCandidate.count({
    where: {
      status: DuplicateCandidateStatus.OPEN
    }
  });

  return {
    checkedPairs,
    createdCandidates,
    existingCandidatesSkipped,
    openCandidatesCount
  };
}

function scoreLeadPair(leadA: LeadSummary, leadB: LeadSummary): DuplicatePairProposal | null {
  const reasons: DuplicateReason[] = [];
  let score = 0;

  if (leadA.id === leadB.id) return null;

  if (leadA.googlePlaceId && leadA.googlePlaceId === leadB.googlePlaceId) {
    reasons.push({
      signal: "googlePlaceId",
      label: "Exact Google Place ID match",
      score: 100,
      value: leadA.googlePlaceId
    });
    score += 100;
  }

  if (
    leadA.source &&
    leadA.sourceRecordId &&
    leadB.source &&
    leadB.sourceRecordId &&
    leadA.source === leadB.source &&
    leadA.sourceRecordId === leadB.sourceRecordId
  ) {
    reasons.push({
      signal: "sourceRecord",
      label: "Same source and source record ID",
      score: 100,
      value: `${leadA.source}:${leadA.sourceRecordId}`
    });
    score += 100;
  }

  const normalizedNameA = normalizeDuplicateText(leadA.businessName);
  const normalizedNameB = normalizeDuplicateText(leadB.businessName);
  const normalizedCityA = normalizeDuplicateText(leadA.city);
  const normalizedCityB = normalizeDuplicateText(leadB.city);
  if (
    normalizedNameA &&
    normalizedNameA === normalizedNameB &&
    normalizedCityA &&
    normalizedCityA === normalizedCityB
  ) {
    reasons.push({
      signal: "nameCity",
      label: "Same normalized business name and city",
      score: 80,
      value: `${normalizedNameA} / ${normalizedCityA}`
    });
    score += 80;
  }

  const phoneA = normalizePhone(leadA.phone);
  const phoneB = normalizePhone(leadB.phone);
  if (phoneA && phoneA === phoneB) {
    reasons.push({
      signal: "phone",
      label: "Same phone number",
      score: 95,
      value: leadA.phone ?? phoneA
    });
    score += 95;
  }

  const websiteDomainA = extractDomain(leadA.websiteUrl);
  const websiteDomainB = extractDomain(leadB.websiteUrl);
  if (websiteDomainA && websiteDomainA === websiteDomainB) {
    reasons.push({
      signal: "websiteDomain",
      label: "Same website domain",
      score: 80,
      value: websiteDomainA
    });
    score += 80;
  }

  const instagramHandleA = extractHandle(leadA.instagramUrl);
  const instagramHandleB = extractHandle(leadB.instagramUrl);
  if (instagramHandleA && instagramHandleA === instagramHandleB) {
    reasons.push({
      signal: "instagramHandle",
      label: "Same Instagram handle",
      score: 80,
      value: instagramHandleA
    });
    score += 80;
  }

  const facebookHandleA = extractHandle(leadA.facebookUrl);
  const facebookHandleB = extractHandle(leadB.facebookUrl);
  if (facebookHandleA && facebookHandleA === facebookHandleB) {
    reasons.push({
      signal: "facebookHandle",
      label: "Same Facebook handle",
      score: 75,
      value: facebookHandleA
    });
    score += 75;
  }

  score = Math.min(score, 100);

  if (score < 70 || reasons.length === 0) {
    return null;
  }

  const pair = sortLeadPair(leadA.id, leadB.id);

  return {
    leadIdA: pair.leadIdA,
    leadIdB: pair.leadIdB,
    score,
    reasons
  };
}

export async function setDuplicateCandidateStatus(
  candidateId: string,
  status: DuplicateCandidateStatus,
  decisionNote?: string | null
) {
  return updateDuplicateCandidateStatus(candidateId, status, decisionNote);
}
