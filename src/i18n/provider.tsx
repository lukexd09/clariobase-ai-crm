"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary, Translate } from "@/i18n/types";
import { createTranslator } from "@/i18n/translate";
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent, type PresentationDateTimeOptions } from "@/i18n/format";

type I18nContextValue = {
  locale: Locale;
  t: Translate;
  formatDate: (value: Parameters<typeof formatDate>[1], options?: PresentationDateTimeOptions) => string;
  formatDateTime: (value: Parameters<typeof formatDateTime>[1], options?: PresentationDateTimeOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency: string, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, locale, messages }: { children: React.ReactNode; locale: Locale; messages: Dictionary }) {
  const value = useMemo<I18nContextValue>(() => ({
    locale,
    t: createTranslator(locale, messages),
    formatDate: (input, options) => formatDate(locale, input, options),
    formatDateTime: (input, options) => formatDateTime(locale, input, options),
    formatNumber: (input, options) => formatNumber(locale, input, options),
    formatPercent: (input, options) => formatPercent(locale, input, options),
    formatCurrency: (input, currency, options) => formatCurrency(locale, input, currency, options)
  }), [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within I18nProvider");
  return value;
}
