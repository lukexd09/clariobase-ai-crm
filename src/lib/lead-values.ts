export const LEAD_STATUS_VALUES = [
  "NEW",
  "QUALIFIED",
  "TO_AUDIT",
  "AUDITED",
  "CONTACTED",
  "REPLIED",
  "DISCOVERY_SCHEDULED",
  "OFFER_SENT",
  "WON",
  "LOST",
  "NURTURE",
  "BAD_FIT",
  "DO_NOT_CONTACT",
  "ARCHIVED"
] as const;

export const LEAD_PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const PACKAGE_FIT_VALUES = ["UNKNOWN", "BASE", "CLARITY", "MOMENTUM", "NOT_FIT"] as const;

export type LeadStatusValue = (typeof LEAD_STATUS_VALUES)[number];
export type LeadPriorityValue = (typeof LEAD_PRIORITY_VALUES)[number];
export type PackageFitValue = (typeof PACKAGE_FIT_VALUES)[number];
