import { PRESENTATION_TIME_ZONE } from "@/i18n/config";
import { parseFormDateTime } from "@/lib/form-date-time";

const presentationDateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRESENTATION_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

type CalendarDay = {
  year: number;
  month: number;
  day: number;
};

export function getPresentationDayBounds(now = new Date()) {
  const today = getPresentationCalendarDay(now);
  const tomorrow = addCalendarDays(today, 1);
  const startOfPresentationDay = parsePresentationMidnight(today);
  const startOfNextPresentationDay = parsePresentationMidnight(tomorrow);
  return { startOfPresentationDay, startOfNextPresentationDay };
}

function getPresentationCalendarDay(value: Date) {
  const parts = Object.fromEntries(
    presentationDateParts
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day
  };
}

function addCalendarDays(value: CalendarDay, days: number) {
  const next = new Date(Date.UTC(value.year, value.month - 1, value.day + days));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate()
  };
}

function parsePresentationMidnight(value: CalendarDay) {
  const parsed = parseFormDateTime(`${pad(value.year, 4)}-${pad(value.month, 2)}-${pad(value.day, 2)}T00:00`);
  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid presentation day boundary");
  }
  return parsed;
}

function pad(value: number, size: number) {
  return String(value).padStart(size, "0");
}
