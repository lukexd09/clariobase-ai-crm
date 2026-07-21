export const SUPPORTED_LOCALES = ["en-US", "pl-PL"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-US";
export const PRESENTATION_TIME_ZONE = "Europe/Warsaw";

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}
