import { headers } from "next/headers";
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent, type PresentationDateTimeOptions } from "@/i18n/format";
import { resolveRequestLocale } from "@/i18n/resolve-request-locale";
import { createTranslator, getDictionary } from "@/i18n/translate";

export async function getRequestLocale(requestHeaders?: Headers) {
  const resolvedHeaders = requestHeaders ?? (await headers());
  return resolveRequestLocale(resolvedHeaders.get("accept-language"));
}

export async function getI18n(requestHeaders?: Headers) {
  const locale = await getRequestLocale(requestHeaders);
  return {
    locale,
    messages: getDictionary(locale),
    t: createTranslator(locale),
    formatDate: (value: Parameters<typeof formatDate>[1], options?: PresentationDateTimeOptions) => formatDate(locale, value, options),
    formatDateTime: (value: Parameters<typeof formatDateTime>[1], options?: PresentationDateTimeOptions) => formatDateTime(locale, value, options),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(locale, value, options),
    formatPercent: (value: number, options?: Intl.NumberFormatOptions) => formatPercent(locale, value, options),
    formatCurrency: (value: number, currency: string, options?: Intl.NumberFormatOptions) => formatCurrency(locale, value, currency, options)
  };
}
