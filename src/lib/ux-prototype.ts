export type PrototypeState = "default" | "loading" | "empty" | "error" | "success" | "stress";

export const PROTOTYPE_STATES: readonly PrototypeState[] = [
  "default",
  "loading",
  "empty",
  "error",
  "success",
  "stress"
] as const;

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

export type PrototypeLead = {
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
};

export const prototypeLeads: readonly PrototypeLead[] = [
  {
    id: "lead-aurora-bikes",
    company: "Aurora Bikes Studio",
    city: "Katowice",
    category: "Fitness retail",
    owner: "Marta",
    priority: "High",
    nextStep: "Send revised local visibility plan",
    nextStepDue: "Today, 15:30",
    reason: "The owner opened the proposal and asked for a simpler rollout.",
    score: 92,
    contact: "Anna Błaszczyk",
    phone: "+48 600 182 440",
    email: "anna@aurorabikes.pl"
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
    email: "piotr@sienna-care.pl"
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
    email: "hello@amberhair.pl"
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
    importedAt: "21 Jun 2026, 09:42"
  },
  {
    id: "batch-2026-06-20",
    label: "Import batch #2026-06-20",
    company: "Service directory sync",
    status: "Completed",
    summary: "14 leads imported after duplicate screening.",
    rows: "14 rows",
    importedAt: "20 Jun 2026, 17:10"
  },
  {
    id: "batch-2026-06-19",
    label: "Import batch #2026-06-19",
    company: "Local shortlist",
    status: "Processing",
    summary: "Validation is running on 11 submitted rows.",
    rows: "11 rows",
    importedAt: "In progress"
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
    confidence: "High"
  },
  {
    id: "dup-sienna-clinic",
    left: "Sienna Dental Care",
    right: "Sienna Care Dental",
    difference: "Category and website root differ.",
    decision: "Needs more review",
    evidence: "Same city and matching reception contact, but different domains.",
    confidence: "Medium"
  }
] as const;

export const prototypeWorkQueue = [
  {
    title: "Follow up on Aurora Bikes",
    bucket: "Overdue",
    why: "Proposal needs a cleaner rollout plan before 15:30.",
    due: "Today",
    owner: "Marta"
  },
  {
    title: "Confirm Sienna Dental reception flow",
    bucket: "Today",
    why: "They asked for a quick review of the booking path.",
    due: "Today, 11:00",
    owner: "Marta"
  },
  {
    title: "Reconnect with Amber Hair Lounge",
    bucket: "Upcoming",
    why: "They have room for better lead capture next week.",
    due: "Fri",
    owner: "Kasia"
  },
  {
    title: "No next action set",
    bucket: "No next action",
    why: "Three leads need a decision before they re-enter the queue.",
    due: "Review required",
    owner: "Shared"
  }
] as const;

export function getPrototypeState(searchParams?: Record<string, string | string[] | undefined>) {
  const raw = typeof searchParams?.state === "string" ? searchParams.state : "default";
  return PROTOTYPE_STATES.includes(raw as PrototypeState) ? (raw as PrototypeState) : "default";
}

