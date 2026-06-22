export type PrototypeState = "default" | "loading" | "empty" | "error" | "success" | "stress";
export const PROTOTYPE_STATES: readonly PrototypeState[] = ["default", "loading", "empty", "error", "success", "stress"] as const;

export const PROTOTYPE_ROUTE_MAP = [
  { href: "/ux-prototype", label: "Hub", description: "Route overview." },
  { href: "/ux-prototype/dashboard", label: "Dashboard" },
  { href: "/ux-prototype/daily-work", label: "Daily work" },
  { href: "/ux-prototype/leads", label: "Leads list" },
  { href: "/ux-prototype/leads/lead-aurora-bikes", label: "Lead detail" },
  { href: "/ux-prototype/sales-overview", label: "Sales overview" },
  { href: "/ux-prototype/import-batches", label: "Import batches" },
  { href: "/ux-prototype/import-batches/batch-2026-06-21", label: "Import batch detail" },
  { href: "/ux-prototype/duplicate-candidates", label: "Duplicate candidates" },
  { href: "/ux-prototype/duplicate-candidates/dup-aurora-bikes", label: "Duplicate comparison detail" },
  { href: "/ux-prototype/system-status", label: "System status" }
] as const;

export type PrototypeRoute = (typeof PROTOTYPE_ROUTE_MAP)[number];
export type LeadRecord = {
  id: string;
  company: string;
  city: string;
  category: string;
  owner: string;
  priority: "High" | "Medium" | "Low";
  nextStep: string;
  nextStepDue: string;
  reason: string;
  score: number;
  contact: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  lastContact: string;
  possibleDuplicate?: string;
};

export const prototypeLeads: readonly LeadRecord[] = [
  {
    id: "lead-aurora-bikes",
    company: "Aurora Bikes Studio",
    city: "Katowice",
    category: "Fitness retail",
    owner: "Marta",
    priority: "High",
    nextStep: "Send revised local visibility plan",
    nextStepDue: "Today, 15:30",
    reason: "The owner asked for a simpler rollout and wants more bookings before the weekend.",
    score: 92,
    contact: "Anna Błaszczyk",
    phone: "+48 600 182 440",
    email: "anna@aurorabikes.pl",
    website: "aurorabikes.pl",
    instagram: "@aurorabikesstudio",
    lastContact: "Today, 08:50",
    possibleDuplicate: "Aurora Bike Studio"
  },
  {
    id: "lead-sienna-clinic",
    company: "Sienna Dental Care",
    city: "Gliwice",
    category: "Health services",
    owner: "Marta",
    priority: "Medium",
    nextStep: "Confirm reception workflow and review page",
    nextStepDue: "Tomorrow, 09:00",
    reason: "They want more patient inquiries before summer.",
    score: 76,
    contact: "Dr. Piotr Sowa",
    phone: "+48 572 901 211",
    email: "piotr@sienna-care.pl",
    website: "sienna-care.pl",
    instagram: "@sienna_dental",
    lastContact: "Yesterday, 17:15"
  },
  {
    id: "lead-amber-hair",
    company: "Amber Hair Lounge",
    city: "Rybnik",
    category: "Beauty salon",
    owner: "Kasia",
    priority: "Low",
    nextStep: "Check no-next-action branch and revisit next week",
    nextStepDue: "No next action",
    reason: "Their current pipeline is stable but underutilized.",
    score: 61,
    contact: "Karolina Nowak",
    phone: "+48 884 210 552",
    email: "hello@amberhair.pl",
    website: "amberhair.lounge",
    instagram: "@amberhairlounge",
    lastContact: "Tue, 13:20"
  },
  {
    id: "lead-long-name",
    company: "North Star Wellness and Recovery Center for Local Service Teams",
    city: "Tychy",
    category: "Wellness",
    owner: "Kasia",
    priority: "Medium",
    nextStep: "Review outreach with the owner",
    nextStepDue: "Fri, 10:00",
    reason: "The long business name is useful for stress testing the list layout.",
    score: 70,
    contact: "Ewa Zielińska",
    phone: "+48 533 190 842",
    email: "ewa@northstarwellness.pl",
    website: "northstarwellness.pl",
    instagram: "@northstarwellness",
    lastContact: "Mon, 11:40",
    possibleDuplicate: "North Star Wellness Center"
  }
] as const;

