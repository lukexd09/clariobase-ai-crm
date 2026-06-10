import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient, type ActivityType } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

const leads = [
  {
    customerId: "clb-seed-001",
    businessName: "Aurora Nail Studio",
    category: "Beauty salon",
    city: "Katowice",
    region: "Silesian",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-001",
    googlePlaceId: null,
    websiteUrl: "https://example.com/aurora-nail-studio",
    instagramUrl: "https://instagram.com/auroranailstudio",
    facebookUrl: null,
    phone: "+48 123 450 001",
    email: "hello@aurora.example",
    address: "ul. Srebrna 12, Katowice",
    leadStatus: "NEW",
    priority: "MEDIUM",
    packageFit: "BASE",
    scoreTotal: 46,
    scoreLabel: "Warm",
    nextActionAt: new Date("2026-06-15T09:00:00.000Z"),
    lastReviewedAt: null,
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-002",
    businessName: "Velvet Brows & Lashes",
    category: "Beauty salon",
    city: "Chorzow",
    region: "Silesian",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-002",
    googlePlaceId: null,
    websiteUrl: "https://example.com/velvet-brows-lashes",
    instagramUrl: "https://instagram.com/velvetbrowslashes",
    facebookUrl: null,
    phone: "+48 123 450 002",
    email: "bookings@velvetbrows.example",
    address: "ul. Wenecka 8, Chorzow",
    leadStatus: "TO_AUDIT",
    priority: "HIGH",
    packageFit: "CLARITY",
    scoreTotal: 63,
    scoreLabel: "Strong",
    nextActionAt: new Date("2026-06-12T10:00:00.000Z"),
    lastReviewedAt: new Date("2026-06-10T10:00:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-003",
    businessName: "Lumina PMU Studio",
    category: "Permanent makeup",
    city: "Gliwice",
    region: "Silesian",
    country: "Poland",
    source: "google_maps",
    sourceRecordId: "gm-790",
    googlePlaceId: "ChIJ-seed-003",
    websiteUrl: "https://example.com/lumina-pmu-studio",
    instagramUrl: "https://instagram.com/luminapmustudio",
    facebookUrl: null,
    phone: "+48 123 450 003",
    email: "studio@lumina.example",
    address: "ul. Kwiatowa 3, Gliwice",
    leadStatus: "CONTACTED",
    priority: "HIGH",
    packageFit: "MOMENTUM",
    scoreTotal: 76,
    scoreLabel: "Hot",
    nextActionAt: new Date("2026-06-11T14:00:00.000Z"),
    lastReviewedAt: new Date("2026-06-10T10:30:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-004",
    businessName: "Sento Kobido Room",
    category: "Massage",
    city: "Tychy",
    region: "Silesian",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-004",
    googlePlaceId: null,
    websiteUrl: "https://example.com/sento-kobido-room",
    instagramUrl: null,
    facebookUrl: null,
    phone: "+48 123 450 004",
    email: "contact@sento.example",
    address: "ul. Relaksowa 17, Tychy",
    leadStatus: "AUDITED",
    priority: "MEDIUM",
    packageFit: "CLARITY",
    scoreTotal: 58,
    scoreLabel: "Solid",
    nextActionAt: new Date("2026-06-14T12:00:00.000Z"),
    lastReviewedAt: new Date("2026-06-10T11:00:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-005",
    businessName: "Nova Skin Beauty",
    category: "Skincare",
    city: "Zabrze",
    region: "Silesian",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-005",
    googlePlaceId: null,
    websiteUrl: "https://example.com/nova-skin-beauty",
    instagramUrl: "https://instagram.com/novaskinbeauty",
    facebookUrl: null,
    phone: "+48 123 450 005",
    email: "team@novaskin.example",
    address: "ul. Jasna 6, Zabrze",
    leadStatus: "NURTURE",
    priority: "LOW",
    packageFit: "BASE",
    scoreTotal: 29,
    scoreLabel: "Low",
    nextActionAt: null,
    lastReviewedAt: new Date("2026-06-08T10:30:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-006",
    businessName: "Soft Line Cosmetology",
    category: "Cosmetology",
    city: "Ruda Slaska",
    region: "Silesian",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-006",
    googlePlaceId: null,
    websiteUrl: "https://example.com/soft-line-cosmetology",
    instagramUrl: null,
    facebookUrl: null,
    phone: "+48 123 450 006",
    email: "hello@softline.example",
    address: "ul. Kozielska 9, Ruda Slaska",
    leadStatus: "DO_NOT_CONTACT",
    priority: "URGENT",
    packageFit: "NOT_FIT",
    scoreTotal: 7,
    scoreLabel: "Do not contact",
    nextActionAt: null,
    lastReviewedAt: new Date("2026-06-09T09:00:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  }
] satisfies Prisma.LeadUncheckedCreateInput[];

async function main() {
  await prisma.activity.deleteMany({});

  const seededLeadIds = new Map<string, string>();

  for (const lead of leads) {
    const savedLead = await prisma.lead.upsert({
      where: { customerId: lead.customerId },
      update: lead as Prisma.LeadUpdateInput,
      create: lead
    });

    seededLeadIds.set(savedLead.customerId, savedLead.id);

    await prisma.activity.createMany({
      data: demoActivitiesForLead(savedLead.id, lead.businessName)
    });
  }

  const miniAuditDrafts: Prisma.MiniAuditDraftCreateManyInput[] = [
    {
      leadId: seededLeadIds.get("clb-seed-001")!,
      status: "DRAFT",
      problem1: "No clear booking funnel",
      problem2: "Weak social proof placement",
      problem3: "The homepage lacks a sharp offer",
      recommendation: "Start with a fast homepage and booking flow cleanup.",
      suggestedPackage: "CLARITY",
      outreachAngle: "Show the value of a polished first impression.",
      draftMessage: "Hi Aurora team, I reviewed your presence and saw a few quick wins...",
      riskNotes: "Keep the tone practical and light.",
      approvedAt: null
    },
    {
      leadId: seededLeadIds.get("clb-seed-003")!,
      status: "READY_FOR_REVIEW",
      problem1: "Strong brand but inconsistent contact paths",
      problem2: "CTA is not obvious enough",
      problem3: "Profile visuals could do more work",
      recommendation: "Use the booking path and review snippets as the main pitch.",
      suggestedPackage: "MOMENTUM",
      outreachAngle: "Lean into lead handling speed and conversion.",
      draftMessage: "Hello Lumina, I noticed your profile could convert more of the interest you already have...",
      riskNotes: "Potentially more premium tone required.",
      approvedAt: new Date("2026-06-10T12:00:00.000Z")
    }
  ];

  const outreachDrafts: Prisma.OutreachDraftCreateManyInput[] = [
    {
      leadId: seededLeadIds.get("clb-seed-002")!,
      miniAuditDraftId: null,
      status: "DRAFT",
      channel: "INSTAGRAM_DM",
      subject: "Quick idea for Velvet Brows & Lashes",
      openingHook: "I loved the clean look of your profile.",
      message: "Hi, I had a look at your site and Instagram presence and noticed a few quick wins...",
      callToAction: "Would you like a short review?",
      notes: "Keep it concise and warm.",
      sentAt: null
    },
    {
      leadId: seededLeadIds.get("clb-seed-004")!,
      miniAuditDraftId: null,
      status: "READY",
      channel: "EMAIL",
      subject: "A small clarity upgrade for Sento Kobido Room",
      openingHook: "Your calm positioning is already strong.",
      message: "I think a few practical changes could make it easier for visitors to book right away...",
      callToAction: "Open to a quick audit?",
      notes: "Use a friendly, non-pushy tone.",
      sentAt: null
    }
  ];

  const offerDrafts: Prisma.OfferDraftCreateManyInput[] = [
    {
      leadId: seededLeadIds.get("clb-seed-001")!,
      status: "DRAFT",
      title: "Clarity package for Aurora Nail Studio",
      packageFit: "CLARITY",
      priceNet: new Prisma.Decimal("950"),
      currency: "PLN",
      scopeSummary: "Homepage polish, booking path cleanup and clearer offer framing.",
      assumptions: "Content changes stay within the existing brand direction.",
      nextStep: "Review the draft and align on the final wording.",
      validUntil: new Date("2026-06-20T12:00:00.000Z"),
      sentAt: null,
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null
    },
    {
      leadId: seededLeadIds.get("clb-seed-002")!,
      status: "READY",
      title: "Clarity package for Velvet Brows & Lashes",
      packageFit: "CLARITY",
      priceNet: new Prisma.Decimal("1250"),
      currency: "PLN",
      scopeSummary: "Landing page clarity, review placement and stronger booking cues.",
      assumptions: "A fast implementation window is available.",
      nextStep: "Send after a short final review.",
      validUntil: new Date("2026-06-22T12:00:00.000Z"),
      sentAt: null,
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null
    },
    {
      leadId: seededLeadIds.get("clb-seed-003")!,
      status: "SENT_MANUALLY",
      title: "Momentum package for Lumina PMU Studio",
      packageFit: "MOMENTUM",
      priceNet: new Prisma.Decimal("1890"),
      currency: "PLN",
      scopeSummary: "Conversion-focused refresh with stronger lead handling and follow-up flow.",
      assumptions: "The lead wants a more ambitious package.",
      nextStep: "Wait for reply and track objections.",
      validUntil: new Date("2026-06-24T12:00:00.000Z"),
      sentAt: new Date("2026-06-10T13:00:00.000Z"),
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null
    },
    {
      leadId: seededLeadIds.get("clb-seed-004")!,
      status: "ACCEPTED",
      title: "Base package for Sento Kobido Room",
      packageFit: "BASE",
      priceNet: new Prisma.Decimal("690"),
      currency: "PLN",
      scopeSummary: "A smaller foundation package with clearer booking emphasis.",
      assumptions: "The lead prefers a light-touch implementation.",
      nextStep: "Kick off delivery and confirm timing.",
      validUntil: new Date("2026-06-18T12:00:00.000Z"),
      sentAt: new Date("2026-06-10T09:45:00.000Z"),
      acceptedAt: new Date("2026-06-10T10:15:00.000Z"),
      rejectedAt: null,
      rejectionReason: null
    },
    {
      leadId: seededLeadIds.get("clb-seed-005")!,
      status: "REJECTED",
      title: "Base package for Nova Skin Beauty",
      packageFit: "BASE",
      priceNet: new Prisma.Decimal("590"),
      currency: "PLN",
      scopeSummary: "A light package focused on the most visible homepage improvements.",
      assumptions: "The lead wants to postpone the project.",
      nextStep: "Keep for reference or archive later.",
      validUntil: new Date("2026-06-16T12:00:00.000Z"),
      sentAt: new Date("2026-06-10T08:30:00.000Z"),
      acceptedAt: null,
      rejectedAt: new Date("2026-06-10T15:00:00.000Z"),
      rejectionReason: "Timing is not right now."
    }
  ];

  await prisma.miniAuditDraft.deleteMany({
    where: {
      leadId: {
        in: miniAuditDrafts.map((draft) => draft.leadId)
      }
    }
  });

  await prisma.outreachDraft.deleteMany({
    where: {
      leadId: {
        in: outreachDrafts.map((draft) => draft.leadId)
      }
    }
  });

  await prisma.offerDraft.deleteMany({
    where: {
      leadId: {
        in: offerDrafts.map((draft) => draft.leadId)
      }
    }
  });

  await prisma.miniAuditDraft.createMany({
    data: miniAuditDrafts
  });

  await prisma.outreachDraft.createMany({
    data: outreachDrafts
  });

  await prisma.offerDraft.createMany({
    data: offerDrafts
  });
}

function demoActivitiesForLead(leadId: string, businessName: string) {
  return [
    {
      leadId,
      type: "NOTE" as ActivityType,
      title: `${businessName} reviewed`,
      body: "Seed note for local development.",
      occurredAt: new Date("2026-06-09T08:30:00.000Z")
    },
    {
      leadId,
      type: "CALL" as ActivityType,
      title: `${businessName} quick call`,
      body: "Seed call activity for timeline testing.",
      occurredAt: new Date("2026-06-10T09:30:00.000Z")
    }
  ] satisfies Prisma.ActivityCreateManyInput[];
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
