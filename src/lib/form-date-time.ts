import { PRESENTATION_TIME_ZONE } from "@/i18n/config";

const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)$/;
const instantPattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
const warsawParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRESENTATION_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

export function parseFormDateTime(value: unknown) {
  if (typeof value !== "string") return value;
  const local = localDateTimePattern.exec(value);
  if (local) return parseWarsawDateTimeLocal(local);
  return instantPattern.test(value) ? new Date(value) : new Date(Number.NaN);
}

function parseWarsawDateTimeLocal(match: RegExpExecArray) {
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
    return new Date(Number.NaN);
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

  return candidates.sort((left, right) => left.getTime() - right.getTime())[0] ?? new Date(Number.NaN);
}
