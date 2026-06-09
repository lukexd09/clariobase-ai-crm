const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const leads = [
  {
    customerId: "clb-seed-001",
    businessName: "Northwind Design Studio",
    category: "Web design",
    city: "Krakow",
    region: "Lesser Poland",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-001",
    googlePlaceId: null,
    websiteUrl: "https://example.com/northwind",
    instagramUrl: "https://instagram.com/northwinddesignstudio",
    facebookUrl: null,
    phone: "+48 123 456 001",
    email: "hello@northwind.example",
    address: "ul. Jasna 1, Krakow",
    leadStatus: "NEW",
    priority: "MEDIUM",
    packageFit: "BASE",
    scoreTotal: 42,
    scoreLabel: "Warm",
    nextActionAt: new Date("2026-06-15T09:00:00.000Z"),
    lastReviewedAt: null,
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-002",
    businessName: "Blue Harbor Coffee",
    category: "Hospitality",
    city: "Gdansk",
    region: "Pomeranian",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-002",
    googlePlaceId: null,
    websiteUrl: "https://example.com/blueharbor",
    instagramUrl: null,
    facebookUrl: "https://facebook.com/blueharborcoffee",
    phone: "+48 123 456 002",
    email: "contact@blueharbor.example",
    address: "ul. Morska 2, Gdansk",
    leadStatus: "TO_AUDIT",
    priority: "HIGH",
    packageFit: "CLARITY",
    scoreTotal: 68,
    scoreLabel: "Strong",
    nextActionAt: new Date("2026-06-12T10:00:00.000Z"),
    lastReviewedAt: new Date("2026-06-10T10:00:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-003",
    businessName: "Echo Point Fitness",
    category: "Fitness",
    city: "Warsaw",
    region: "Masovian",
    country: "Poland",
    source: "google_maps",
    sourceRecordId: "gm-789",
    googlePlaceId: "ChIJ-seed-003",
    websiteUrl: "https://example.com/echopoint",
    instagramUrl: "https://instagram.com/echopointfitness",
    facebookUrl: null,
    phone: "+48 123 456 003",
    email: "team@echopoint.example",
    address: "ul. Sportowa 3, Warsaw",
    leadStatus: "CONTACTED",
    priority: "HIGH",
    packageFit: "MOMENTUM",
    scoreTotal: 74,
    scoreLabel: "Hot",
    nextActionAt: new Date("2026-06-11T14:00:00.000Z"),
    lastReviewedAt: new Date("2026-06-10T10:30:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-004",
    businessName: "Maple & Mill Bakery",
    category: "Food & beverage",
    city: "Poznan",
    region: "Greater Poland",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-004",
    googlePlaceId: null,
    websiteUrl: "https://example.com/maplemill",
    instagramUrl: null,
    facebookUrl: null,
    phone: "+48 123 456 004",
    email: "info@maplemill.example",
    address: "ul. Chlebowa 4, Poznan",
    leadStatus: "NURTURE",
    priority: "LOW",
    packageFit: "NOT_FIT",
    scoreTotal: 18,
    scoreLabel: "Low",
    nextActionAt: null,
    lastReviewedAt: new Date("2026-06-08T10:30:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-005",
    businessName: "Silver Coast Interiors",
    category: "Interior design",
    city: "Wroclaw",
    region: "Lower Silesia",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-005",
    googlePlaceId: null,
    websiteUrl: "https://example.com/silvercoast",
    instagramUrl: "https://instagram.com/silvercoastinteriors",
    facebookUrl: null,
    phone: "+48 123 456 005",
    email: "studio@silvercoast.example",
    address: "ul. Projektowa 5, Wroclaw",
    leadStatus: "AUDITED",
    priority: "MEDIUM",
    packageFit: "CLARITY",
    scoreTotal: 57,
    scoreLabel: "Solid",
    nextActionAt: new Date("2026-06-14T12:00:00.000Z"),
    lastReviewedAt: new Date("2026-06-10T11:00:00.000Z"),
    lastImportedAt: new Date("2026-06-09T08:00:00.000Z"),
    archivedAt: null
  },
  {
    customerId: "clb-seed-006",
    businessName: "Summit Trail Travel",
    category: "Travel",
    city: "Lodz",
    region: "Lodz",
    country: "Poland",
    source: "manual",
    sourceRecordId: "seed-manual-006",
    googlePlaceId: null,
    websiteUrl: "https://example.com/summittrail",
    instagramUrl: null,
    facebookUrl: null,
    phone: "+48 123 456 006",
    email: "contact@summittrail.example",
    address: "ul. Podroznicza 6, Lodz",
    leadStatus: "DO_NOT_CONTACT",
    priority: "URGENT",
    packageFit: "NOT_FIT",
    scoreTotal: 5,
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
