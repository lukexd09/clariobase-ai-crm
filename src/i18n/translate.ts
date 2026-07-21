import type { Locale } from "@/i18n/config";
import { enUS } from "@/i18n/dictionaries/en-US";
import { plPL } from "@/i18n/dictionaries/pl-PL";
import type { Dictionary, PartialDictionary, Translate, TranslationKey, TranslationValues } from "@/i18n/types";

const dictionaries = { "en-US": enUS, "pl-PL": plPL } satisfies Record<Locale, Dictionary>;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function createTranslator(
  locale: Locale,
  localized: PartialDictionary = getDictionary(locale),
  english: PartialDictionary = enUS
): Translate {
  return (key, values) => {
    const template = localized[key] ?? english[key];
    if (template === undefined) throw new Error(`Missing English translation: ${key}`);
    return interpolate(template, values);
  };
}

export function getPlaceholders(template: string) {
  return [...template.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]);
}

function interpolate(template: string, values: TranslationValues = {}) {
  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`Missing interpolation value: ${name}`);
    return String(value);
  });
}

export function getTranslationKeys(dictionary: PartialDictionary = enUS): TranslationKey[] {
  return Object.keys(dictionary) as TranslationKey[];
}
