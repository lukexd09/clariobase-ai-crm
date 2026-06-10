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
export const IMPORT_BATCH_STATUS_VALUES = [
  "RUNNING",
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED"
] as const;
export const IMPORT_ROW_STATUS_VALUES = ["CREATED", "UPDATED", "REJECTED", "SKIPPED"] as const;
export const IMPORT_SOURCE_TYPE_VALUES = [
  "LOCAL_JSON",
  "HARVESTER_EXPORT",
  "MANUAL_AI_PREPARED_FILE"
] as const;
export const DUPLICATE_CANDIDATE_STATUS_VALUES = [
  "OPEN",
  "NEEDS_REVIEW",
  "DISMISSED",
  "RESOLVED"
] as const;
export const MINI_AUDIT_STATUS_VALUES = [
  "DRAFT",
  "READY_FOR_REVIEW",
  "APPROVED",
  "ARCHIVED"
] as const;
export const OUTREACH_DRAFT_STATUS_VALUES = [
  "DRAFT",
  "READY",
  "SENT_MANUALLY",
  "ARCHIVED"
] as const;
export const OUTREACH_CHANNEL_VALUES = [
  "EMAIL",
  "INSTAGRAM_DM",
  "FACEBOOK_DM",
  "PHONE_CALL",
  "OTHER"
] as const;

export type LeadStatusValue = (typeof LEAD_STATUS_VALUES)[number];
export type LeadPriorityValue = (typeof LEAD_PRIORITY_VALUES)[number];
export type PackageFitValue = (typeof PACKAGE_FIT_VALUES)[number];
export type ImportBatchStatusValue = (typeof IMPORT_BATCH_STATUS_VALUES)[number];
export type ImportRowStatusValue = (typeof IMPORT_ROW_STATUS_VALUES)[number];
export type ImportSourceTypeValue = (typeof IMPORT_SOURCE_TYPE_VALUES)[number];
export type DuplicateCandidateStatusValue =
  (typeof DUPLICATE_CANDIDATE_STATUS_VALUES)[number];
export type MiniAuditStatusValue = (typeof MINI_AUDIT_STATUS_VALUES)[number];
export type OutreachDraftStatusValue = (typeof OUTREACH_DRAFT_STATUS_VALUES)[number];
export type OutreachChannelValue = (typeof OUTREACH_CHANNEL_VALUES)[number];
