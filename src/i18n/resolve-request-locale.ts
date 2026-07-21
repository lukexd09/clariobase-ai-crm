import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

type WeightedLocale = { index: number; locale: Locale; quality: number };

const LANGUAGE_RANGE = /^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/;
const QUALITY = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

export function resolveRequestLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage?.trim()) return DEFAULT_LOCALE;

  const candidates: WeightedLocale[] = [];
  for (const [index, rawEntry] of acceptLanguage.split(",").entries()) {
    const parsed = parseEntry(rawEntry, index);
    if (parsed === "invalid") return DEFAULT_LOCALE;
    if (parsed) candidates.push(parsed);
  }

  candidates.sort((left, right) => right.quality - left.quality || left.index - right.index);
  return candidates[0]?.locale ?? DEFAULT_LOCALE;
}

function parseEntry(rawEntry: string, index: number): WeightedLocale | null | "invalid" {
  const segments = rawEntry.split(";").map((segment) => segment.trim());
  const range = segments[0];

  if (!range || (range !== "*" && !LANGUAGE_RANGE.test(range))) return "invalid";
  if (segments.length > 2) return "invalid";

  let quality = 1;
  if (segments.length === 2) {
    const match = /^q=(.+)$/i.exec(segments[1] ?? "");
    if (!match || !QUALITY.test(match[1])) return "invalid";
    quality = Number(match[1]);
  }

  if (quality === 0 || range === "*") return null;

  const primaryLanguage = range.split("-", 1)[0].toLowerCase();
  const locale = primaryLanguage === "pl" ? "pl-PL" : primaryLanguage === "en" ? "en-US" : null;
  return locale ? { index, locale, quality } : null;
}
