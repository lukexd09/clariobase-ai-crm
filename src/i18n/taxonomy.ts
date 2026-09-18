import type { TranslationKey } from "@/i18n/types";
import type {
  DuplicateCandidateStatusValue,
  ImportBatchStatusValue,
  ImportRowStatusValue,
  ImportSourceTypeValue,
  LeadPriorityValue,
  LeadStatusValue,
  MiniAuditStatusValue,
  OfferDraftStatusValue,
  OutreachChannelValue,
  OutreachDraftStatusValue,
  PackageFitValue
} from "@/lib/lead-values";
import type { ActivityTypeValue } from "@/lib/activity-values";

export type TaxonomyValue =
  | LeadStatusValue
  | LeadPriorityValue
  | PackageFitValue
  | ActivityTypeValue
  | MiniAuditStatusValue
  | OutreachDraftStatusValue
  | OfferDraftStatusValue
  | OutreachChannelValue
  | ImportBatchStatusValue
  | ImportRowStatusValue
  | ImportSourceTypeValue
  | DuplicateCandidateStatusValue;

export const TAXONOMY_TRANSLATION_KEYS = {
  NEW: "taxonomy.NEW", QUALIFIED: "taxonomy.QUALIFIED", TO_AUDIT: "taxonomy.TO_AUDIT",
  AUDITED: "taxonomy.AUDITED", CONTACTED: "taxonomy.CONTACTED", REPLIED: "taxonomy.REPLIED",
  DISCOVERY_SCHEDULED: "taxonomy.DISCOVERY_SCHEDULED", OFFER_SENT: "taxonomy.OFFER_SENT",
  WON: "taxonomy.WON", LOST: "taxonomy.LOST", NURTURE: "taxonomy.NURTURE", BAD_FIT: "taxonomy.BAD_FIT",
  DO_NOT_CONTACT: "taxonomy.DO_NOT_CONTACT", ARCHIVED: "taxonomy.ARCHIVED", LOW: "taxonomy.LOW",
  MEDIUM: "taxonomy.MEDIUM", HIGH: "taxonomy.HIGH", URGENT: "taxonomy.URGENT", UNKNOWN: "taxonomy.UNKNOWN",
  BASE: "taxonomy.BASE", CLARITY: "taxonomy.CLARITY", MOMENTUM: "taxonomy.MOMENTUM", NOT_FIT: "taxonomy.NOT_FIT",
  NOTE: "taxonomy.NOTE", CALL: "taxonomy.CALL", MESSAGE: "taxonomy.MESSAGE", STATUS_CHANGE: "taxonomy.STATUS_CHANGE",
  AUDIT: "taxonomy.AUDIT", OTHER: "taxonomy.OTHER", DRAFT: "taxonomy.DRAFT",
  READY_FOR_REVIEW: "taxonomy.READY_FOR_REVIEW", APPROVED: "taxonomy.APPROVED", READY: "taxonomy.READY",
  SENT_MANUALLY: "taxonomy.SENT_MANUALLY", ACCEPTED: "taxonomy.ACCEPTED", REJECTED: "taxonomy.REJECTED",
  EMAIL: "taxonomy.EMAIL", INSTAGRAM_DM: "taxonomy.INSTAGRAM_DM", FACEBOOK_DM: "taxonomy.FACEBOOK_DM",
  PHONE_CALL: "taxonomy.PHONE_CALL", RUNNING: "taxonomy.RUNNING", COMPLETED: "taxonomy.COMPLETED",
  COMPLETED_WITH_ERRORS: "taxonomy.COMPLETED_WITH_ERRORS", FAILED: "taxonomy.FAILED", CREATED: "taxonomy.CREATED",
  UPDATED: "taxonomy.UPDATED", SKIPPED: "taxonomy.SKIPPED", LOCAL_JSON: "taxonomy.LOCAL_JSON",
  HARVESTER_EXPORT: "taxonomy.HARVESTER_EXPORT", MANUAL_AI_PREPARED_FILE: "taxonomy.MANUAL_AI_PREPARED_FILE",
  OPEN: "taxonomy.OPEN", NEEDS_REVIEW: "taxonomy.NEEDS_REVIEW", DISMISSED: "taxonomy.DISMISSED",
  RESOLVED: "taxonomy.RESOLVED"
} as const satisfies Record<TaxonomyValue, TranslationKey>;

export function getTaxonomyTranslationKey(value: string): TranslationKey {
  return Object.hasOwn(TAXONOMY_TRANSLATION_KEYS, value)
    ? TAXONOMY_TRANSLATION_KEYS[value as TaxonomyValue]
    : "taxonomy.UNKNOWN";
}

export function getAdminRoleTranslationKey(role: string | null | undefined): TranslationKey {
  return role === "admin" ? "admin.role.admin" : role === "user" ? "admin.role.user" : "admin.role.unknown";
}

export function getAdminStateTranslationKey(banned: boolean): TranslationKey {
  return banned ? "admin.state.disabled" : "admin.state.active";
}
