import { LEAD_STATUS_VALUES, type LeadStatusValue } from "@/lib/lead-values";

export type SalesStatusGroup =
  | "intake"
  | "audit"
  | "outreach"
  | "conversation"
  | "offer"
  | "closed"
  | "paused";

export type SalesStatusMetadata = {
  label: string;
  group: SalesStatusGroup;
  description: string;
  nextAction: string;
};

export const SALES_STATUS_METADATA = {
  NEW: {
    label: "New",
    group: "intake",
    description: "Fresh lead that still needs qualification.",
    nextAction: "Confirm fit and fill any missing context."
  },
  QUALIFIED: {
    label: "Qualified",
    group: "intake",
    description: "Lead is a clear fit and ready for deeper work.",
    nextAction: "Create or refine the mini-audit."
  },
  TO_AUDIT: {
    label: "To audit",
    group: "audit",
    description: "Queued for mini-audit or closer review.",
    nextAction: "Prepare the first audit draft."
  },
  AUDITED: {
    label: "Audited",
    group: "audit",
    description: "Mini-audit is ready and can drive outreach.",
    nextAction: "Prepare outreach or follow-up actions."
  },
  CONTACTED: {
    label: "Contacted",
    group: "outreach",
    description: "Initial outreach has been sent to the lead.",
    nextAction: "Monitor for a reply or follow up once."
  },
  REPLIED: {
    label: "Replied",
    group: "conversation",
    description: "The lead replied and a conversation is active.",
    nextAction: "Move toward discovery or offer preparation."
  },
  DISCOVERY_SCHEDULED: {
    label: "Discovery scheduled",
    group: "conversation",
    description: "A discovery conversation is already booked.",
    nextAction: "Prepare the call and confirm the agenda."
  },
  OFFER_SENT: {
    label: "Offer sent",
    group: "offer",
    description: "A commercial offer has been delivered.",
    nextAction: "Track response, objections and timing."
  },
  WON: {
    label: "Won",
    group: "closed",
    description: "The lead became a customer.",
    nextAction: "Archive when downstream work is done."
  },
  LOST: {
    label: "Lost",
    group: "closed",
    description: "The opportunity closed without conversion.",
    nextAction: "Record the reason and archive if needed."
  },
  NURTURE: {
    label: "Nurture",
    group: "paused",
    description: "Not ready now but worth revisiting later.",
    nextAction: "Schedule a future check-in."
  },
  BAD_FIT: {
    label: "Bad fit",
    group: "paused",
    description: "The lead does not match the current offer.",
    nextAction: "Leave paused or archive if the fit will not improve."
  },
  DO_NOT_CONTACT: {
    label: "Do not contact",
    group: "paused",
    description: "The lead must not receive further outreach.",
    nextAction: "Stop outreach and keep the record protected."
  },
  ARCHIVED: {
    label: "Archived",
    group: "closed",
    description: "Kept for history only, outside the active pipeline.",
    nextAction: "No operational action."
  }
} satisfies Record<LeadStatusValue, SalesStatusMetadata>;

export function getSalesStatusMetadata(status: LeadStatusValue) {
  return SALES_STATUS_METADATA[status];
}

export function getSalesStatusEntries() {
  return LEAD_STATUS_VALUES.map((status) => ({
    status,
    ...SALES_STATUS_METADATA[status]
  }));
}
