import { PRESENTATION_TIME_ZONE } from "@/i18n/config";
import { formatDateTimeLocalInput } from "@/i18n/format";

const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)$/;
const instantPattern = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
const originalInstantPattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;
const warsawParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRESENTATION_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

type ParseFormDateTimeOptions = {
  originalInstant?: unknown;
  expectedOriginalInstant?: Date | null | undefined;
};

export function parseFormDateTime(value: unknown, options: ParseFormDateTimeOptions = {}) {
  if (typeof value !== "string") return value;
  const local = localDateTimePattern.exec(value);
  if (local) return parseWarsawDateTimeLocal(local, value, options);
  const explicitInstant = instantPattern.exec(value);
  if (!explicitInstant || !isCalendarDate(Number(explicitInstant[1]), Number(explicitInstant[2]), Number(explicitInstant[3]))) {
    return invalidDate();
  }
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? invalidDate() : instant;
}

export function formatFormDateTimeOriginalInput(value: Date | null | undefined) {
  if (!value || Number.isNaN(value.getTime())) return "";
  return value.toISOString();
}

function parseWarsawDateTimeLocal(match: RegExpExecArray, value: string, options: ParseFormDateTimeOptions) {
  const target = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
  const calendarProbe = new Date(Date.UTC(target.year, target.month - 1, target.day));
  if (
    calendarProbe.getUTCFullYear() !== target.year ||
    calendarProbe.getUTCMonth() + 1 !== target.month ||
    calendarProbe.getUTCDate() !== target.day
  ) {
    return invalidDate();
  }

  const original = validateOriginalInstant(options);
  if (original === false) return invalidDate();
  if (original && formatDateTimeLocalInput(original) === value) {
    return new Date(original.getTime());
  }

  const wallClockAsUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
  const candidates: Date[] = [];
  for (const offsetMinutes of [60, 120]) {
    const candidate = new Date(wallClockAsUtc - offsetMinutes * 60_000);
    const parts = Object.fromEntries(
      warsawParts
        .formatToParts(candidate)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)])
    );
    if (
      parts.year === target.year &&
      parts.month === target.month &&
      parts.day === target.day &&
      parts.hour === target.hour &&
      parts.minute === target.minute
    ) {
      candidates.push(candidate);
    }
  }

  if (candidates.length !== 1) return invalidDate();
  return candidates[0];
}

function validateOriginalInstant(options: ParseFormDateTimeOptions) {
  if (!("expectedOriginalInstant" in options)) return null;

  const expected = options.expectedOriginalInstant;
  const submitted = options.originalInstant;
  if (expected === null || expected === undefined) {
    return submitted === "" || submitted === null || submitted === undefined ? null : false;
  }

  if (!(expected instanceof Date) || Number.isNaN(expected.getTime())) return false;
  if (typeof submitted !== "string" || !originalInstantPattern.test(submitted)) return false;

  const submittedInstant = new Date(submitted);
  if (Number.isNaN(submittedInstant.getTime()) || submittedInstant.toISOString() !== submitted) return false;
  return submittedInstant.getTime() === expected.getTime() ? expected : false;
}

function invalidDate() {
  return new Date(Number.NaN);
}

function isCalendarDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}
