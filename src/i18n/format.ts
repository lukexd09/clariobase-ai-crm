import { PRESENTATION_TIME_ZONE, type Locale } from "@/i18n/config";

export type DateInput = Date | number | string;
export type PresentationDateTimeOptions = Omit<Intl.DateTimeFormatOptions, "timeZone">;

export function formatDate(locale: Locale, value: DateInput, options: PresentationDateTimeOptions = {}) {
  const date = normalizeDate(value, true);
  return date
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", ...options, timeZone: PRESENTATION_TIME_ZONE }).format(date)
    : unavailable(locale);
}

export function formatDateTime(locale: Locale, value: DateInput, options: PresentationDateTimeOptions = {}) {
  const date = normalizeDate(value, false);
  return date
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", ...options, timeZone: PRESENTATION_TIME_ZONE }).format(date)
    : unavailable(locale);
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions) {
  return Number.isFinite(value) ? new Intl.NumberFormat(locale, options).format(value) : unavailable(locale);
}

export function formatPercent(locale: Locale, value: number, options?: Intl.NumberFormatOptions) {
  return formatNumber(locale, value, { style: "percent", ...options });
}

export function formatCurrency(locale: Locale, value: number, currency: string, options?: Intl.NumberFormatOptions) {
  if (!Number.isFinite(value) || currency.length !== 3) return unavailable(locale);
  if (!/^[A-Za-z]{3}$/.test(currency)) return `${formatNumber(locale, value, options)} ${currency}`;
  return formatNumber(locale, value, { style: "currency", currency, ...options });
}

export function formatDateTimeLocalInput(value: DateInput | null | undefined) {
  if (value === null || value === undefined) return "";
  const date = normalizeDate(value, false);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRESENTATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function normalizeDate(value: DateInput, preserveDateOnly: boolean) {
  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (preserveDateOnly && dateOnly) {
      if (!isCalendarDate(Number(dateOnly[1]), Number(dateOnly[2]), Number(dateOnly[3]))) return null;
      return new Date(`${value}T12:00:00.000Z`);
    }

    const instant = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
    if (!instant || !isCalendarDate(Number(instant[1]), Number(instant[2]), Number(instant[3]))) return null;
  }

  const normalized = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(normalized.getTime()) ? null : normalized;
}

function isCalendarDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function unavailable(locale: Locale) {
  return locale === "pl-PL" ? "Niedostępne" : "Unavailable";
}
