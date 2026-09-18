import type { TranslationKey } from "@/i18n/types";

export const DUPLICATE_SIGNAL_LABEL_KEYS = {
  googlePlaceId: "duplicates.signal.googlePlaceId",
  sourceRecord: "duplicates.signal.sourceRecord",
  nameCity: "duplicates.signal.nameCity",
  phone: "duplicates.signal.phone",
  websiteDomain: "duplicates.signal.websiteDomain",
  instagramHandle: "duplicates.signal.instagramHandle",
  facebookHandle: "duplicates.signal.facebookHandle"
} as const satisfies Record<string, TranslationKey>;

export function getDuplicateSignalLabelTranslationKey(signal: string | null | undefined): TranslationKey | null {
  return typeof signal === "string" && Object.hasOwn(DUPLICATE_SIGNAL_LABEL_KEYS, signal)
    ? DUPLICATE_SIGNAL_LABEL_KEYS[signal as keyof typeof DUPLICATE_SIGNAL_LABEL_KEYS]
    : null;
}
