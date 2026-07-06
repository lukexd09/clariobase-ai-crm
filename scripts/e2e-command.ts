const exactTokenBoundary = String.raw`(?<![A-Za-z0-9_-])`;
const exactTokenEnd = String.raw`(?![A-Za-z0-9_-])`;

export type E2EMode = "smoke" | "area" | "full";
export type E2EArea = "dashboard" | "leads";

export const supportedE2EAreas: readonly E2EArea[] = ["dashboard", "leads"] as const;

export function resolveE2EMode(rawMode: string | undefined) {
  if (rawMode === "smoke" || rawMode === "area" || rawMode === "full") {
    return rawMode;
  }

  throw new Error(`Unknown E2E mode: ${rawMode ?? "<missing>"}`);
}

export function resolveE2EArea(rawArea: string | undefined) {
  const normalizedArea = rawArea?.trim().toLowerCase();

  if (normalizedArea === "dashboard" || normalizedArea === "leads") {
    return normalizedArea;
  }

  throw new Error(rawArea ? `Unknown E2E area: ${rawArea}` : "E2E area selection is required.");
}

export function buildPlaywrightGrepForMode(mode: E2EMode, area?: E2EArea) {
  if (mode === "smoke") {
    return `${exactTokenBoundary}@smoke${exactTokenEnd}`;
  }

  if (mode === "area") {
    if (!area) {
      throw new Error("E2E area selection is required.");
    }

    return `${exactTokenBoundary}@area:${area}${exactTokenEnd}`;
  }

  return "";
}

export function parseE2ECommandArgs(argv: string[]): { mode: E2EMode; area?: E2EArea } {
  const [rawMode, rawArea, ...extra] = argv;
  const mode = resolveE2EMode(rawMode);

  if (mode === "smoke" || mode === "full") {
    if (rawArea) {
      throw new Error(`${mode} mode does not accept extra arguments.`);
    }
    if (extra.length > 0) {
      throw new Error(`${mode} mode does not accept extra arguments.`);
    }
    return { mode };
  }

  const area = resolveE2EArea(rawArea);
  if (extra.length > 0) {
    throw new Error("area mode accepts exactly one area argument.");
  }

  return { mode, area };
}
