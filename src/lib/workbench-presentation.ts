export function getVisibleWorkbenchScoreLabel(
  scoreTotal: number,
  scoreLabel: string | null
) {
  const label = scoreLabel?.trim();
  if (!label) return null;

  const normalized = label.toLowerCase().replace(/\s+/g, " ");
  const repeatedScore = new RegExp(
    `^(?:(?:score(?:_total)?)|wynik)?\\s*[:=]?\\s*${scoreTotal}$`,
    "i"
  );

  return repeatedScore.test(normalized) ? null : label;
}
