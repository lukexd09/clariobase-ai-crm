import { LEAD_STATUS_VALUES, type LeadStatusValue } from "@/lib/lead-values";
import type { TranslationKey } from "@/i18n/types";

export type SalesStatusGroup =
  | "intake"
  | "audit"
  | "outreach"
  | "conversation"
  | "offer"
  | "closed"
  | "paused";

export type SalesStatusMetadata = {
  group: SalesStatusGroup;
  descriptionKey: TranslationKey;
  nextActionKey: TranslationKey;
};

export const SALES_STATUS_METADATA = {
  NEW: {
    group: "intake",
    descriptionKey: "sales.status.NEW.description", nextActionKey: "sales.status.NEW.next"
  },
  QUALIFIED: {
    group: "intake",
    descriptionKey: "sales.status.QUALIFIED.description", nextActionKey: "sales.status.QUALIFIED.next"
  },
  TO_AUDIT: {
    group: "audit",
    descriptionKey: "sales.status.TO_AUDIT.description", nextActionKey: "sales.status.TO_AUDIT.next"
  },
  AUDITED: {
    group: "audit",
    descriptionKey: "sales.status.AUDITED.description", nextActionKey: "sales.status.AUDITED.next"
  },
  CONTACTED: {
    group: "outreach",
    descriptionKey: "sales.status.CONTACTED.description", nextActionKey: "sales.status.CONTACTED.next"
  },
  REPLIED: {
    group: "conversation",
    descriptionKey: "sales.status.REPLIED.description", nextActionKey: "sales.status.REPLIED.next"
  },
  DISCOVERY_SCHEDULED: {
    group: "conversation",
    descriptionKey: "sales.status.DISCOVERY_SCHEDULED.description", nextActionKey: "sales.status.DISCOVERY_SCHEDULED.next"
  },
  OFFER_SENT: {
    group: "offer",
    descriptionKey: "sales.status.OFFER_SENT.description", nextActionKey: "sales.status.OFFER_SENT.next"
  },
  WON: {
    group: "closed",
    descriptionKey: "sales.status.WON.description", nextActionKey: "sales.status.WON.next"
  },
  LOST: {
    group: "closed",
    descriptionKey: "sales.status.LOST.description", nextActionKey: "sales.status.LOST.next"
  },
  NURTURE: {
    group: "paused",
    descriptionKey: "sales.status.NURTURE.description", nextActionKey: "sales.status.NURTURE.next"
  },
  BAD_FIT: {
    group: "paused",
    descriptionKey: "sales.status.BAD_FIT.description", nextActionKey: "sales.status.BAD_FIT.next"
  },
  DO_NOT_CONTACT: {
    group: "paused",
    descriptionKey: "sales.status.DO_NOT_CONTACT.description", nextActionKey: "sales.status.DO_NOT_CONTACT.next"
  },
  ARCHIVED: {
    group: "closed",
    descriptionKey: "sales.status.ARCHIVED.description", nextActionKey: "sales.status.ARCHIVED.next"
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