export const prototypeImports = [
  {
    id: "batch-2026-06-21",
    label: "Import batch #2026-06-21",
    company: "Region 06 local businesses",
    status: "Completed with issues",
    summary: "18 leads imported, 3 rejected rows, 2 manual review notes.",
    rows: "21 rows",
    importedAt: "21 Jun 2026, 09:42",
    outcome: "Rejected rows available for download"
  },
  {
    id: "batch-2026-06-20",
    label: "Import batch #2026-06-20",
    company: "Service directory sync",
    status: "Completed",
    summary: "14 leads imported after duplicate screening.",
    rows: "14 rows",
    importedAt: "20 Jun 2026, 17:10",
    outcome: "Ready for review"
  },
  {
    id: "batch-2026-06-19",
    label: "Import batch #2026-06-19",
    company: "Local shortlist",
    status: "Processing",
    summary: "Validation is running on 11 submitted rows.",
    rows: "11 rows",
    importedAt: "In progress",
    outcome: "Processing"
  },
  {
    id: "batch-2026-06-18",
    label: "Import batch #2026-06-18",
    company: "Imported archive sample",
    status: "Failed",
    summary: "File rejected because two records were missing source IDs.",
    rows: "8 rows",
    importedAt: "18 Jun 2026, 07:10",
    outcome: "Retry available"
  }
] as const;

export const prototypeDuplicates = [
  {
    id: "dup-aurora-bikes",
    left: "Aurora Bikes Studio",
    right: "Aurora Bike Studio",
    difference: "Logo text and phone number differ.",
    decision: "Same business",
    evidence: "Shared address, same decision maker, same booking form.",
    confidence: "High",
    auditTrail: "Suggested by manual review after import batch 2026-06-21."
  },
  {
    id: "dup-sienna-clinic",
    left: "Sienna Dental Care",
    right: "Sienna Care Dental",
    difference: "Category and website root differ.",
    decision: "Needs more review",
    evidence: "Same city and matching reception contact, but different domains.",
    confidence: "Medium",
    auditTrail: "Matched on city, contact and office name similarity."
  }
] as const;

export const prototypeWorkQueue = [
  { title: "Follow up on Aurora Bikes", bucket: "Overdue", why: "Proposal needs a cleaner rollout plan before 15:30.", due: "Today", owner: "Marta" },
  { title: "Confirm Sienna Dental reception flow", bucket: "Today", why: "They asked for a quick review of the booking path.", due: "Today, 11:00", owner: "Marta" },
  { title: "Reconnect with Amber Hair Lounge", bucket: "Upcoming", why: "They have room for better lead capture next week.", due: "Fri", owner: "Kasia" },
  { title: "No next action set", bucket: "No next action", why: "Three leads need a decision before they re-enter the queue.", due: "Review required", owner: "Shared" }
] as const;

export const prototypeDashboard = {
  kpis: [
    { label: "Overdue", value: 1 },
    { label: "Due today", value: 2 },
    { label: "Upcoming", value: 4 },
    { label: "No next action", value: 3 }
  ],
  priorities: [prototypeLeads[0], prototypeLeads[1], prototypeLeads[3]],
  pipeline: [
    { stage: "New", value: 6 },
    { stage: "Contacted", value: 5 },
    { stage: "Qualified", value: 3 },
    { stage: "Proposal sent", value: 2 }
  ]
} as const;

export const prototypeLeadTimeline = [
  { type: "Call", date: "Today, 08:50", author: "Marta", result: "Owner wants a simpler rollout", nextStep: "Send revised plan" },
  { type: "Message", date: "Yesterday, 13:10", author: "Marta", result: "Intro message opened", nextStep: "Follow up with CTA" },
  { type: "Site review", date: "Mon, 16:20", author: "Operator", result: "Landing page has a weak booking path", nextStep: "Share recommended action" }
] as const;

export function getPrototypeState(searchParams?: Record<string, string | string[] | undefined>) {
  const raw = typeof searchParams?.state === "string" ? searchParams.state : "default";
  return PROTOTYPE_STATES.includes(raw as PrototypeState) ? (raw as PrototypeState) : "default";
}

export function getReviewState(searchParams?: Record<string, string | string[] | undefined>) {
  return getPrototypeState(searchParams);
}
