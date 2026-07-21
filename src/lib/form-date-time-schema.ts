import type { z } from "zod";
import { parseFormDateTime } from "@/lib/form-date-time";

type DateTimeParseOptions = {
  code: string;
  ctx: z.RefinementCtx;
  originalInstant?: unknown;
  expectedOriginalInstant?: Date | null | undefined;
  path: string[];
};

export function parseOptionalDateTimeField(value: unknown, options: DateTimeParseOptions) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = parseFormDateTime(value, {
    originalInstant: options.originalInstant,
    expectedOriginalInstant: options.expectedOriginalInstant
  });
  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    options.ctx.addIssue({ code: "custom", message: options.code, path: options.path });
    return null;
  }
  return parsed;
}

export function parseRequiredDateTimeField(value: unknown, options: DateTimeParseOptions) {
  if (value === "" || value === null || value === undefined) return new Date();
  const parsed = parseOptionalDateTimeField(value, options);
  return parsed ?? new Date(Number.NaN);
}
