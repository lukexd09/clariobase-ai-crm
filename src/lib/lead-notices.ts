import type { TranslationKey } from "@/i18n/types";

export const LEAD_NOTICE_KEYS = {
  unauthorized: "notice.lead.unauthorized",
  "validation.lead.next_action_invalid": "notice.lead.nextActionInvalid",
  "validation.activity.title_required": "notice.lead.activityTitleRequired",
  "validation.activity.occurred_at_invalid": "notice.lead.activityDateInvalid",
  "validation.mini_audit.approved_at_invalid": "notice.lead.miniAuditDateInvalid",
  "validation.mini_audit.content_required": "notice.lead.miniAuditContentRequired",
  "validation.outreach.sent_at_invalid": "notice.lead.outreachDateInvalid",
  "validation.outreach.message_required": "notice.lead.outreachMessageRequired",
  "validation.offer.valid_until_invalid": "notice.lead.offerValidUntilInvalid",
  "validation.offer.sent_at_invalid": "notice.lead.offerSentAtInvalid",
  "validation.offer.accepted_at_invalid": "notice.lead.offerAcceptedAtInvalid",
  "validation.offer.rejected_at_invalid": "notice.lead.offerRejectedAtInvalid",
  "validation.offer.price_non_negative": "notice.lead.offerPriceInvalid",
  "validation.offer.currency_invalid": "notice.lead.offerCurrencyInvalid",
  "validation.offer.title_required": "notice.lead.offerTitleRequired",
  invalid_lead_update: "notice.lead.invalidUpdate",
  lead_updated: "notice.lead.updated",
  invalid_activity: "notice.lead.invalidActivity",
  activity_added: "notice.lead.activityAdded",
  invalid_mini_audit: "notice.lead.invalidMiniAudit",
  mini_audit_not_found: "notice.lead.miniAuditNotFound",
  mini_audit_created: "notice.lead.miniAuditCreated",
  mini_audit_updated: "notice.lead.miniAuditUpdated",
  invalid_outreach: "notice.lead.invalidOutreach",
  outreach_not_found: "notice.lead.outreachNotFound",
  outreach_created: "notice.lead.outreachCreated",
  outreach_updated: "notice.lead.outreachUpdated",
  invalid_offer: "notice.lead.invalidOffer",
  offer_not_found: "notice.lead.offerNotFound",
  offer_created: "notice.lead.offerCreated",
  offer_updated: "notice.lead.offerUpdated",
  operation_failed: "notice.lead.operationFailed"
} as const satisfies Record<string, TranslationKey>;

export type LeadNoticeCode = keyof typeof LEAD_NOTICE_KEYS;

export function getLeadNoticeTranslationKey(code: string): TranslationKey {
  return LEAD_NOTICE_KEYS[code as LeadNoticeCode] ?? LEAD_NOTICE_KEYS.operation_failed;
}

export function normalizeLeadNoticeCode(code: string | undefined, fallback: LeadNoticeCode): LeadNoticeCode {
  return code && code in LEAD_NOTICE_KEYS ? (code as LeadNoticeCode) : fallback;
}
