import type { TranslationKey } from "@/i18n/types";

export const DUPLICATE_NOTICE_KEYS = {
  review_updated: "notice.duplicate.review_updated",
  update_failed: "notice.duplicate.update_failed"
} as const satisfies Record<string, TranslationKey>;

export type DuplicateNoticeCode = keyof typeof DUPLICATE_NOTICE_KEYS;

export function getDuplicateNoticeTranslationKey(code: string | null | undefined): TranslationKey {
  return typeof code === "string" && Object.hasOwn(DUPLICATE_NOTICE_KEYS, code)
    ? DUPLICATE_NOTICE_KEYS[code as DuplicateNoticeCode]
    : DUPLICATE_NOTICE_KEYS.update_failed;
}
