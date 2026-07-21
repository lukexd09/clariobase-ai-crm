import type { enUS } from "@/i18n/dictionaries/en-US";

export type TranslationKey = keyof typeof enUS;
export type Dictionary = { [Key in TranslationKey]: string };
export type PartialDictionary = Partial<Dictionary>;
export type TranslationValue = string | number;
export type TranslationValues = Readonly<Record<string, TranslationValue>>;
export type Translate = (key: TranslationKey, values?: TranslationValues) => string;
