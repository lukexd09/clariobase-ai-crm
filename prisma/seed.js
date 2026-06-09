const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
];

async function main() {
  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { customerId: lead.customerId },
      update: lead,
      create: lead
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
